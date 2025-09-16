import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Category from "../models/categoryModel.js"; 

let mongo;

beforeAll(async () => {
  jest.setTimeout(30000);
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  await mongoose.connect(uri, { dbName: "testdb" });

  // ensure indexes for unique constraints
  await Category.init();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  await Category.deleteMany({});
});

describe("Category model", () => {
  it("saves with required fields and lowercases slug", async () => {
    const cat = await Category.create({ name: "Books", slug: "BOOKS" });
    expect(cat._id).toBeDefined();
    expect(cat.name).toBe("Books");
    expect(cat.slug).toBe("books");
  });

  it("enforces required name", async () => {
    await expect(Category.create({ slug: "no-name" })).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  it("enforces unique name", async () => {
    await Category.create({ name: "Electronics", slug: "electronics" });

    await expect(
      Category.create({ name: "Electronics", slug: "electronics-2" })
    ).rejects.toThrow(); // E11000 duplicate key
  });
});
