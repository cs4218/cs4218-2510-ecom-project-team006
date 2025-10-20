import { 
  registerController,
  loginController,
  forgotPasswordController,
  updateProfileController, 
  getOrdersController, 
  getAllOrdersController, 
  orderStatusController 
} from './authController.js';
import userModel from '../models/userModel.js';
import orderModel from '../models/orderModel.js';
import { hashPassword, comparePassword } from '../helpers/authHelper.js';
import JWT from 'jsonwebtoken';

// AI attribution: Some test cases are produced with the help of OpenAI ChatGPT(GPT-5) via cursor.

// Mock models
jest.mock('../models/userModel.js');
jest.mock('../models/orderModel.js');
jest.mock('../helpers/authHelper.js');
jest.mock('jsonwebtoken', () => ({ sign: jest.fn(() => 'fake.jwt.token') }));

describe('Auth Controller - Essential Tests', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      user: { _id: 'user123' },
      body: {},
      params: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('registerController Tests', () => {
    test('registers user successfully with all required fields', async () => {
      // Arrange
      const mockUserData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '6512345678',
        address: '123 Main St',
        answer: 'blue'
      };
      
      mockReq.body = mockUserData;
      
      userModel.findOne.mockResolvedValue(null); // No existing user
      hashPassword.mockResolvedValue('hashedPassword123');
      
      const savedUser = {
        _id: 'user123',
        ...mockUserData,
        password: 'hashedPassword123'
      };
      // Mock the constructor behaviour: new userModel(...).save()
      let createdInstance;
      userModel.mockImplementation(function (data) {
        createdInstance = { ...data, save: jest.fn().mockResolvedValue(savedUser) };
        return createdInstance;
      });

      // Act
      await registerController(mockReq, mockRes);

      // Assert
      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(hashPassword).toHaveBeenCalledWith('password123');
      // assert the constructor received the hashed password and save was called
      expect(createdInstance).toBeDefined();
      expect(createdInstance.password).toBe('hashedPassword123');
      expect(createdInstance.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        success: true,
        message: "User Register Successfully",
        user: savedUser
      });
    });

    test('returns already registered when user exists', async () => {
      const mockUserData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '6512345678',
        address: '123 Main St',
        answer: 'blue'
      };
      mockReq.body = mockUserData;
      userModel.findOne.mockResolvedValue({ _id: 'existingUser' });// existing user

      await registerController(mockReq, mockRes);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        success: false,
        message: 'Already Register please login'
      });
    });

    test('returns message when name is missing', async () => {
      // provide a full valid body but name undefined
      mockReq.body = {
        name: undefined,
        email: 'john@example.com',
        password: 'password123',
        phone: '6512345678',
        address: '123 Main St',
        answer: 'blue'
      };
      await registerController(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'Name is Required' });
    });

    test('returns message when email is missing', async () => {
      mockReq.body = {
        name: 'John Doe',
        email: undefined,
        password: 'password123',
        phone: '6512345678',
        address: '123 Main St',
        answer: 'blue'
      };
      await registerController(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'Email is Required' });
    });

    test('returns message when password is missing', async () => {
      mockReq.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: undefined,
        phone: '6512345678',
        address: '123 Main St',
        answer: 'blue'
      };
      await registerController(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'Password is Required' });
    });

    test('returns message when phone is missing', async () => {
      mockReq.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: undefined,
        address: '123 Main St',
        answer: 'blue'
      };
      await registerController(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'Phone no is Required' });
    });

    test('returns message when address is missing', async () => {
      mockReq.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '6512345678',
        address: undefined,
        answer: 'blue'
      };
      await registerController(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'Address is Required' });
    });

    test('returns message when answer is missing', async () => {
      mockReq.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '6512345678',
        address: '123 Main St',
        answer: undefined
      };
      await registerController(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'Answer is Required' });
    });

    test('returns 500 and error message when save fails', async () => {
      // Arrange: valid body but save will fail
      mockReq.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '6512345678',
        address: '123 Main St',
        answer: 'blue'
      };
      userModel.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashedPassword123');

      userModel.mockImplementation(function (data) {
        return { ...data, save: jest.fn().mockRejectedValue(new Error('DB save failed')) };
      });

      // Act
      await registerController(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Error in Registration'
        }));
    });

  });

  describe('testController', () => {
    test('returns protected route message', () => {
      // Act
      const localReq = {};
      const localRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const { testController } = require('./authController.js');
      testController(localReq, localRes);

      // Assert
      expect(localRes.status).toHaveBeenCalledWith(200);
      expect(localRes.json).toHaveBeenCalledWith({ success: true, message: 'Protected Route' });
    });
  });

  describe('loginController Tests', () => {
    test('logs in successfully with valid credentials', async () => {
      // Arrange
      mockReq.body = { email: 'john@example.com', password: 'password123' };
      const foundUser = { _id: 'user123', password: 'hashedPassword123', name: 'John', email: 'john@example.com', phone: '6512345678', address: '123 Main St', role: 0 };
      userModel.findOne.mockResolvedValue(foundUser);
      comparePassword.mockResolvedValue(true);

      // Act
      await loginController(mockReq, mockRes);

      // Assert
      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(comparePassword).toHaveBeenCalledWith('password123', 'hashedPassword123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('login'),
        token: expect.any(String),
        user: expect.objectContaining({ _id: 'user123', email: 'john@example.com' })
      }));
    });

    test('returns error when email or password missing', async () => {
      mockReq.body = { email: undefined, password: undefined };
      await loginController(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({ success: false, message: 'Missing email or password' });
    });

    test('returns 404 when user not found', async () => {
      mockReq.body = { email: 'noone@example.com', password: 'x' };
      userModel.findOne.mockResolvedValue(null);
      await loginController(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({ success: false, message: 'Email is not registered' });
    });

    test('returns 401 on invalid password', async () => {
      mockReq.body = { email: 'john@example.com', password: 'wrong' };
      const foundUser = { _id: 'user123', password: 'hashedPassword123' };
      userModel.findOne.mockResolvedValue(foundUser);
      comparePassword.mockResolvedValue(false);
      await loginController(mockReq, mockRes);
      expect(comparePassword).toHaveBeenCalledWith('wrong', 'hashedPassword123');
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith({ success: false, message: 'Invalid Password' });
    });

    test('handles DB errors during lookup', async () => {
      mockReq.body = { email: 'john@example.com', password: 'password123' };
      userModel.findOne.mockRejectedValue(new Error('DB error'));
      await loginController(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('handles JWT.sign throwing an error', async () => {
      // Arrange
      mockReq.body = { email: 'john@example.com', password: 'password123' };
      const foundUser = { _id: 'user123', password: 'hashedPassword123', name: 'John', email: 'john@example.com', phone: '6512345678', address: '123 Main St', role: 0 };
      userModel.findOne.mockResolvedValue(foundUser);
      comparePassword.mockResolvedValue(true);
      // make JWT.sign throw
      const realSign = JWT.sign;
      JWT.sign = jest.fn(() => { throw new Error('JWT failure'); });

      // Act
      await loginController(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);

      // cleanup
      JWT.sign = realSign;
    });
  });

  describe('forgotPasswordController Tests', () => {
    test('resets password successfully with correct email and answer', async () => {
      // Arrange
      mockReq.body = { email: 'john@example.com', answer: 'blue', newPassword: 'newPass123' };
      const foundUser = { _id: 'user123', email: 'john@example.com' };
      userModel.findOne.mockResolvedValue(foundUser);
      hashPassword.mockResolvedValue('hashedNewPass');
      userModel.findByIdAndUpdate.mockResolvedValue({});

      // Act
      await forgotPasswordController(mockReq, mockRes);

      // Assert
      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'john@example.com', answer: 'blue' });
      expect(hashPassword).toHaveBeenCalledWith('newPass123');
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith('user123', { password: 'hashedNewPass' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({ success: true, message: 'Password Reset Successfully' });
    });

    test('returns 400 when email is missing', async () => {
      mockReq.body = { answer: 'blue', newPassword: 'newPass123' };
      await forgotPasswordController(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'Email is required' });
    });

    test('returns 400 when answer is missing', async () => {
      mockReq.body = { email: 'john@example.com', newPassword: 'newPass123' };
      await forgotPasswordController(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'Answer is required' });
    });

    test('returns 400 when newPassword is missing', async () => {
      mockReq.body = { email: 'john@example.com', answer: 'blue' };
      await forgotPasswordController(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'New Password is required' });
    });

    test('returns 404 when email/answer do not match', async () => {
      mockReq.body = { email: 'john@example.com', answer: 'wrong', newPassword: 'newPass123' };
      userModel.findOne.mockResolvedValue(null);
      await forgotPasswordController(mockReq, mockRes);
      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'john@example.com', answer: 'wrong' });
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({ success: false, message: 'Wrong Email Or Answer' });
    });

    test('handles database errors', async () => {
      mockReq.body = { email: 'john@example.com', answer: 'blue', newPassword: 'newPass123' };
      userModel.findOne.mockRejectedValue(new Error('DB fail'));
      await forgotPasswordController(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateProfileController Tests', () => {
    test('updates user profile successfully', async () => {
      // Arrange
      const mockUser = { _id: 'user123', name: 'John', email: 'john@test.com' };
      const updatedUser = { _id: 'user123', name: 'Jane', email: 'john@test.com' };
      userModel.findById.mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);
      hashPassword.mockResolvedValue('hashedPassword');
      
      mockReq.body = { name: 'Jane', phone: '1234567890' };

      // Act
      await updateProfileController(mockReq, mockRes);

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith('user123');
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({ name: 'Jane' }),
        { new: true }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('validates password length', async () => {
      // Arrange
      mockReq.body = { password: '123' };

      // Act
      await updateProfileController(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({ 
        error: "Password is required and 6 character long" 
      });
    });

    test('handles user not found', async () => {
      // Arrange
      userModel.findById.mockResolvedValue(null);

      // Act
      await updateProfileController(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: "User not found"
      });
    });

    test('handles database errors', async () => {
      // Arrange
      userModel.findById.mockRejectedValue(new Error('Database error'));

      // Act
      await updateProfileController(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getOrdersController Tests', () => {
    test('gets user orders successfully', async () => {
      // Arrange
      const mockOrders = [{ _id: 'order1', products: [], buyer: 'user123' }];
      orderModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockOrders)
        })
      });

      // Act
      await getOrdersController(mockReq, mockRes);

      // Assert
      expect(orderModel.find).toHaveBeenCalledWith({ buyer: 'user123' });
      expect(mockRes.json).toHaveBeenCalledWith(mockOrders);
    });

    test('handles no orders found', async () => {
      // Arrange
      orderModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue([])
        })
      });

      // Act
      await getOrdersController(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "No orders found",
        orders: []
      });
    });

    test('handles database errors', async () => {
      // Arrange
      orderModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      });

      // Act
      await getOrdersController(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAllOrdersController Tests', () => {
    test('gets all orders successfully', async () => {
      // Arrange
      const mockOrders = [{ _id: 'order1' }, { _id: 'order2' }];
      orderModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockOrders)
          })
        })
      });

      // Act
      await getAllOrdersController(mockReq, mockRes);

      // Assert
      expect(orderModel.find).toHaveBeenCalledWith({});
      expect(mockRes.json).toHaveBeenCalledWith(mockOrders);
    });

    test('handles no orders found', async () => {
      // Arrange
      orderModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([])
          })
        })
      });

      // Act
      await getAllOrdersController(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "No orders found",
        orders: []
      });
    });

    test('handles database errors', async () => {
      // Arrange
      orderModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      });

      // Act
      await getAllOrdersController(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('orderStatusController Tests', () => {
    test('updates order status successfully', async () => {
      // Arrange
      const mockOrder = { _id: 'order123', status: 'Processing' };
      const updatedOrder = { _id: 'order123', status: 'Shipped' };
      orderModel.findById.mockResolvedValue(mockOrder);
      orderModel.findByIdAndUpdate.mockResolvedValue(updatedOrder);
      
      mockReq.params = { orderId: 'order123' };
      mockReq.body = { status: 'Shipped' };

      // Act
      await orderStatusController(mockReq, mockRes);

      // Assert
      expect(orderModel.findById).toHaveBeenCalledWith('order123');
      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'order123',
        { status: 'Shipped' },
        { new: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Order status updated successfully",
        order: updatedOrder
      });
    });

    test('validates status value', async () => {
      // Arrange
      mockReq.params = { orderId: 'order123' };
      mockReq.body = { status: 'InvalidStatus' };

      // Act
      await orderStatusController(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining("Invalid status value")
      });
    });

    test('handles order not found', async () => {
      // Arrange
      orderModel.findById.mockResolvedValue(null);
      mockReq.params = { orderId: 'nonexistent' };
      mockReq.body = { status: 'Processing' };

      // Act
      await orderStatusController(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: "Order not found"
      });
    });

    test('handles database errors', async () => {
      // Arrange
      orderModel.findById.mockRejectedValue(new Error('Database error'));
      mockReq.params = { orderId: 'order123' };
      mockReq.body = { status: 'Processing' };

      // Act
      await orderStatusController(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});