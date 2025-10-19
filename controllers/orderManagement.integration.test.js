import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import userModel from '../models/userModel.js';
import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js';
import categoryModel from '../models/categoryModel.js';
import {
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
  updateProfileController
} from './authController.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

// AI attribution: Test cases are produced with the help of OpenAI ChatGPT(GPT-5) via cursor.

// Increase timeout for MongoDB Memory Server
jest.setTimeout(60000);

describe('Order Management - Controller-level Integration (user orders → admin orders → status update)', () => {
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
    // Ensure JWT secret exists for token generation
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
    
    // Ensure download directory exists and is writable
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    mongoServer = await MongoMemoryServer.create({
      binary: { version: '7.0.5' },
      instance: {
        dbName: 'jest',
      },
      binaryDir: downloadDir,
    });
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
    // Clean up collections after each test
    await orderModel.deleteMany({});
    await productModel.deleteMany({});
    await categoryModel.deleteMany({});
    await userModel.deleteMany({});
  });

  describe('Order Management Flow', () => {
    let regularUser;
    let adminUser;
    let testProduct;
    let testOrder;

    beforeEach(async () => {
      // Create regular user
      const hashedPassword = await bcrypt.hash('user123', 10);
      regularUser = await userModel.create({
        name: 'Regular User',
        email: 'user@example.com',
        password: hashedPassword,
        phone: '1234567890',
        address: 'User Address',
        answer: 'user answer',
        role: 0 // Regular user
      });

      // Create admin user
      const adminHashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await userModel.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: adminHashedPassword,
        phone: '0987654321',
        address: 'Admin Address',
        answer: 'admin answer',
        role: 1 // Admin user
      });

      // Create category
      const category = await categoryModel.create({
        name: 'Test Category',
        slug: 'test-category'
      });

      // Create test product
      testProduct = await productModel.create({
        name: 'Test Product',
        slug: 'test-product',
        description: 'This is a test product',
        price: 99.99,
        category: category._id,
        quantity: 10,
        shipping: true
      });

      // Create test order
      testOrder = await orderModel.create({
        products: [testProduct._id],
        payment: {
          method: 'card',
          status: 'paid'
        },
        buyer: regularUser._id,
        status: 'Not Process'
      });
    });

    test('complete order management flow: user orders → admin view → status update', async () => {
      // Step 1: Regular user gets their own orders
      const userOrdersRes = createMockRes();
      const userOrdersReq = {
        user: { _id: regularUser._id }
      };

      await getOrdersController(userOrdersReq, userOrdersRes);

      expect(userOrdersRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: "Orders fetched successfully",
        data: expect.arrayContaining([
          expect.objectContaining({
            _id: testOrder._id,
            buyer: expect.objectContaining({
              _id: regularUser._id,
              name: 'Regular User'
            }),
            status: 'Not Process'
          })
        ])
      }));

      // Step 2: Admin gets all orders
      const adminOrdersRes = createMockRes();
      const adminOrdersReq = {
        user: { _id: adminUser._id, role: 1 }
      };

      await getAllOrdersController(adminOrdersReq, adminOrdersRes);

      expect(adminOrdersRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: "Orders fetched successfully",
        data: expect.arrayContaining([
          expect.objectContaining({
            _id: testOrder._id,
            buyer: expect.objectContaining({
              _id: regularUser._id,
              name: 'Regular User'
            }),
            status: 'Not Process'
          })
        ])
      }));

      // Step 3: Admin updates order status
      const updateStatusRes = createMockRes();
      const updateStatusReq = {
        params: { orderId: testOrder._id },
        body: { status: 'Processing' },
        user: { _id: adminUser._id, role: 1 }
      };

      await orderStatusController(updateStatusReq, updateStatusRes);

      expect(updateStatusRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('Order status updated successfully'),
        order: expect.objectContaining({
          _id: testOrder._id,
          status: 'Processing'
        })
      }));

      // Step 4: Verify the status update by getting orders again
      const verifyOrdersRes = createMockRes();
      const verifyOrdersReq = {
        user: { _id: regularUser._id }
      };

      await getOrdersController(verifyOrdersReq, verifyOrdersRes);

      const response = verifyOrdersRes.json.mock.calls[0][0];
      const updatedOrders = response.data;
      const updatedOrder = updatedOrders.find(order => order._id.toString() === testOrder._id.toString());
      expect(updatedOrder.status).toBe('Processing');
    });

    test('order status update with invalid status fails gracefully', async () => {
      const res = createMockRes();
      const req = {
        params: { orderId: testOrder._id },
        body: { status: 'InvalidStatus' },
        user: { _id: adminUser._id, role: 1 }
      };

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('Invalid status value')
      }));
    });

    test('order status update with non-existent order ID fails gracefully', async () => {
      const res = createMockRes();
      const req = {
        params: { orderId: new mongoose.Types.ObjectId() },
        body: { status: 'Processing' },
        user: { _id: adminUser._id, role: 1 }
      };

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('Order not found')
      }));
    });

    test('regular user cannot access all orders (admin only)', async () => {
      const res = createMockRes();
      const req = {
        user: { _id: regularUser._id, role: 0 }
      };

      await getAllOrdersController(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Admin access required"
      });
    });

    test('order status update by non-admin user fails (admin only)', async () => {
      const res = createMockRes();
      const req = {
        params: { orderId: testOrder._id },
        body: { status: 'Processing' },
        user: { _id: regularUser._id, role: 0 }
      };

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Admin access required"
      });
    });

    test('order status update with invalid order ID format', async () => {
      const res = createMockRes();
      const req = {
        params: { orderId: 'invalid-id' },
        body: { status: 'Processing' },
        user: { _id: adminUser._id, role: 1 }
      };

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid order ID format"
      });
    });

    test('profile update with invalid email format', async () => {
      const res = createMockRes();
      const req = {
        body: {
          email: 'invalid-email'
        },
        user: { _id: regularUser._id }
      };

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email format"
      });
    });

    test('profile update with duplicate email', async () => {
      // Create another user first
      const anotherUser = await userModel.create({
        name: 'Another User',
        email: 'another@example.com',
        password: 'password123',
        phone: '1234567890',
        address: 'Another Address',
        answer: 'another answer'
      });

      const res = createMockRes();
      const req = {
        body: {
          email: 'another@example.com'
        },
        user: { _id: regularUser._id }
      };

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Email already registered"
      });
    });

    test('user profile update works correctly', async () => {
      const res = createMockRes();
      const req = {
        body: {
          name: 'Updated User Name',
          phone: '9876543210',
          address: 'Updated User Address'
        },
        user: { _id: regularUser._id }
      };

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('Profile Updated Successfully'),
        data: expect.objectContaining({
          name: 'Updated User Name',
          phone: '9876543210',
          address: 'Updated User Address'
        })
      }));
    });

    test('order status progression: Not Process → Processing → Shipped → Delivered', async () => {
      const statuses = ['Not Process', 'Processing', 'Shipped', 'Delivered'];
      
      for (let i = 0; i < statuses.length; i++) {
        const res = createMockRes();
        const req = {
          params: { orderId: testOrder._id },
          body: { status: statuses[i] },
          user: { _id: adminUser._id, role: 1 }
        };

        await orderStatusController(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          order: expect.objectContaining({
            status: statuses[i]
          })
        }));
      }
    });

    test('order cancellation works correctly', async () => {
      const res = createMockRes();
      const req = {
        params: { orderId: testOrder._id },
        body: { status: 'Cancelled' },
        user: { _id: adminUser._id, role: 1 }
      };

      await orderStatusController(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        order: expect.objectContaining({
          status: 'Cancelled'
        })
      }));
    });

    test('user orders with populated product details', async () => {
      const res = createMockRes();
      const req = {
        user: { _id: regularUser._id }
      };

      await getOrdersController(req, res);

      const response = res.json.mock.calls[0][0];
      const orders = response.data;
      const order = orders[0];
      
      // Verify that products are populated with details
      expect(order.products).toBeDefined();
      expect(order.products[0]).toMatchObject({
        name: 'Test Product',
        price: 99.99
      });
    });

    test('admin orders with populated buyer and product details', async () => {
      const res = createMockRes();
      const req = {
        user: { _id: adminUser._id, role: 1 }
      };

      await getAllOrdersController(req, res);

      const response = res.json.mock.calls[0][0];
      const orders = response.data;
      const order = orders[0];
      
      // Verify that buyer and products are populated
      expect(order.buyer).toMatchObject({
        name: 'Regular User'
      });
      expect(order.products[0]).toMatchObject({
        name: 'Test Product'
      });
    });
  });
});
