/**
 * Integration Tests for authMiddleware.js
 * 
 * DISCLAIMER: These tests were AI-generated (GitHub Copilot) and reviewed/adapted by the developer.
 * 
 * These tests validate the authentication and authorization middleware using real:
 * - JWT library (jsonwebtoken) for token generation and verification
 * - User model and database for admin role checks
 * - Express request/response/next functions
 * 
 * Modules exercised by these tests:
 * - middlewares/authMiddleware.js (requireSignIn, isAdmin)
 * - jsonwebtoken library (JWT.sign, JWT.verify)
 * - models/userModel.js (findById)
 * - MongoDB/Mongoose (user queries)
 * 
 * Bug-finding focus:
 * - Invalid token handling
 * - Expired token validation
 * - Missing token scenarios
 * - Admin role verification
 * - Database error handling
 * - Edge cases (malformed tokens, invalid user IDs)
 */

import JWT from 'jsonwebtoken';
import { requireSignIn, isAdmin } from './authMiddleware.js';
import userModel from '../models/userModel.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('authMiddleware Integration Tests', () => {
    let mongoServer;
    let validToken;
    let expiredToken;
    let invalidToken;
    let testUserId;
    let adminUserId;

    beforeAll(async () => {
        // Set JWT_SECRET for testing
        process.env.JWT_SECRET = 'test-secret-key-for-integration-tests';

        // Setup in-memory MongoDB
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        // Create a regular user
        const regularUser = await userModel.create({
            name: 'Regular User',
            email: 'regular@test.com',
            password: 'hashedpassword123',
            phone: '1234567890',
            address: '123 Test St',
            DOB: new Date('1990-01-01'),
            answer: 'blue',
            role: 0
        });
        testUserId = regularUser._id;

        // Create an admin user
        const adminUser = await userModel.create({
            name: 'Admin User',
            email: 'admin@test.com',
            password: 'hashedpassword123',
            phone: '9876543210',
            address: '456 Admin St',
            DOB: new Date('1985-01-01'),
            answer: 'red',
            role: 1
        });
        adminUserId = adminUser._id;

        // Generate tokens
        validToken = JWT.sign({ _id: testUserId }, process.env.JWT_SECRET, { expiresIn: '7d' });
        expiredToken = JWT.sign({ _id: testUserId }, process.env.JWT_SECRET, { expiresIn: '0s' });
        invalidToken = 'invalid.token.string';
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    describe('requireSignIn Middleware', () => {
        /**
         * Test: Valid JWT token should authenticate successfully
         * Modules: authMiddleware.requireSignIn, jsonwebtoken (JWT.verify)
         */
        it('should authenticate with valid JWT token', async () => {
            const req = {
                headers: {
                    authorization: validToken
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await requireSignIn(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeDefined();
            expect(req.user._id).toBeDefined();
            expect(res.status).not.toHaveBeenCalled();
        });

        /**
         * Test: Missing authorization header should fail
         * Modules: authMiddleware.requireSignIn, jsonwebtoken (JWT.verify error)
         */
        it('should reject request with missing authorization header', async () => {
            const req = {
                headers: {}
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await requireSignIn(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid or expired token'
            });
        });

        /**
         * Test: Invalid JWT token should fail
         * Modules: authMiddleware.requireSignIn, jsonwebtoken (JWT.verify error)
         */
        it('should reject request with invalid JWT token', async () => {
            const req = {
                headers: {
                    authorization: invalidToken
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await requireSignIn(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid or expired token'
            });
        });

        /**
         * Test: Expired JWT token should fail
         * Modules: authMiddleware.requireSignIn, jsonwebtoken (JWT.verify with expired token)
         */
        it('should reject request with expired JWT token', async () => {
            // Wait a moment to ensure token is expired
            await new Promise(resolve => setTimeout(resolve, 100));

            const req = {
                headers: {
                    authorization: expiredToken
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await requireSignIn(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid or expired token'
            });
        });

        /**
         * Test: Malformed JWT token should fail
         * Modules: authMiddleware.requireSignIn, jsonwebtoken (JWT.verify error)
         */
        it('should reject request with malformed JWT token', async () => {
            const req = {
                headers: {
                    authorization: 'Bearer malformed.token'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await requireSignIn(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid or expired token'
            });
        });

        /**
         * Test: JWT token with wrong secret should fail
         * Modules: authMiddleware.requireSignIn, jsonwebtoken (JWT.verify with wrong secret)
         */
        it('should reject JWT token signed with different secret', async () => {
            const wrongSecretToken = JWT.sign({ _id: testUserId }, 'wrong-secret', { expiresIn: '7d' });

            const req = {
                headers: {
                    authorization: wrongSecretToken
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await requireSignIn(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid or expired token'
            });
        });
    });

    describe('isAdmin Middleware', () => {
        /**
         * Test: Admin user should pass isAdmin check
         * Modules: authMiddleware.isAdmin, userModel.findById, MongoDB
         */
        it('should allow access for admin user (role=1)', async () => {
            const req = {
                user: { _id: adminUserId }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };
            const next = jest.fn();

            await isAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        /**
         * Test: Non-admin user should fail isAdmin check
         * Modules: authMiddleware.isAdmin, userModel.findById, MongoDB
         */
        it('should deny access for non-admin user (role=0)', async () => {
            const req = {
                user: { _id: testUserId }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };
            const next = jest.fn();

            await isAdmin(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "UnAuthorized Access"
            });
        });

        /**
         * Test: Invalid user ID should return error
         * Modules: authMiddleware.isAdmin, userModel.findById, MongoDB (invalid ID)
         */
        it('should handle invalid user ID gracefully', async () => {
            const req = {
                user: { _id: 'invalid-id-format' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await isAdmin(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal server error'
            });
        });

        /**
         * Test: Non-existent user should return error
         * Modules: authMiddleware.isAdmin, userModel.findById, MongoDB
         */
        it('should handle non-existent user', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const req = {
                user: { _id: fakeId }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await isAdmin(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal server error'
            });
        });

        /**
         * Test: Missing user object should fail
         * Modules: authMiddleware.isAdmin
         */
        it('should handle missing user object in request', async () => {
            const req = {};
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await isAdmin(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal server error'
            });
        });
    });

    describe('Combined Middleware Flow', () => {
        /**
         * Test: Valid admin token should pass both middleware
         * Modules: authMiddleware.requireSignIn, authMiddleware.isAdmin, JWT, userModel, MongoDB
         */
        it('should authenticate and authorize admin user through complete flow', async () => {
            const adminToken = JWT.sign({ _id: adminUserId }, process.env.JWT_SECRET, { expiresIn: '7d' });

            const req = {
                headers: {
                    authorization: adminToken
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
                send: jest.fn()
            };
            const next = jest.fn();

            // First middleware: requireSignIn
            await requireSignIn(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
            expect(req.user).toBeDefined();

            // Second middleware: isAdmin
            next.mockClear();
            await isAdmin(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
        });

        /**
         * Test: Valid non-admin token should fail at isAdmin
         * Modules: authMiddleware.requireSignIn, authMiddleware.isAdmin, JWT, userModel, MongoDB
         */
        it('should authenticate but reject non-admin user at isAdmin check', async () => {
            const req = {
                headers: {
                    authorization: validToken
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
                send: jest.fn()
            };
            const next = jest.fn();

            // First middleware: requireSignIn
            await requireSignIn(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
            expect(req.user).toBeDefined();

            // Second middleware: isAdmin
            next.mockClear();
            await isAdmin(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "UnAuthorized Access"
            });
        });
    });
});
