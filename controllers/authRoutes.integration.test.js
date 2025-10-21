import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import authRoutes from '../routes/authRoute.js';
import userModel from '../models/userModel.js';

jest.setTimeout(30000);

describe('Auth Routes - High-level Integration', () => {
  let mongod;
  let app;
  let server;
  let normalUser;
  let adminUser;
  let normalToken;
  let adminToken;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/v1/auth', authRoutes);
    server = app.listen(0); // random available port
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await mongod.stop();
    await server.close();
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
    // Register a normal user via HTTP
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Normal User',
        email: 'user@example.com',
        password: 'password123',
        phone: '1234567890',
        address: 'Addr',
        answer: 'blue',
      });
    expect(regRes.status).toBe(201);
    normalUser = await userModel.findOne({ email: 'user@example.com' });
    // Register an admin user directly
    adminUser = await userModel.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'hashed-password',
      phone: '1234567890',
      address: 'Addr',
      answer: 'blue',
      role: 1,
    });
    // Login both users to get tokens
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'password123' });
    expect(loginRes.status).toBe(200);
    normalToken = loginRes.body.token;
    adminToken = jwt.sign({ _id: adminUser._id, role: 1 }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  test('Normal user can access user-auth but not admin-auth', async () => {
    // user-auth
    const userRes = await request(app)
      .get('/api/v1/auth/user-auth')
      .set('Authorization', normalToken);
    expect(userRes.status).toBe(200);
    expect(userRes.body).toEqual({ ok: true });
    // admin-auth
    const adminRes = await request(app)
      .get('/api/v1/auth/admin-auth')
      .set('Authorization', normalToken);
    expect(adminRes.status).toBe(401);
    expect(adminRes.body.success).toBe(false);
  });

  test('Admin user can access both user-auth and admin-auth', async () => {
    // user-auth
    const userRes = await request(app)
      .get('/api/v1/auth/user-auth')
      .set('Authorization', adminToken);
    expect(userRes.status).toBe(200);
    expect(userRes.body).toEqual({ ok: true });
    // admin-auth
    const adminRes = await request(app)
      .get('/api/v1/auth/admin-auth')
      .set('Authorization', adminToken);
    expect(adminRes.status).toBe(200);
    expect(adminRes.body).toEqual({ ok: true });
  });


  test('Protected routes reject invalid or missing tokens', async () => {
    // No token
    const res1 = await request(app).get('/api/v1/auth/user-auth');
    expect(res1.status).toBe(401);
    // Invalid token
    const res2 = await request(app)
      .get('/api/v1/auth/user-auth')
      .set('Authorization', 'invalid.token.here');
    expect(res2.status).toBe(401);
    // Expired token
    const expiredToken = jwt.sign({ _id: normalUser._id }, process.env.JWT_SECRET, { expiresIn: -1 });
    const res3 = await request(app)
      .get('/api/v1/auth/user-auth')
      .set('Authorization', expiredToken);
    expect(res3.status).toBe(401);
  });

  test('Forgot password flow works and login with new password', async () => {
    // Forgot password
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'user@example.com', answer: 'blue', newPassword: 'newpass123' });
    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.success).toBe(true);
    // Login with new password
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'newpass123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
  });
});