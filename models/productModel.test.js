import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import productModel from "./productModel";

describe("productModel mongoose", () => {
  let mongo;
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  describe("should fail if required fields are missing", () => {
    let productData;
    
    beforeEach(() => {
      productData = {
        name: "Test Product",
        slug: "test-product",
        description: "Test description",
        price: 99,
        category: new mongoose.Types.ObjectId(),
        quantity: 5,
      };
    });

    test("name missing", async () => {
      delete productData.name;
      const product = new productModel(productData);
      await expect(product.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    test("slug missing", async () => {
      delete productData.slug;
      const product = new productModel(productData);
      await expect(product.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    test("description missing", async () => {
      delete productData.description;
      const product = new productModel(productData);
      await expect(product.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    test("price missing", async () => {
      delete productData.price;
      const product = new productModel(productData);
      await expect(product.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    test("category missing", async () => {
      delete productData.category;
      const product = new productModel(productData);
      await expect(product.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    test("quantity missing", async () => {
      delete productData.quantity;
      const product = new productModel(productData);
      await expect(product.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });
  });

  it("should create a product successfully if all fields are valid", async () => {
    const productData = {
      name: "Test Product",
      slug: "test-product",
      description: "Test description",
      price: 99,
      category: new mongoose.Types.ObjectId(),
      quantity: 5,
      shipping: false,
    };

    const product = new productModel(productData);
    const savedProduct = await product.save();

    expect(savedProduct._id).toBeDefined();
    expect(savedProduct.name).toBe(productData.name);
    expect(savedProduct.slug).toBe(productData.slug);
    expect(savedProduct.description).toBe(productData.description);
    expect(savedProduct.price).toBe(productData.price);
    expect(savedProduct.quantity).toBe(productData.quantity);
    expect(savedProduct.shipping).toBe(productData.shipping);
  });

  it("should store photo buffer correctly", async () => {
    const productData = {
      name: "Test Product",
      slug: "test-product",
      description: "Test description",
      price: 99,
      category: new mongoose.Types.ObjectId(),
      quantity: 5,
      photo: {
        data: Buffer.from("test-image"),
        contentType: "image/png",
      },
      shipping: false,
    };

    const product = new productModel(productData);
    const savedProduct = await product.save();

    expect(savedProduct.photo.data.equals(productData.photo.data)).toBeTruthy();
    expect(savedProduct.photo.contentType).toBe("image/png");
  });
});
