import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import userModel from '../models/userModel.js';
import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js';
import categoryModel from '../models/categoryModel.js';
import { getOrdersController, getAllOrdersController, orderStatusController } from './authController.js';
import { jest } from '@jest/globals';

// AI attribution: Test cases are produced with the help of OpenAI ChatGPT(GPT-5) via cursor.

// Configure Jest timeout globally
jest.setTimeout(60000);

describe('Order Management - Controller-level Integration Tests', () => {
  let mongoServer;
  let testUser;
  let testUser2;
  let testAdmin;
  let testCategory;
  let testProduct1;
  let testProduct2;
  let testOrder1;
  let testOrder2;

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
    // Create test users
    testUser = await userModel.create({
      name: 'Test User 1',
      email: 'user1@test.com',
      password: 'hashedpassword123',
      phone: '1234567890',
      address: 'Test Address 1',
      answer: 'test answer',
      role: 0
    });

    testUser2 = await userModel.create({
      name: 'Test User 2',
      email: 'user2@test.com',
      password: 'hashedpassword123',
      phone: '0987654321',
      address: 'Test Address 2',
      answer: 'test answer',
      role: 0
    });

    testAdmin = await userModel.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'hashedpassword123',
      phone: '1111111111',
      address: 'Admin Address',
      answer: 'admin answer',
      role: 1
    });

    // Create test category
    testCategory = await categoryModel.create({
      name: 'Test Category',
      slug: 'test-category'
    });

    // Create test products
    testProduct1 = await productModel.create({
      name: 'Test Product 1',
      slug: 'test-product-1',
      description: 'Test Description 1',
      price: 100,
      category: testCategory._id,
      quantity: 10,
      shipping: true
    });

    testProduct2 = await productModel.create({
      name: 'Test Product 2',
      slug: 'test-product-2',
      description: 'Test Description 2',
      price: 200,
      category: testCategory._id,
      quantity: 5,
      shipping: false
    });

    // Create test orders
    testOrder1 = await orderModel.create({
      products: [testProduct1._id, testProduct2._id],
      payment: { success: true, transactionId: 'txn123' },
      buyer: testUser._id,
      status: 'Not Processed'
    });

    testOrder2 = await orderModel.create({
      products: [testProduct1._id],
      payment: { success: true, transactionId: 'txn456' },
      buyer: testUser2._id,
      status: 'Processing'
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await orderModel.deleteMany({});
    await productModel.deleteMany({});
    await categoryModel.deleteMany({});
    await userModel.deleteMany({});
  });

  describe('getOrdersController - User Orders', () => {
    test('user successfully retrieves their own orders', async () => {
      const req = {
        user: { _id: testUser._id }
      };
      const res = createMockRes();

      await getOrdersController(req, res);

      expect(res.json).toHaveBeenCalled();
      const orders = res.json.mock.calls[0][0];
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBe(1);
      expect(orders[0].buyer.name).toBe('Test User 1');
      expect(orders[0].products.length).toBe(2);
      expect(orders[0].status).toBe('Not Processed');
    });

    test('user with no orders receives empty array', async () => {
      // Create a new user with no orders
      const newUser = await userModel.create({
        name: 'New User',
        email: 'newuser@test.com',
        password: 'hashedpassword123',
        phone: '9999999999',
        address: 'New Address',
        answer: 'new answer',
        role: 0
      });

      const req = {
        user: { _id: newUser._id }
      };
      const res = createMockRes();

      await getOrdersController(req, res);

      expect(res.json).toHaveBeenCalled();
      const orders = res.json.mock.calls[0][0];
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBe(0);
    });

    test('user only receives their own orders, not other users orders', async () => {
      const req = {
        user: { _id: testUser._id }
      };
      const res = createMockRes();

      await getOrdersController(req, res);

      const orders = res.json.mock.calls[0][0];
      expect(orders.length).toBe(1);
      expect(orders[0].buyer._id.toString()).toBe(testUser._id.toString());
      
      // Verify it's not user2's order
      expect(orders[0]._id.toString()).not.toBe(testOrder2._id.toString());
    });

    test('orders include populated product and buyer information', async () => {
      const req = {
        user: { _id: testUser._id }
      };
      const res = createMockRes();

      await getOrdersController(req, res);

      const orders = res.json.mock.calls[0][0];
      expect(orders[0].buyer).toBeDefined();
      expect(orders[0].buyer.name).toBe('Test User 1');
      expect(orders[0].products).toBeDefined();
      expect(orders[0].products.length).toBe(2);
      expect(orders[0].products[0].name).toBeDefined();
    });

    test('handles database error gracefully', async () => {
      const req = {
        user: { _id: testUser._id }
      };
      const res = createMockRes();

      // Force a database error by using an invalid ID format
      req.user._id = 'invalid-id-format';

      await getOrdersController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Error While Getting Orders'
        })
      );
    });
  });

  describe('getAllOrdersController - Admin Orders', () => {
    test('admin successfully retrieves all orders from all users', async () => {
      const req = {
        user: { _id: testAdmin._id, role: 1 }
      };
      const res = createMockRes();

      await getAllOrdersController(req, res);

      expect(res.json).toHaveBeenCalled();
      const orders = res.json.mock.calls[0][0];
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBe(2);
      
      // Verify both users' orders are included
      const buyerIds = orders.map(o => o.buyer._id.toString());
      expect(buyerIds).toContain(testUser._id.toString());
      expect(buyerIds).toContain(testUser2._id.toString());
    });

    test('orders are sorted by creation time in descending order', async () => {
      // Create a third order with a later timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      const testOrder3 = await orderModel.create({
        products: [testProduct2._id],
        payment: { success: true, transactionId: 'txn789' },
        buyer: testUser._id,
        status: 'Shipped'
      });

      const req = {
        user: { _id: testAdmin._id, role: 1 }
      };
      const res = createMockRes();

      await getAllOrdersController(req, res);

      const orders = res.json.mock.calls[0][0];
      expect(orders.length).toBe(3);
      
      // Most recent order should be first
      expect(orders[0]._id.toString()).toBe(testOrder3._id.toString());
      expect(orders[0].status).toBe('Shipped');
    });

    test('returns empty array when no orders exist', async () => {
      // Clear all orders
      await orderModel.deleteMany({});

      const req = {
        user: { _id: testAdmin._id, role: 1 }
      };
      const res = createMockRes();

      await getAllOrdersController(req, res);

      expect(res.json).toHaveBeenCalled();
      const orders = res.json.mock.calls[0][0];
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBe(0);
    });

    test('orders include populated product and buyer information', async () => {
      const req = {
        user: { _id: testAdmin._id, role: 1 }
      };
      const res = createMockRes();

      await getAllOrdersController(req, res);

      const orders = res.json.mock.calls[0][0];
      orders.forEach(order => {
        expect(order.buyer).toBeDefined();
        expect(order.buyer.name).toBeDefined();
        expect(order.products).toBeDefined();
        expect(order.products.length).toBeGreaterThan(0);
        expect(order.products[0].name).toBeDefined();
      });
    });

    test('handles database error gracefully', async () => {
      const req = {
        user: { _id: testAdmin._id, role: 1 }
      };
      const res = createMockRes();

      // Mock a database error by closing the connection temporarily
      await mongoose.connection.close();

      await getAllOrdersController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Error While Getting Orders'
        })
      );

      // Reconnect for other tests
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
    });
  });

  describe('orderStatusController - Update Order Status', () => {
    test('successfully updates order status', async () => {
      const req = {
        user: { _id: testAdmin._id, role: 1 },
        params: { orderId: testOrder1._id.toString() },
        body: { status: 'Processing' }
      };
      const res = createMockRes();

      await orderStatusController(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.message).toBe('Order status updated successfully');
      expect(response.order.status).toBe('Processing');

      // Verify in database
      const updatedOrder = await orderModel.findById(testOrder1._id);
      expect(updatedOrder.status).toBe('Processing');
    });

    test('successfully updates order through all valid status transitions', async () => {
      const validStatuses = ['Not Processed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
      
      for (const status of validStatuses) {
        const req = {
          user: { _id: testAdmin._id, role: 1 },
          params: { orderId: testOrder1._id.toString() },
          body: { status }
        };
        const res = createMockRes();

        await orderStatusController(req, res);

        expect(res.json).toHaveBeenCalled();
        const response = res.json.mock.calls[0][0];
        expect(response.success).toBe(true);
        expect(response.order.status).toBe(status);
      }
    });

    test('rejects invalid status value', async () => {
      const req = {
        user: { _id: testAdmin._id, role: 1 },
        params: { orderId: testOrder1._id.toString() },
        body: { status: 'InvalidStatus' }
      };
      const res = createMockRes();

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Invalid status value')
        })
      );
    });

    test('returns 404 when order does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const req = {
        user: { _id: testAdmin._id, role: 1 },
        params: { orderId: nonExistentId.toString() },
        body: { status: 'Processing' }
      };
      const res = createMockRes();

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Order not found'
        })
      );
    });

    test('handles invalid order ID format', async () => {
      const req = {
        user: { _id: testAdmin._id, role: 1 },
        params: { orderId: 'invalid-id-format' },
        body: { status: 'Processing' }
      };
      const res = createMockRes();

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Error While Updating Order'
        })
      );
    });

    test('handles database error during update', async () => {
      const req = {
        user: { _id: testAdmin._id, role: 1 },
        params: { orderId: testOrder1._id.toString() },
        body: { status: 'Processing' }
      };
      const res = createMockRes();

      // Close connection to simulate database error
      await mongoose.connection.close();

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Error While Updating Order'
        })
      );

      // Reconnect for other tests
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
    });
  });

  describe('Integration Scenarios - End-to-End Order Flow', () => {
    test('complete order lifecycle: create → view → update status → verify', async () => {
      // Step 1: User creates an order (already done in beforeEach)
      expect(testOrder1).toBeDefined();
      expect(testOrder1.status).toBe('Not Processed');

      // Step 2: User views their orders
      const userReq = {
        user: { _id: testUser._id }
      };
      const userRes = createMockRes();
      await getOrdersController(userReq, userRes);
      
      let orders = userRes.json.mock.calls[0][0];
      expect(orders.length).toBe(1);
      expect(orders[0].status).toBe('Not Processed');

      // Step 3: Admin updates order status to Processing
      const adminReq1 = {
        user: { _id: testAdmin._id, role: 1 },
        params: { orderId: testOrder1._id.toString() },
        body: { status: 'Processing' }
      };
      const adminRes1 = createMockRes();
      await orderStatusController(adminReq1, adminRes1);
      expect(adminRes1.json.mock.calls[0][0].order.status).toBe('Processing');

      // Step 4: Admin updates order status to Shipped
      const adminReq2 = {
        user: { _id: testAdmin._id, role: 1 },
        params: { orderId: testOrder1._id.toString() },
        body: { status: 'Shipped' }
      };
      const adminRes2 = createMockRes();
      await orderStatusController(adminReq2, adminRes2);
      expect(adminRes2.json.mock.calls[0][0].order.status).toBe('Shipped');

      // Step 5: User views updated order
      const userRes2 = createMockRes();
      await getOrdersController(userReq, userRes2);
      orders = userRes2.json.mock.calls[0][0];
      expect(orders[0].status).toBe('Shipped');

      // Step 6: Admin views all orders
      const adminReq3 = {
        user: { _id: testAdmin._id, role: 1 }
      };
      const adminRes3 = createMockRes();
      await getAllOrdersController(adminReq3, adminRes3);
      const allOrders = adminRes3.json.mock.calls[0][0];
      expect(allOrders.length).toBe(2);
      const updatedOrder = allOrders.find(o => o._id.toString() === testOrder1._id.toString());
      expect(updatedOrder.status).toBe('Shipped');
    });

    test('multiple users with multiple orders are handled correctly', async () => {
      // Create additional orders
      await orderModel.create({
        products: [testProduct1._id],
        payment: { success: true },
        buyer: testUser._id,
        status: 'Delivered'
      });

      await orderModel.create({
        products: [testProduct2._id],
        payment: { success: true },
        buyer: testUser2._id,
        status: 'Cancelled'
      });

      // User 1 should see 2 orders
      const user1Req = {
        user: { _id: testUser._id }
      };
      const user1Res = createMockRes();
      await getOrdersController(user1Req, user1Res);
      expect(user1Res.json.mock.calls[0][0].length).toBe(2);

      // User 2 should see 2 orders
      const user2Req = {
        user: { _id: testUser2._id }
      };
      const user2Res = createMockRes();
      await getOrdersController(user2Req, user2Res);
      expect(user2Res.json.mock.calls[0][0].length).toBe(2);

      // Admin should see all 4 orders
      const adminReq = {
        user: { _id: testAdmin._id, role: 1 }
      };
      const adminRes = createMockRes();
      await getAllOrdersController(adminReq, adminRes);
      expect(adminRes.json.mock.calls[0][0].length).toBe(4);
    });
  });
});
