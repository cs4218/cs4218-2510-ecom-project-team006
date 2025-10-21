/**
 * Integration Tests for userModel.js
 *
 * DISCLAIMER: These tests were AI-generated (GitHub Copilot) and reviewed/adapted by the developer.
 *
 * These tests validate the user model using real:
 * - MongoDB database (mongodb-memory-server)
 * - Mongoose schema validation
 *
 * Modules exercised by these tests:
 * - models/userModel.js (schema, validation, CRUD)
 * - MongoDB/Mongoose (user CRUD operations)
 *
 * Bug-finding focus:
 * - Field validation (required, unique, type)
 * - Duplicate email constraint
 * - Edge cases (empty, special chars, long fields)
 * - Database error handling
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import userModel from './userModel.js';

describe('userModel Integration Tests', () => {
    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    afterEach(async () => {
        await userModel.deleteMany({});
    });

    it('should create a user with valid fields', async () => {
        const user = await userModel.create({
            name: 'Test User',
            email: 'testuser@example.com',
            password: 'password123',
            phone: '1234567890',
            address: '123 Main St',
            answer: 'blue'
        });
        expect(user._id).toBeDefined();
        expect(user.name).toBe('Test User');
        expect(user.email).toBe('testuser@example.com');
        expect(user.role).toBe(0);
        expect(user.createdAt).toBeInstanceOf(Date);
        expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should require all required fields', async () => {
        const userData = {
            name: '',
            email: '',
            password: '',
            phone: '',
            address: '',
            answer: ''
        };
        let error;
        try {
            await userModel.create(userData);
        } catch (err) {
            error = err;
        }
        expect(error).toBeDefined();
        expect(error.errors.name).toBeDefined();
        expect(error.errors.email).toBeDefined();
        expect(error.errors.password).toBeDefined();
        expect(error.errors.phone).toBeDefined();
        expect(error.errors.address).toBeDefined();
        expect(error.errors.answer).toBeDefined();
    });

    it('should enforce unique email constraint', async () => {
        await userModel.create({
            name: 'User1',
            email: 'unique@example.com',
            password: 'pass1',
            phone: '111',
            address: 'Addr1',
            answer: 'a1'
        });
        let error;
        try {
            await userModel.create({
                name: 'User2',
                email: 'unique@example.com',
                password: 'pass2',
                phone: '222',
                address: 'Addr2',
                answer: 'a2'
            });
        } catch (err) {
            error = err;
        }
        expect(error).toBeDefined();
        expect(error.code).toBe(11000); // Mongo duplicate key error
    });

    it('should allow special characters in name, address, answer', async () => {
        const user = await userModel.create({
            name: "O'Brien & Sons!@#",
            email: 'special@example.com',
            password: 'password',
            phone: '1234567890',
            address: 'Apt #5, 123 Main St.',
            answer: 'It\'s blue!'
        });
        expect(user.name).toBe("O'Brien & Sons!@#");
        expect(user.address).toBe('Apt #5, 123 Main St.');
        expect(user.answer).toBe("It's blue!");
    });

    it('should default role to 0 and allow setting role', async () => {
        const user1 = await userModel.create({
            name: 'Role User',
            email: 'role1@example.com',
            password: 'password',
            phone: '123',
            address: 'Addr',
            answer: 'ans'
        });
        expect(user1.role).toBe(0);
        const user2 = await userModel.create({
            name: 'Admin User',
            email: 'role2@example.com',
            password: 'password',
            phone: '456',
            address: 'Addr',
            answer: 'ans',
            role: 1
        });
        expect(user2.role).toBe(1);
    });

    it('should update user fields and timestamps', async () => {
        const user = await userModel.create({
            name: 'Update User',
            email: 'update@example.com',
            password: 'password',
            phone: '123',
            address: 'Addr',
            answer: 'ans'
        });
        const oldUpdatedAt = user.updatedAt;
        user.name = 'Updated Name';
        await user.save();
        expect(user.name).toBe('Updated Name');
        expect(user.updatedAt > oldUpdatedAt).toBe(true);
    });

    it('should delete a user', async () => {
        const user = await userModel.create({
            name: 'Delete User',
            email: 'delete@example.com',
            password: 'password',
            phone: '123',
            address: 'Addr',
            answer: 'ans'
        });
        await userModel.deleteOne({ _id: user._id });
        const found = await userModel.findById(user._id);
        expect(found).toBeNull();
    });
});
