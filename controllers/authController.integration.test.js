import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import userModel from '../models/userModel.js';
import { registerController, loginController } from './authController.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

// Controller-level integration test: register -> login without HTTP layer
// AI attribution: Test cases are produced with the help of OpenAI ChatGPT(GPT-5) via cursor.

jest.setTimeout(60000);

describe('Auth Controllers - Controller-level Integration (register → login)', () => {
  let mongoServer;
  const downloadDir = path.resolve('.cache/mongodb-binaries');

  const createMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeAll(async () => {
    // Ensure JWT secret exists for token generation in loginController
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

    try {
      fs.mkdirSync(downloadDir, { recursive: true });
    } catch (e) {
      // ignore mkdir race
    }

    mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.5', downloadDir } });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await userModel.deleteMany({});
  });

  test('register then login success end-to-end without HTTP', async () => {
    // 1) Register
    const reqRegister = {
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890',
        address: 'Test Address',
        answer: 'blue',
      },
    };
    const resRegister = createMockRes();

    await registerController(reqRegister, resRegister);

    expect(resRegister.status).toHaveBeenCalledWith(201);
    expect(resRegister.json).toHaveBeenCalled();
    const registerPayload = resRegister.json.mock.calls[0][0];
    expect(registerPayload?.success).toBe(true);
    expect(registerPayload?.user?.email).toBe('test@example.com');

    // 2) Login
    const reqLogin = {
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    };
    const resLogin = createMockRes();

    await loginController(reqLogin, resLogin);

    expect(resLogin.status).toHaveBeenCalledWith(200);
    expect(resLogin.json).toHaveBeenCalled();
    const loginPayload = resLogin.json.mock.calls[0][0];
    expect(loginPayload?.success).toBe(true);
    expect(loginPayload?.token).toBeDefined();
    expect(loginPayload?.user?.email).toBe('test@example.com');
  });

  test('register/login responses do not expose plain password and DB stores hashed password', async () => {
    const reqRegister = {
      body: {
        name: 'Sec User',
        email: 'sec@example.com',
        password: 'password123',
        phone: '1234567890',
        address: 'Addr',
        answer: 'blue',
      },
    };
    const resRegister = createMockRes();
    await registerController(reqRegister, resRegister);

    const regPayload = resRegister.json.mock.calls[0][0];
    // 响应体不应包含明文密码（控制器会返回 user 对象，其中 password 为哈希）
    expect(regPayload?.user?.password).not.toBe('password123');

    const saved = await userModel.findOne({ email: 'sec@example.com' });
    expect(saved).toBeTruthy();
    expect(saved.password).toBeDefined();
    expect(saved.password).not.toBe('password123');
    const match = await bcrypt.compare('password123', saved.password);
    expect(match).toBe(true);

    const resLogin = createMockRes();
    await loginController({ body: { email: 'sec@example.com', password: 'password123' } }, resLogin);
    const loginPayload = resLogin.json.mock.calls[0][0];
    expect(loginPayload?.token).toBeDefined();
  });

  test('login returns verifiable JWT with correct payload', async () => {
    const resRegister = createMockRes();
    await registerController({ body: { name: 'JWT U', email: 'jwt@example.com', password: 'password123', phone: '1', address: 'A', answer: 'blue' } }, resRegister);

    const resLogin = createMockRes();
    await loginController({ body: { email: 'jwt@example.com', password: 'password123' } }, resLogin);
    const token = resLogin.json.mock.calls[0][0]?.token;
    expect(token).toBeDefined();

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    expect(payload?._id).toBeDefined();
  });

  test('duplicate email registration returns 200 with guidance message (per controller behavior)', async () => {
    const body = { name: 'Dup', email: 'dup@example.com', password: 'password123', phone: '1', address: 'A', answer: 'blue' };
    const r1 = createMockRes();
    await registerController({ body }, r1);
    expect(r1.status).toHaveBeenCalledWith(201);

    const r2 = createMockRes();
    await registerController({ body }, r2);
    // 当前实现对已注册用户返回 200 + success:false 提示登录
    expect(r2.status).toHaveBeenCalledWith(200);
    const payload2 = r2.send.mock.calls[0][0];
    expect(payload2?.success).toBe(false);
    expect((payload2?.message || '').toLowerCase()).toContain('already register');
  });

  test('missing required field (answer) returns 400', async () => {
    const resRegister = createMockRes();
    await registerController({ body: { name: 'NoA', email: 'noa@example.com', password: 'password123', phone: '1', address: 'A' } }, resRegister);
    expect(resRegister.status).toHaveBeenCalledWith(400);
    expect(resRegister.json).toHaveBeenCalledWith({ success: false, message: 'Answer is Required' });
  });

  test('login with wrong password returns 401', async () => {
    const r = createMockRes();
    await registerController({ body: { name: 'WP', email: 'wp@example.com', password: 'password123', phone: '1', address: 'A', answer: 'blue' } }, r);

    const resLogin = createMockRes();
    await loginController({ body: { email: 'wp@example.com', password: 'wrong' } }, resLogin);
    expect(resLogin.status).toHaveBeenCalledWith(401);
    expect(resLogin.json).toHaveBeenCalledWith({ success: false, message: 'Invalid Password' });
  });

  test('login with non-existent email returns 404', async () => {
    const resLogin = createMockRes();
    await loginController({ body: { email: 'none@example.com', password: 'password123' } }, resLogin);
    expect(resLogin.status).toHaveBeenCalledWith(404);
    expect(resLogin.json).toHaveBeenCalledWith({ success: false, message: 'Email is not registered' });
  });

  test('email case sensitivity behavior: different case fails login (per exact match)', async () => {
    const r = createMockRes();
    await registerController({ body: { name: 'Case', email: 'case@example.com', password: 'password123', phone: '1', address: 'A', answer: 'blue' } }, r);

    const resLogin = createMockRes();
    await loginController({ body: { email: 'CASE@example.com', password: 'password123' } }, resLogin);
    expect(resLogin.status).toHaveBeenCalledWith(404);
  });

  test('extra fields on registration are ignored by schema and default role is 0', async () => {
    const r = createMockRes();
    await registerController({ body: { name: 'Extra', email: 'extra@example.com', password: 'password123', phone: '1', address: 'A', answer: 'blue', isAdmin: true } }, r);
    expect(r.status).toHaveBeenCalledWith(201);

    const saved = await userModel.findOne({ email: 'extra@example.com' }).lean();
    expect(saved).toBeTruthy();
    expect(saved.role).toBe(0);
    expect(saved.isAdmin).toBeUndefined();
  });

  test('registration response does not leak password', async () => {
    const resRegister = createMockRes();
    await registerController({ 
      body: { 
        name: 'Privacy', 
        email: 'privacy@example.com', 
        password: 'secret123', 
        phone: '1234567890', 
        address: 'Privacy Address', 
        answer: 'privacy answer' 
      } 
    }, resRegister);

    expect(resRegister.status).toHaveBeenCalledWith(201);
    const response = resRegister.json.mock.calls[0][0];
    expect(response.user).toBeDefined();
    expect(response.user.password).toBeUndefined();
    expect(response.user._id).toBeDefined();
    expect(response.user.name).toBe('Privacy');
    expect(response.user.email).toBe('privacy@example.com');
  });

  test('login response does not leak password', async () => {
    const r = createMockRes();
    await registerController({ 
      body: { 
        name: 'Login Privacy', 
        email: 'loginprivacy@example.com', 
        password: 'secret123', 
        phone: '1234567890', 
        address: 'Login Privacy Address', 
        answer: 'login privacy answer' 
      } 
    }, r);

    const resLogin = createMockRes();
    await loginController({ body: { email: 'loginprivacy@example.com', password: 'secret123' } }, resLogin);

    expect(resLogin.status).toHaveBeenCalledWith(200);
    const response = resLogin.json.mock.calls[0][0];
    expect(response.user).toBeDefined();
    expect(response.user.password).toBeUndefined();
    expect(response.user._id).toBeDefined();
    expect(response.user.name).toBe('Login Privacy');
    expect(response.user.email).toBe('loginprivacy@example.com');
    expect(response.token).toBeDefined();
  });
});


