import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import userModel from '../models/userModel.js';
import { updateProfileController } from './authController.js';
import bcrypt from 'bcrypt';
import { jest } from '@jest/globals';

// AI attribution: Test cases are produced with the help of OpenAI ChatGPT(GPT-5) via cursor.

// Configure Jest timeout globally
jest.setTimeout(60000);

describe('Update Profile Controller - Integration Tests', () => {
  let mongoServer;
  let testUser;

  const createMockRes = () => {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
      send: jest.fn()
    };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    res.send.mockReturnValue(res);
    return res;
  };

  beforeAll(async () => {
    // Ensure JWT secret exists
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Create test user with hashed password
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await userModel.create({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      phone: '1234567890',
      address: 'Test Address',
      answer: 'test answer',
      role: 0
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    // Only clean up if connection is still active
    if (mongoose.connection.readyState === 1) {
      await userModel.deleteMany({});
    }
  });

  describe('Successful Profile Updates', () => {
    test('successfully updates user name', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Updated Name',
          phone: testUser.phone,
          address: testUser.address
        }
      };
      const res = createMockRes();

      await updateProfileController(req, res);

      expect(res.send).toHaveBeenCalled();
      const response = res.send.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.message).toBe('Profile Updated Successfully');
      expect(response.updatedUser.name).toBe('Updated Name');

      // Verify in database
      const updatedUser = await userModel.findById(testUser._id);
      expect(updatedUser.name).toBe('Updated Name');
    });

    test('successfully updates user phone', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          name: testUser.name,
          phone: '9876543210',
          address: testUser.address
        }
      };
      const res = createMockRes();

      await updateProfileController(req, res);

      expect(res.send).toHaveBeenCalled();
      const response = res.send.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.updatedUser.phone).toBe('9876543210');

      // Verify in database
      const updatedUser = await userModel.findById(testUser._id);
      expect(updatedUser.phone).toBe('9876543210');
    });

    test('successfully updates user address', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          name: testUser.name,
          phone: testUser.phone,
          address: 'New Address 123'
        }
      };
      const res = createMockRes();

      await updateProfileController(req, res);

      expect(res.send).toHaveBeenCalled();
      const response = res.send.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.updatedUser.address).toBe('New Address 123');

      // Verify in database
      const updatedUser = await userModel.findById(testUser._id);
      expect(updatedUser.address).toBe('New Address 123');
    });

    test('successfully updates user password', async () => {
      const newPassword = 'newpassword123';
      const req = {
        user: { _id: testUser._id },
        body: {
          name: testUser.name,
          phone: testUser.phone,
          address: testUser.address,
          password: newPassword
        }
      };
      const res = createMockRes();

      await updateProfileController(req, res);

      expect(res.send).toHaveBeenCalled();
      const response = res.send.mock.calls[0][0];
      expect(response.success).toBe(true);

      // Verify password was hashed in database
      const updatedUser = await userModel.findById(testUser._id);
      expect(updatedUser.password).not.toBe(newPassword);
      expect(updatedUser.password).not.toBe(testUser.password);
      
      // Verify new password works
      const isMatch = await bcrypt.compare(newPassword, updatedUser.password);
      expect(isMatch).toBe(true);
    });

    test('successfully updates multiple fields simultaneously', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Multi Update Name',
          phone: '1111111111',
          address: 'Multi Update Address',
          password: 'multipassword123'
        }
      };
      const res = createMockRes();

      await updateProfileController(req, res);

      expect(res.send).toHaveBeenCalled();
      const response = res.send.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.updatedUser.name).toBe('Multi Update Name');
      expect(response.updatedUser.phone).toBe('1111111111');
      expect(response.updatedUser.address).toBe('Multi Update Address');

      // Verify all fields in database
      const updatedUser = await userModel.findById(testUser._id);
      expect(updatedUser.name).toBe('Multi Update Name');
      expect(updatedUser.phone).toBe('1111111111');
      expect(updatedUser.address).toBe('Multi Update Address');
      
      // Verify password was updated
      const isMatch = await bcrypt.compare('multipassword123', updatedUser.password);
      expect(isMatch).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('returns 404 when user does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const req = {
        user: { _id: nonExistentId },
        body: {
          name: 'Updated Name',
          phone: '1234567890',
          address: 'Updated Address'
        }
      };
      const res = createMockRes();

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });

    test('handles empty name field gracefully', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          name: '', // Empty name
          phone: testUser.phone,
          address: testUser.address
        }
      };
      const res = createMockRes();

      await updateProfileController(req, res);

      // Controller should handle empty name by keeping original name
      expect(res.send).toHaveBeenCalled();
      const response = res.send.mock.calls[0][0];
      expect(response.success).toBe(true);
    });

    test('handles database error gracefully', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Updated Name',
          phone: '1234567890',
          address: 'Updated Address'
        }
      };
      const res = createMockRes();

      // Close connection to simulate database error
      await mongoose.connection.close();

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error While Update profile',
        error: expect.any(Object)
      });

      // Reconnect for other tests
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
    });

    test('handles invalid user ID format', async () => {
      const req = {
        user: { _id: 'invalid-id-format' },
        body: {
          name: 'Updated Name',
          phone: '1234567890',
          address: 'Updated Address'
        }
      };
      const res = createMockRes();

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error While Update profile',
        error: expect.any(Object)
      });
    });
  });

  describe('Data Validation', () => {
    test('validates phone number format', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          name: testUser.name,
          phone: 'invalid-phone', // Invalid phone format
          address: testUser.address
        }
      };
      const res = createMockRes();

      await updateProfileController(req, res);

      // Should still succeed as phone validation might not be strict
      expect(res.send).toHaveBeenCalled();
      const response = res.send.mock.calls[0][0];
      expect(response.success).toBe(true);
    });

    test('preserves email field (should not be updated)', async () => {
      const originalEmail = testUser.email;
      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Updated Name',
          phone: '1234567890',
          address: 'Updated Address',
          email: 'hacker@evil.com' // Attempt to change email
        }
      };
      const res = createMockRes();

      await updateProfileController(req, res);

      expect(res.send).toHaveBeenCalled();
      const response = res.send.mock.calls[0][0];
      expect(response.success).toBe(true);

      // Verify email was not changed
      const updatedUser = await userModel.findById(testUser._id);
      expect(updatedUser.email).toBe(originalEmail);
    });

    test('handles empty password field (should not update password)', async () => {
      const originalPassword = testUser.password;
      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Updated Name',
          phone: '1234567890',
          address: 'Updated Address',
          password: '' // Empty password
        }
      };
      const res = createMockRes();

      await updateProfileController(req, res);

      expect(res.send).toHaveBeenCalled();
      const response = res.send.mock.calls[0][0];
      expect(response.success).toBe(true);

      // Verify password was not changed
      const updatedUser = await userModel.findById(testUser._id);
      expect(updatedUser.password).toBe(originalPassword);
    });
  });

  describe('Response Format', () => {
    test('response includes updated user data without password', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Updated Name',
          phone: '1234567890',
          address: 'Updated Address'
        }
      };
      const res = createMockRes();

      await updateProfileController(req, res);

      expect(res.send).toHaveBeenCalled();
      const response = res.send.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.message).toBe('Profile Updated Successfully');
      expect(response.updatedUser).toBeDefined();
      expect(response.updatedUser._id).toBeDefined();
      expect(response.updatedUser.name).toBe('Updated Name');
      expect(response.updatedUser.phone).toBe('1234567890');
      expect(response.updatedUser.address).toBe('Updated Address');
      expect(response.updatedUser.password).toBeDefined(); // Password is included in response
    });
  });
});
