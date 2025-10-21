import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import orderModel from './orderModel.js';
import userModel from './userModel.js';
import productModel from './productModel.js';
import categoryModel from './categoryModel.js';
import { jest } from '@jest/globals';

// AI attribution: Integration test cases are produced with the help of OpenAI ChatGPT(GPT-5) via cursor.

// Configure Jest timeout for integration tests
jest.setTimeout(60000);

describe('Order Model - Integration Tests', () => {
  let mongoServer;
  let testUser1;
  let testUser2;
  let testCategory;
  let testProduct1;
  let testProduct2;
  let testProduct3;

  beforeAll(async () => {
    // Ensure JWT secret exists for any auth-related operations
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

    // Start MongoDB Memory Server for integration testing
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    // Clean up database connections
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Create test users for integration testing
    testUser1 = await userModel.create({
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

    // Create test category for product integration
    testCategory = await categoryModel.create({
      name: 'Test Category',
      slug: 'test-category'
    });

    // Create test products for order integration
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

    testProduct3 = await productModel.create({
      name: 'Test Product 3',
      slug: 'test-product-3',
      description: 'Test Description 3',
      price: 300,
      category: testCategory._id,
      quantity: 3,
      shipping: true
    });
  });

  afterEach(async () => {
    // Clean up test data after each test
    if (mongoose.connection.readyState === 1) {
      await orderModel.deleteMany({});
      await userModel.deleteMany({});
      await productModel.deleteMany({});
      await categoryModel.deleteMany({});
    }
  });

  describe('Order Creation with Model Integration', () => {
    test('creates order with valid user and product references', async () => {
      // Integration test: Order creation with real user and product references
      const orderData = {
        products: [testProduct1._id, testProduct2._id],
        payment: {
          success: true,
          transactionId: 'txn123',
          amount: 300
        },
        buyer: testUser1._id,
        status: 'Not Processed'
      };

      const order = await orderModel.create(orderData);

      // Verify order creation
      expect(order._id).toBeDefined();
      expect(order.products).toHaveLength(2);
      expect(order.buyer.toString()).toBe(testUser1._id.toString());
      expect(order.status).toBe('Not Processed');
      expect(order.payment.success).toBe(true);
      expect(order.createdAt).toBeDefined();
      expect(order.updatedAt).toBeDefined();
    });

    test('creates order with single product and different user', async () => {
      // Integration test: Different user ordering single product
      const orderData = {
        products: [testProduct3._id],
        payment: {
          success: true,
          transactionId: 'txn456',
          amount: 300
        },
        buyer: testUser2._id,
        status: 'Processing'
      };

      const order = await orderModel.create(orderData);

      expect(order._id).toBeDefined();
      expect(order.products).toHaveLength(1);
      expect(order.buyer.toString()).toBe(testUser2._id.toString());
      expect(order.status).toBe('Processing');
    });

    test('handles order creation with multiple products from same category', async () => {
      // Integration test: Complex order with multiple products
      const orderData = {
        products: [testProduct1._id, testProduct2._id, testProduct3._id],
        payment: {
          success: true,
          transactionId: 'txn789',
          amount: 600
        },
        buyer: testUser1._id,
        status: 'Not Processed'
      };

      const order = await orderModel.create(orderData);

      expect(order._id).toBeDefined();
      expect(order.products).toHaveLength(3);
      expect(order.payment.amount).toBe(600);
    });
  });

  describe('Order-User Integration Queries', () => {
    let testOrder1;
    let testOrder2;
    let testOrder3;

    beforeEach(async () => {
      // Create test orders for integration queries
      testOrder1 = await orderModel.create({
        products: [testProduct1._id],
        payment: { success: true, transactionId: 'txn1' },
        buyer: testUser1._id,
        status: 'Not Processed'
      });

      testOrder2 = await orderModel.create({
        products: [testProduct2._id, testProduct3._id],
        payment: { success: true, transactionId: 'txn2' },
        buyer: testUser1._id,
        status: 'Processing'
      });

      testOrder3 = await orderModel.create({
        products: [testProduct1._id],
        payment: { success: true, transactionId: 'txn3' },
        buyer: testUser2._id,
        status: 'Shipped'
      });
    });

    test('finds orders by specific user with population', async () => {
      // Integration test: Query orders by user with populated data
      const user1Orders = await orderModel.find({ buyer: testUser1._id })
        .populate('buyer', 'name email')
        .populate('products', 'name price');

      expect(user1Orders).toHaveLength(2);
      expect(user1Orders[0].buyer.name).toBe('Test User 1');
      expect(user1Orders[0].buyer.email).toBe('user1@test.com');
      expect(user1Orders[0].products[0].name).toBe('Test Product 1');
      expect(user1Orders[0].products[0].price).toBe(100);
    });

    test('finds orders by different user with population', async () => {
      // Integration test: Different user's orders
      const user2Orders = await orderModel.find({ buyer: testUser2._id })
        .populate('buyer', 'name email')
        .populate('products', 'name price');

      expect(user2Orders).toHaveLength(1);
      expect(user2Orders[0].buyer.name).toBe('Test User 2');
      expect(user2Orders[0].status).toBe('Shipped');
    });

    test('finds all orders with full population', async () => {
      // Integration test: All orders with complete population
      const allOrders = await orderModel.find({})
        .populate('buyer', 'name email phone')
        .populate('products', 'name price description')
        .sort({ createdAt: -1 });

      expect(allOrders).toHaveLength(3);
      
      // Verify first order (most recent)
      expect(allOrders[0].buyer.name).toBeDefined();
      expect(allOrders[0].products[0].name).toBeDefined();
      expect(allOrders[0].products[0].price).toBeDefined();
    });
  });

  describe('Order-Product Integration Queries', () => {
    let testOrder1;
    let testOrder2;

    beforeEach(async () => {
      // Create orders with different product combinations
      testOrder1 = await orderModel.create({
        products: [testProduct1._id, testProduct2._id],
        payment: { success: true, transactionId: 'txn1' },
        buyer: testUser1._id,
        status: 'Not Processed'
      });

      testOrder2 = await orderModel.create({
        products: [testProduct3._id],
        payment: { success: true, transactionId: 'txn2' },
        buyer: testUser2._id,
        status: 'Processing'
      });
    });

    test('finds orders containing specific product', async () => {
      // Integration test: Find orders by product reference
      const ordersWithProduct1 = await orderModel.find({
        products: testProduct1._id
      }).populate('products', 'name price');

      expect(ordersWithProduct1).toHaveLength(1);
      expect(ordersWithProduct1[0].products[0].name).toBe('Test Product 1');
      expect(ordersWithProduct1[0].products[0].price).toBe(100);
    });

    test('finds orders containing multiple specific products', async () => {
      // Integration test: Find orders with multiple product criteria
      const ordersWithProduct2 = await orderModel.find({
        products: { $in: [testProduct2._id, testProduct3._id] }
      }).populate('products', 'name price');

      expect(ordersWithProduct2).toHaveLength(2);
      
      // Verify both orders are found
      const productNames = ordersWithProduct2.flatMap(order => 
        order.products.map(product => product.name)
      );
      expect(productNames).toContain('Test Product 2');
      expect(productNames).toContain('Test Product 3');
    });

    test('populates products with category information', async () => {
      // Integration test: Deep population with category data
      const orders = await orderModel.find({})
        .populate({
          path: 'products',
          populate: {
            path: 'category',
            select: 'name slug'
          }
        });

      expect(orders).toHaveLength(2);
      expect(orders[0].products[0].category.name).toBe('Test Category');
      expect(orders[0].products[0].category.slug).toBe('test-category');
    });
  });

  describe('Order Status Integration Updates', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await orderModel.create({
        products: [testProduct1._id, testProduct2._id],
        payment: { success: true, transactionId: 'txn1' },
        buyer: testUser1._id,
        status: 'Not Processed'
      });
    });

    test('updates order status with user and product data intact', async () => {
      // Integration test: Status update preserving relationships
      const updatedOrder = await orderModel.findByIdAndUpdate(
        testOrder._id,
        { status: 'Processing' },
        { new: true }
      ).populate('buyer', 'name email')
       .populate('products', 'name price');

      expect(updatedOrder.status).toBe('Processing');
      expect(updatedOrder.buyer.name).toBe('Test User 1');
      expect(updatedOrder.products).toHaveLength(2);
      expect(updatedOrder.products[0].name).toBe('Test Product 1');
    });

    test('updates order status through multiple status changes', async () => {
      // Integration test: Multiple status transitions
      const statuses = ['Processing', 'Shipped', 'Delivered'];
      
      for (const status of statuses) {
        const updatedOrder = await orderModel.findByIdAndUpdate(
          testOrder._id,
          { status: status },
          { new: true }
        );
        expect(updatedOrder.status).toBe(status);
      }
    });

    test('finds orders by status with populated data', async () => {
      // Integration test: Query by status with relationships
      await orderModel.findByIdAndUpdate(testOrder._id, { status: 'Processing' });
      
      const processingOrders = await orderModel.find({ status: 'Processing' })
        .populate('buyer', 'name email')
        .populate('products', 'name price');

      expect(processingOrders).toHaveLength(1);
      expect(processingOrders[0].buyer.name).toBe('Test User 1');
      expect(processingOrders[0].products[0].name).toBe('Test Product 1');
    });
  });

  describe('Order Data Integrity and Validation', () => {
    test('validates required fields with real model constraints', async () => {
      // Integration test: Schema validation with real database
      // Since orderModel doesn't have required fields, test with invalid ObjectId
      const invalidOrderData = {
        products: [testProduct1._id],
        payment: { success: true },
        buyer: 'invalid-object-id-format' // Invalid ObjectId format
      };

      await expect(orderModel.create(invalidOrderData)).rejects.toThrow();
    });

    test('validates status enum values with database constraints', async () => {
      // Integration test: Enum validation
      const validStatuses = ['Not Processed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
      
      for (const status of validStatuses) {
        const order = await orderModel.create({
          products: [testProduct1._id],
          buyer: testUser1._id,
          status: status
        });
        expect(order.status).toBe(status);
      }
    });

    test('rejects invalid status values', async () => {
      // Integration test: Invalid enum values
      const invalidOrderData = {
        products: [testProduct1._id],
        buyer: testUser1._id,
        status: 'InvalidStatus'
      };

      await expect(orderModel.create(invalidOrderData)).rejects.toThrow();
    });

    test('maintains referential integrity with deleted users', async () => {
      // Integration test: Foreign key integrity
      const order = await orderModel.create({
        products: [testProduct1._id],
        buyer: testUser1._id,
        status: 'Not Processed'
      });

      // Delete the user
      await userModel.findByIdAndDelete(testUser1._id);

      // Order should still exist but buyer reference should be broken
      const existingOrder = await orderModel.findById(order._id);
      expect(existingOrder).toBeDefined();
      expect(existingOrder.buyer.toString()).toBe(testUser1._id.toString());
    });
  });

  describe('Order Aggregation and Complex Queries', () => {
    beforeEach(async () => {
      // Create multiple orders for aggregation tests
      await orderModel.create({
        products: [testProduct1._id],
        payment: { success: true, transactionId: 'txn1', amount: 100 },
        buyer: testUser1._id,
        status: 'Not Processed'
      });

      await orderModel.create({
        products: [testProduct2._id],
        payment: { success: true, transactionId: 'txn2', amount: 200 },
        buyer: testUser1._id,
        status: 'Processing'
      });

      await orderModel.create({
        products: [testProduct3._id],
        payment: { success: true, transactionId: 'txn3', amount: 300 },
        buyer: testUser2._id,
        status: 'Shipped'
      });
    });

    test('aggregates orders by user with populated data', async () => {
      // Integration test: Aggregation with population
      const userOrderStats = await orderModel.aggregate([
        { $match: { buyer: testUser1._id } },
        { $lookup: {
            from: 'users',
            localField: 'buyer',
            foreignField: '_id',
            as: 'buyerInfo'
          }
        },
        { $unwind: '$buyerInfo' },
        { $group: {
            _id: '$buyerInfo.name',
            totalOrders: { $sum: 1 },
            totalAmount: { $sum: '$payment.amount' }
          }
        }
      ]);

      expect(userOrderStats).toHaveLength(1);
      expect(userOrderStats[0]._id).toBe('Test User 1');
      expect(userOrderStats[0].totalOrders).toBe(2);
      expect(userOrderStats[0].totalAmount).toBe(300);
    });

    test('finds orders by date range with populated products', async () => {
      // Integration test: Date range queries with relationships
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      
      const orders = await orderModel.find({
        createdAt: { $gte: startDate }
      }).populate('products', 'name price')
        .populate('buyer', 'name email')
        .sort({ createdAt: -1 });

      expect(orders).toHaveLength(3);
      expect(orders[0].products[0].name).toBeDefined();
      expect(orders[0].buyer.name).toBeDefined();
    });

    test('counts orders by status with user information', async () => {
      // Integration test: Status counting with user data
      const statusCounts = await orderModel.aggregate([
        { $lookup: {
            from: 'users',
            localField: 'buyer',
            foreignField: '_id',
            as: 'buyerInfo'
          }
        },
        { $unwind: '$buyerInfo' },
        { $group: {
            _id: '$status',
            count: { $sum: 1 },
            users: { $addToSet: '$buyerInfo.name' }
          }
        }
      ]);

      expect(statusCounts).toHaveLength(3);
      
      const notProcessedCount = statusCounts.find(s => s._id === 'Not Processed');
      expect(notProcessedCount.count).toBe(1);
      expect(notProcessedCount.users).toContain('Test User 1');
    });
  });

  describe('Order Model Performance and Edge Cases', () => {
    test('handles large number of products in single order', async () => {
      // Integration test: Performance with many products
      const manyProducts = [testProduct1._id, testProduct2._id, testProduct3._id];
      
      const order = await orderModel.create({
        products: manyProducts,
        payment: { success: true, transactionId: 'txn_large' },
        buyer: testUser1._id,
        status: 'Not Processed'
      });

      const populatedOrder = await orderModel.findById(order._id)
        .populate('products', 'name price');

      expect(populatedOrder.products).toHaveLength(3);
      expect(populatedOrder.products[0].name).toBeDefined();
    });

    test('handles empty products array gracefully', async () => {
      // Integration test: Edge case with empty products
      const order = await orderModel.create({
        products: [],
        payment: { success: true, transactionId: 'txn_empty' },
        buyer: testUser1._id,
        status: 'Not Processed'
      });

      expect(order._id).toBeDefined();
      expect(order.products).toHaveLength(0);
    });

    test('maintains data consistency across multiple operations', async () => {
      // Integration test: Data consistency
      const order = await orderModel.create({
        products: [testProduct1._id],
        payment: { success: true, transactionId: 'txn_consistency' },
        buyer: testUser1._id,
        status: 'Not Processed'
      });

      // Update status
      await orderModel.findByIdAndUpdate(order._id, { status: 'Processing' });
      
      // Update payment
      await orderModel.findByIdAndUpdate(order._id, { 
        'payment.success': false,
        'payment.error': 'Payment failed'
      });

      const finalOrder = await orderModel.findById(order._id)
        .populate('buyer', 'name')
        .populate('products', 'name');

      expect(finalOrder.status).toBe('Processing');
      expect(finalOrder.payment.success).toBe(false);
      expect(finalOrder.buyer.name).toBe('Test User 1');
      expect(finalOrder.products[0].name).toBe('Test Product 1');
    });
  });
});