import mongoose from 'mongoose';
import orderModel from './orderModel.js';

// AI attribution: Some test cases are produced with the help of OpenAI ChatGPT(GPT-5) via cursor.

describe('Order Model (models/orderModel.js) - Essential Tests', () => {
  describe('Core Schema Structure Tests', () => {
    test('orderModel is a mongoose model', () => {
      // Assert
      expect(orderModel).toBeDefined();
      expect(typeof orderModel).toBe('function');
    });

    test('model has correct name', () => {
      // Assert
      expect(orderModel.modelName).toBe('Order');
    });

    test('schema includes all required fields', () => {
      // Get schema paths
      const schemaPaths = orderModel.schema.paths;
      
      // Assert required fields exist
      expect(schemaPaths.products).toBeDefined();
      expect(schemaPaths.payment).toBeDefined();
      expect(schemaPaths.buyer).toBeDefined();
      expect(schemaPaths.status).toBeDefined();
    });
  });

  describe('Field Type Validation Tests', () => {
    test('products field is array type', () => {
      // Assert
      const productsField = orderModel.schema.paths.products;
      expect(productsField.instance).toBe('Array');
    });

    test('buyer field is ObjectId type', () => {
      // Assert
      const buyerField = orderModel.schema.paths.buyer;
      expect(buyerField.instance).toBe('ObjectId');
    });

    test('status field is String type', () => {
      // Assert
      const statusField = orderModel.schema.paths.status;
      expect(statusField.instance).toBe('String');
    });
  });

  describe('Business Logic Tests', () => {
    test('status field has correct default value', () => {
      // Assert
      const statusField = orderModel.schema.paths.status;
      expect(statusField.defaultValue).toBe('Not Processed');
    });

    test('status field has correct enum values', () => {
      // Assert
      const statusField = orderModel.schema.paths.status;
      const expectedEnum = ["Not Processed", "Processing", "Shipped", "Delivered", "Cancelled"];
      expect(statusField.enumValues).toEqual(expectedEnum);
    });

    test('buyer field references users collection', () => {
      // Assert
      const buyerField = orderModel.schema.paths.buyer;
      expect(buyerField.options.ref).toBe('users');
    });
  });
});