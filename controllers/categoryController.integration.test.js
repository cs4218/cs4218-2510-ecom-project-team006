import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import categoryModel from "../models/categoryModel.js";
import categoryRoutes from "../routes/categoryRoutes.js";
import userModel from "../models/userModel.js";
import JWT from "jsonwebtoken";
import slugify from "slugify";

// AI Attribution: The following test code was generated with the assistance of AI (ChatGPT).

process.env.JWT_SECRET = "test-secret";

let mongod;
let app;
let adminToken;
let adminUser;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api/v1/category", categoryRoutes);

  adminUser = await userModel.create({
    name: "Admin",
    address: "Address",
    answer: "Answer",
    phone: "98765432",
    email: "admin@example.com",
    password: "password",
    role: 1,
  });

  adminToken = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

beforeEach(async () => {
  await categoryModel.deleteMany({});
});

describe("Category Controllers Backend Integration", () => {
  describe("createCategoryController", () => {
    test("fails if name is missing", async () => {
      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", adminToken)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ success: false, message: "Name is required" });
    });

    test("fails if category already exists", async () => {
      await categoryModel.create({ name: "Electronics", slug: slugify("Electronics") });

      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", adminToken)
        .send({ name: "Electronics" });

      expect(res.status).toBe(409);
      expect(res.body).toEqual({
        success: false,
        message: "Category with this name already exists",
      });
    });

    test("creates category successfully", async () => {
      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", adminToken)
        .send({ name: "Books" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          message: "New category created",
          category: expect.objectContaining({ name: "Books" }),
        })
      );
    });
  });

  describe("updateCategoryControllers", () => {
    test("fails if category not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/v1/category/update-category/${fakeId}`)
        .set("Authorization", adminToken)
        .send({ name: "Updated" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        success: false,
        message: "Category with this ID not found",
      });
    });

    test("updates successfully", async () => {
      const cat = await categoryModel.create({ name: "OldName", slug: slugify("OldName") });

      const res = await request(app)
        .put(`/api/v1/category/update-category/${cat._id.toString()}`)
        .set("Authorization", adminToken)
        .send({ name: "NewName" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          message: "Category updated successfully",
          category: expect.objectContaining({ name: "NewName" }),
        })
      );
    });
  });

  describe("deleteCategoryController", () => {
    test("fails if category not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/v1/category/delete-category/${fakeId}`)
        .set("Authorization", adminToken);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        success: false,
        message: "Category not found",
      });
    });

    test("deletes successfully", async () => {
      const cat = await categoryModel.create({ name: "DeleteMe", slug: slugify("DeleteMe") });

      const res = await request(app)
        .delete(`/api/v1/category/delete-category/${cat._id.toString()}`)
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: "Category deleted successfully",
      });
    });
  });
});
