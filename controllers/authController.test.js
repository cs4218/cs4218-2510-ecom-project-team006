import { 
  updateProfileController, 
  getOrdersController, 
  getAllOrdersController, 
  orderStatusController 
} from './authController.js';
import userModel from '../models/userModel.js';
import orderModel from '../models/orderModel.js';
import { hashPassword } from '../helpers/authHelper.js';

// AI attribution: Some test cases are produced with the help of OpenAI ChatGPT(GPT-5) via cursor.

// Mock models
jest.mock('../models/userModel.js');
jest.mock('../models/orderModel.js');
jest.mock('../helpers/authHelper.js');

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
