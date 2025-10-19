import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import productRoutes from "../routes/productRoutes.js";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";
import JWT from "jsonwebtoken";
import slugify from "slugify";

// AI Attribution: The following test code was generated with the assistance of AI (ChatGPT).

process.env.JWT_SECRET = "test-secret";
jest.mock("braintree") // not testing braintree integration

let mongod;
let app;
let adminToken;
let adminUser;
let category;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api/v1/product", productRoutes);

  adminUser = await userModel.create({
    name: "Admin",
    address: "Address",
    answer: "Answer",
    phone: "98765432",
    email: "admin@example.com",
    password: "password",
    role: 1,
  });

  adminToken = JWT.sign({ _id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  category = await categoryModel.create({ name: "Electronics", slug: slugify("Electronics") });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

beforeEach(async () => {
  await productModel.deleteMany({});
});

describe("Admin Product Controllers Backend Integration", () => {
  describe("createProductController", () => {
    test("fails if required fields are missing", async () => {
      const res = await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", adminToken)

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test("fails if category not found", async () => {
      const res = await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", adminToken)
        .field("name", "Product 1")
        .field("description", "Desc")
        .field("price", "10")
        .field("category", new mongoose.Types.ObjectId().toString())
        .field("quantity", "5")
        .field("shipping", "1");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ success: false, message: "Category not found" });
    });

    test("fails if product with same name exists", async () => {
      await productModel.create({
        name: "Duplicate",
        description: "Desc",
        price: 10,
        category: category._id,
        quantity: 5,
        shipping: 1,
        slug: slugify("Duplicate"),
      });

      const res = await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", adminToken)
        .field("name", "Duplicate")
        .field("description", "Desc")
        .field("price", "10")
        .field("category", category._id.toString())
        .field("quantity", "5")
        .field("shipping", "1")
        .attach("photo", Buffer.from("fake image"), "product.jpg");


      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Product with this name already exists");
    });

    test("creates product successfully", async () => {
      const res = await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", adminToken)
        .field("name", "Product 1")
        .field("description", "Desc")
        .field("price", "10")
        .field("category", category._id.toString())
        .field("quantity", "5")
        .field("shipping", "1")
        .attach("photo", Buffer.from("fake image"), "product.jpg");

      expect(res.status).toBe(201);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          message: "Product created successfully",
          product: expect.objectContaining({ name: "Product 1" }),
        })
      );
    });
  });

  describe("updateProductController", () => {
    let product;

    beforeEach(async () => {
      product = await productModel.create({
        name: "Old Product",
        description: "Desc",
        price: 10,
        category: category._id,
        quantity: 5,
        shipping: 1,
        slug: slugify("Old Product"),
      });
    });

    test("fails if required fields are missing", async () => {
      const res = await request(app)
        .put(`/api/v1/product/update-product/${product._id.toString()}`)
        .set("Authorization", adminToken)

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test("fails if product not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/v1/product/update-product/${fakeId}`)
        .set("Authorization", adminToken)
        .field("name", "Updated")
        .field("description", "New Desc")
        .field("price", "20")
        .field("category", category._id.toString())
        .field("quantity", "10")
        .field("shipping", "1");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ success: false, message: "Product not found" });
    });

    test("fails if product with same name exists", async () => {
      await productModel.create({
        name: "Duplicate",
        description: "Desc",
        price: 10,
        category: category._id,
        quantity: 5,
        shipping: 1,
        slug: slugify("Duplicate"),
      });
      const res = await request(app)
        .put(`/api/v1/product/update-product/${product._id.toString()}`)
        .set("Authorization", adminToken)
        .field("name", "Duplicate")
        .field("description", "New Desc")
        .field("price", "20")
        .field("category", category._id.toString())
        .field("quantity", "10")
        .field("shipping", "1");

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    test("updates product successfully", async () => {
      const res = await request(app)
        .put(`/api/v1/product/update-product/${product._id.toString()}`)
        .set("Authorization", adminToken)
        .field("name", "Updated Product")
        .field("description", "New Desc")
        .field("price", "20")
        .field("category", category._id.toString())
        .field("quantity", "10")
        .field("shipping", "1")
        .attach("photo", Buffer.from("fake image"), "updated.jpg");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          message: "Product updated successfully",
          product: expect.objectContaining({ name: "Updated Product" }),
        })
      );
    });
  });

  describe("deleteProductController", () => {
    let product;

    beforeEach(async () => {
      product = await productModel.create({
        name: "Product 1",
        description: "Desc",
        price: 10,
        category: category._id,
        quantity: 5,
        shipping: 1,
        slug: slugify("Product 1"),
      });
    });

    test("fails if product not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/v1/product/delete-product/${fakeId}`)
        .set("Authorization", adminToken);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ success: false, message: "Product not found" });
    });

    test("deletes product successfully", async () => {
      const res = await request(app)
        .delete(`/api/v1/product/delete-product/${product._id.toString()}`)
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, message: "Product deleted successfully" });
    });
  });
});
