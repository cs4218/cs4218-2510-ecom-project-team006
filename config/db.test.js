import mongoose from 'mongoose';
import connectDB from './db.js';

// AI attribution: Some test cases are produced with the help of OpenAI ChatGPT(GPT-5) via cursor.

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn(),
}));

// Mock console.log to capture output
const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('Database Configuration (config/db.js)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.MONGO_URL;
  });

  afterEach(() => {
    consoleSpy.mockClear();
  });

  describe('Essential Tests', () => {
    test('connectDB is an async function', () => {
      expect(typeof connectDB).toBe('function');
      expect(connectDB.constructor.name).toBe('AsyncFunction');
    });

    test('calls mongoose.connect with MONGO_URL from environment', async () => {
      // Arrange
      const mockConnection = { connection: { host: 'localhost:27017' } };
      mongoose.connect.mockResolvedValueOnce(mockConnection);
      process.env.MONGO_URL = 'mongodb://localhost:27017/test';

      // Act
      await connectDB();

      // Assert
      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/test');
    });

    test('handles successful connection', async () => {
      // Arrange
      const mockConnection = { connection: { host: 'test-host:27017' } };
      mongoose.connect.mockResolvedValueOnce(mockConnection);
      process.env.MONGO_URL = 'mongodb://test-host:27017/test';

      // Act
      await connectDB();

      // Assert
      expect(mongoose.connect).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    test('handles connection errors gracefully', async () => {
      // Arrange
      const error = new Error('Connection failed');
      mongoose.connect.mockRejectedValueOnce(error);
      process.env.MONGO_URL = 'mongodb://invalid:27017/test';

      // Act
      await connectDB();

      // Assert
      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://invalid:27017/test');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    test('does not throw unhandled errors', async () => {
      // Arrange
      const error = new Error('Test error');
      mongoose.connect.mockRejectedValueOnce(error);
      process.env.MONGO_URL = 'mongodb://test:27017/test';

      // Act & Assert
      await expect(connectDB()).resolves.not.toThrow();
    });
  });
});