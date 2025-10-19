import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import JWT from "jsonwebtoken";
import categoryModel from "./categoryModel.js";
import userModel from "./userModel.js";

describe("Category Model Integration Behaviour", () => {
  let mongoServer;
  let adminUser;
  let regularUser;
  let adminToken;
  let regularToken;
  const { JWT_SECRET: originalJwtSecret } = process.env;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    process.env.JWT_SECRET = "temporary_secret";

    adminUser = await userModel.create({
      name: "Luna Tan",
      email: "luna.admin@example.com",
      password: "securepass123",
      phone: "91234567",
      address: "78 Clementi Street, Singapore",
      answer: "Blue",
      role: 1,
    });

    regularUser = await userModel.create({
      name: "Ethan Koh",
      email: "ethan.k@example.com",
      password: "mypassword",
      phone: "81234567",
      address: "12 Bukit Timah Rd, Singapore",
      answer: "Green",
    });

    adminToken = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    regularToken = JWT.sign({ _id: regularUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
  });

  afterEach(async () => {
    process.env.JWT_SECRET = originalJwtSecret;
    await categoryModel.deleteMany();
    await userModel.deleteMany();
  });

  it("creates a new category entry in the database", async () => {
    const data = { name: "Eco Products", slug: "eco-products" };
    const result = await categoryModel.create(data);

    expect(result).toBeDefined();
    expect(result.name).toBe("Eco Products");
    expect(result.slug).toBe("eco-products");
  });

  it("throws validation error when 'name' field is missing", async () => {
    const invalid = { slug: "missing-name" };

    await categoryModel.create(invalid).catch((err) => {
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.name).toBeDefined();
      expect(err.errors.name.message).toBe("Path `name` is required.");
    });
  });

  it("prevents insertion of categories with duplicate names", async () => {
    await categoryModel.create({ name: "Kitchenware", slug: "kitchenware" });

    await categoryModel
      .create({ name: "Kitchenware", slug: "home-utensils" })
      .catch((err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toContain("duplicate key error");
      });
  });

  it("automatically lowercases the slug field", async () => {
    const entry = await categoryModel.create({
      name: "Gaming Gear",
      slug: "GAMING-GEAR",
    });

    expect(entry.slug).toBe("gaming-gear");
  });

  it("updates an existing category’s fields correctly", async () => {
    const created = await categoryModel.create({
      name: "Gardening Tools",
      slug: "garden-tools",
    });

    const modified = await categoryModel.findByIdAndUpdate(
      created._id,
      { name: "Outdoor Equipment", slug: "outdoor-equipment" },
      { new: true }
    );

    expect(modified).toBeDefined();
    expect(modified.name).toBe("Outdoor Equipment");
    expect(modified.slug).toBe("outdoor-equipment");
  });

  it("removes a category from the collection", async () => {
    const created = await categoryModel.create({
      name: "Home Fragrance",
      slug: "home-fragrance",
    });

    await categoryModel.findByIdAndDelete(created._id);
    const lookup = await categoryModel.findById(created._id);
    expect(lookup).toBeNull();
  });
});
