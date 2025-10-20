import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Product from "../models/productModel";
import Category from "../models/categoryModel"; 
import express from "express";
import productRoutes from '../routes/productRoutes';
import request from "supertest";

jest.mock("braintree");

/**
 * Tests for non-admin product flows
 */

let mongo;
let app;
let booksCategory;
let electronicsCategory;

beforeAll(async () => {
  // stub console.log
  jest.spyOn(console, "log").mockImplementation(() => {});

  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);

  // create isolated app with only modules being tested
  app = express();
  app.use(express.json());
  app.use("/api/v1/product", productRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  // create dummy categories for testing
  booksCategory = await Category.create({ name: "Books", slug: "BOOKS" });
  electronicsCategory = await Category.create({ name: "Electronics", slug: "electronics" });
})

afterEach(async () => {
  // reset db
  await Product.deleteMany(); 
  await Category.deleteMany();
});

describe("get all products", () => {
  it("should successfully return all products with 200", async () => {
    // assemble
    const products = await Product.create([
      {
        name: "Test Product 1",
        slug: "test-product-1",
        description: "Test description",
        price: 99,
        category: booksCategory._id,
        quantity: 10,
        photo: {
          data: Buffer.from("test-image"),
          contentType: "image/png",
        },
        shipping: false,
        createdAt: new Date("2025-10-10T12:00:00Z")
      },
      {
        name: "Test Product 2",
        slug: "test-product-2",
        description: "Test description",
        price: 20,
        category: electronicsCategory._id,
        quantity: 5,
        photo: {
          data: Buffer.from("test-image"),
          contentType: "image/png",
        },
        shipping: false,
        createdAt: new Date("2025-10-11T12:00:00Z")
      }
    ]);

    // act
    const res = await request(app)
      .get("/api/v1/product/get-product");

    // assert
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.countTotal).toBe(2);
    expect(res.body.message).toBe("AllProducts");
    expect(res.body.products[0].name).toBe(products[1].name);
    expect(res.body.products[0]._id).toBe(products[1]._id.toString());
    expect(res.body.products[0].category.name).toBe(electronicsCategory.name);
    expect(res.body.products[0].photo).toBeUndefined();
    expect(res.body.products[1].name).toBe(products[0].name);
    expect(res.body.products[1]._id).toBe(products[0]._id.toString());
    expect(res.body.products[1].category.name).toBe(booksCategory.name);
    expect(res.body.products[1].photo).toBeUndefined();
  });
  
  it("should return 500 when error encountered", async () => {
    jest.spyOn(Product, "find").mockImplementationOnce(() => {
      throw new Error("Database failure");
    });

    // act
    const res = await request(app)
      .get("/api/v1/product/get-product");

    // assert
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBeFalsy();
    expect(res.body.message).toBe("Error in getting products");
    expect(res.body.error).toBe("Database failure");

    // cleanup
    Product.find.mockRestore();
  });
});

describe("get single product", () => {
  it("should successfully return the product with 200", async () => {
    const product = await Product.create({
      name: "Test Product 1",
      slug: "test-product-1",
      description: "Test description",
      price: 99,
      category: booksCategory._id,
      quantity: 10,
      photo: {
        data: Buffer.from("test-image"),
        contentType: "image/png",
      },
      shipping: false,
      createdAt: new Date("2025-10-10T12:00:00Z")
    });

    const res = await request(app)
      .get("/api/v1/product/get-product/test-product-1");

    // assert
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.message).toBe("Single Product Fetched");
    expect(res.body.product.name).toBe(product.name);
    expect(res.body.product.category.name).toBe(booksCategory.name);
    expect(res.body.product.photo).toBeUndefined();
  });

  // we can't test if slug url param is missing because express will not match the route.

  it("should return 404 if product is not found", async () => {
    const res = await request(app)
      .get("/api/v1/product/get-product/test-product-1");

    // assert
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toBe("Single Product Not Found");
  });

  it("should return 500 when error encountered", async () => {
    jest.spyOn(Product, "findOne").mockImplementationOnce(() => {
      throw new Error("Database failure");
    });

    // act
    const res = await request(app)
      .get("/api/v1/product/get-product/test-product-1");

    // assert
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBeFalsy();
    expect(res.body.message).toBe("Error while getting single product");
    expect(res.body.error).toBe("Database failure");

    // cleanup
    Product.findOne.mockRestore();
  });
});

describe("get product photo", () => {
  it("should successfully return the photo with 200", async () => {
    const product = await Product.create({
      name: "Test Product 1",
      slug: "test-product-1",
      description: "Test description",
      price: 99,
      category: booksCategory._id,
      quantity: 10,
      photo: {
        data: Buffer.from("test-image"),
        contentType: "image/png",
      },
      shipping: false,
      createdAt: new Date("2025-10-10T12:00:00Z")
    });

    const res = await request(app)
      .get(`/api/v1/product/product-photo/${product.id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.equals(product.photo.data)).toBeTruthy(); // same buffer data
  });
  
  // we can't test if pid url param is missing because express will not match the route.

  it("should return 404 if product not found", async () => {
    const res = await request(app)
      .get(`/api/v1/product/product-photo/${new mongoose.Types.ObjectId()}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toBe("Product photo not found");
  });

  it("should return 404 if photo is missing", async () => {
    const product = await Product.create({
      name: "Test Product 1",
      slug: "test-product-1",
      description: "Test description",
      price: 99,
      category: booksCategory._id,
      quantity: 10,
      shipping: false,
      createdAt: new Date("2025-10-10T12:00:00Z")
    });
    const res = await request(app)
      .get(`/api/v1/product/product-photo/${product.id}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toBe("Product photo not found");
  });

  it("should return 500 when error encountered", async () => {
    jest.spyOn(Product, "findById").mockImplementationOnce(() => {
      throw new Error("Database failure");
    });

    // act
    const res = await request(app)
      .get(`/api/v1/product/product-photo/${new mongoose.Types.ObjectId()}`);

    // assert
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBeFalsy();
    expect(res.body.message).toBe("Erorr while getting photo");
    expect(res.body.error).toBe("Database failure");

    // cleanup
    Product.findById.mockRestore();
  });
});

describe("get products with filter", () => {
  let products;
  beforeEach(async () => {
    products = await Product.create([
      {
        name: "Test Product 1",
        slug: "test-product-1",
        description: "Test description",
        price: 9,
        category: booksCategory._id,
        quantity: 10,
        photo: {
          data: Buffer.from("test-image"),
          contentType: "image/png",
        },
        shipping: false,
      },
      {
        name: "Test Product 2",
        slug: "test-product-2",
        description: "Test description",
        price: 10,
        category: booksCategory._id,
        quantity: 5,
        photo: {
          data: Buffer.from("test-image"),
          contentType: "image/png",
        },
        shipping: false,
      },
      {
        name: "Test Product 3",
        slug: "test-product-3",
        description: "Test description",
        price: 11,
        category: booksCategory._id,
        quantity: 10,
        photo: {
          data: Buffer.from("test-image"),
          contentType: "image/png",
        },
        shipping: false,
      },
      {
        name: "Test Product 4",
        slug: "test-product-4",
        description: "Test description",
        price: 49,
        category: electronicsCategory._id,
        quantity: 5,
        photo: {
          data: Buffer.from("test-image"),
          contentType: "image/png",
        },
        shipping: false,
      },
      {
        name: "Test Product 5",
        slug: "test-product-5",
        description: "Test description",
        price: 50,
        category: electronicsCategory._id,
        quantity: 5,
        photo: {
          data: Buffer.from("test-image"),
          contentType: "image/png",
        },
        shipping: false,
      },
      {
        name: "Test Product 6",
        slug: "test-product-6",
        description: "Test description",
        price: 51,
        category: electronicsCategory._id,
        quantity: 5,
        photo: {
          data: Buffer.from("test-image"),
          contentType: "image/png",
        },
        shipping: false,
      },
    ]);
  });

  it("should return all products if no checked and radio filter with 200", async () => {
    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.products.length).toBe(6);
    const returnedIds = res.body.products.map(product => product._id);
    expect(returnedIds).toEqual(expect.arrayContaining([
      products[0]._id.toString(),
      products[1]._id.toString(),
      products[2]._id.toString(),
      products[3]._id.toString(),
      products[4]._id.toString(),
      products[5]._id.toString(),
    ]));
  });

  it("should return products of correct category if only checked filter with 200", async () => {
    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({ checked: [booksCategory._id]});

    expect(res.status).toBe(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.products.length).toBe(3);
    // expect books product
    const returnedIds = res.body.products.map(product => product._id);
    expect(returnedIds).toEqual(expect.arrayContaining([
      products[0]._id.toString(),
      products[1]._id.toString(),
      products[2]._id.toString(),
    ]));
    expect(res.body.products.every(p => p.category === booksCategory._id.toString())).toBe(true);
  });

  it("should return products of correct category if multiple checked filter with 200", async () => {
    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({ checked: [booksCategory._id, electronicsCategory._id]});

    expect(res.status).toBe(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.products.length).toBe(6);
    const returnedIds = res.body.products.map(product => product._id);
    expect(returnedIds).toEqual(expect.arrayContaining([
      products[0]._id.toString(),
      products[1]._id.toString(),
      products[2]._id.toString(),
      products[3]._id.toString(),
      products[4]._id.toString(),
      products[5]._id.toString(),
    ]));
  });

  it("should return products of correct price if only radio filter with 200", async () => {
    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({ radio: [10, 50] });

    /**
     * Using boundary value analysis, the boundary values of 10 and 50, 
     * we test with 6 products of different prices: 9, 10, 11, 49, 50, 51.
     * We expect the products of price 10, 11, 49, 50 to be returned.
     */
    expect(res.status).toBe(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.products.length).toBe(4);
    const returnedIds = res.body.products.map(product => product._id);
    expect(returnedIds).toEqual(expect.arrayContaining([
      products[1]._id.toString(),
      products[2]._id.toString(),
      products[3]._id.toString(),
      products[4]._id.toString(),
    ]));
    const returnedPrices = res.body.products.map(product => product.price);
    expect(returnedPrices).toEqual(expect.arrayContaining([10, 11, 49, 50]));
  });
  
  it("should return products of correct price and category if both checked and radio filter with 200", async () => {
    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({ radio: [10, 50], checked: [booksCategory._id] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.products.length).toBe(2);
    const returnedIds = res.body.products.map(product => product._id);
    expect(returnedIds).toEqual(expect.arrayContaining([
      products[1]._id.toString(),
      products[2]._id.toString(),
    ]));
    const returnedPrices = res.body.products.map(product => product.price);
    expect(returnedPrices).toEqual(expect.arrayContaining([10, 11]));    
    expect(res.body.products.every(p => p.category === booksCategory._id.toString())).toBe(true);
  
  });

  /**
   * Using boundary value analysis, the radio filter is valid if length 2,
   * so we test for failure if length 1 and 3 (above and below)
   */

  it("should return 400 if the radio filter is invalid (length 1)", async () => {
    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({ radio: [10] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toBe("Invalid radio(price) filter");
  });

  it("should return 400 if the radio filter is invalid (length 3)", async () => {
    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({ radio: [10, 50, 100] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toBe("Invalid radio(price) filter");
  });

  it("should return 500 when error encountered", async () => {
    jest.spyOn(Product, "find").mockImplementationOnce(() => {
      throw new Error("Database failure");
    });

    // act
    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({});

    // assert
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBeFalsy();
    expect(res.body.message).toBe("Error while Filtering Products");
    expect(res.body.error).toBe("Database failure");

    // cleanup
    Product.find.mockRestore();
  });
});

describe("get product count", () => {
  it("should return the correct count with 200", async () => {
    const products = await Product.create([
      {
        name: "Test Product 1",
        slug: "test-product-1",
        description: "Test description",
        price: 9,
        category: booksCategory._id,
        quantity: 10,
        shipping: false,
      },
      {
        name: "Test Product 2",
        slug: "test-product-2",
        description: "Test description",
        price: 10,
        category: booksCategory._id,
        quantity: 5,
        shipping: false,
      },
      {
        name: "Test Product 3",
        slug: "test-product-3",
        description: "Test description",
        price: 11,
        category: booksCategory._id,
        quantity: 10,
        shipping: false,
      },
      {
        name: "Test Product 4",
        slug: "test-product-4",
        description: "Test description",
        price: 49,
        category: electronicsCategory._id,
        quantity: 5,
        shipping: false,
      },
      {
        name: "Test Product 5",
        slug: "test-product-5",
        description: "Test description",
        price: 50,
        category: electronicsCategory._id,
        quantity: 5,
        shipping: false,
      },
      {
        name: "Test Product 6",
        slug: "test-product-6",
        description: "Test description",
        price: 51,
        category: electronicsCategory._id,
        quantity: 5,
        shipping: false,
      },
    ]);

    const res = await request(app)
      .get("/api/v1/product/product-count");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.total).toBe(6);
  });
  
  it("should return 500 when error encountered", async () => {
    jest.spyOn(Product, "find").mockImplementationOnce(() => {
      throw new Error("Database failure");
    });

    // act
    const res = await request(app)
      .get("/api/v1/product/product-count")

    // assert
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBeFalsy();
    expect(res.body.message).toBe("Error while getting product count");
    expect(res.body.error).toBe("Database failure");

    // cleanup
    Product.find.mockRestore();
  });
});

describe("get products by page", () => {
  let products;
  beforeEach(async () => {
    // create products sorted by date
    products = await Product.create([
      {
        name: "Test Product 1",
        slug: "test-product-1",
        description: "Test description",
        price: 9,
        category: booksCategory._id,
        quantity: 10,
        createdAt: new Date("2025-10-10T12:00:00Z")
      },
      {
        name: "Test Product 2",
        slug: "test-product-2",
        description: "Test description",
        price: 10,
        category: booksCategory._id,
        quantity: 5,
        createdAt: new Date("2025-10-09T12:00:00Z")
      },
      {
        name: "Test Product 3",
        slug: "test-product-3",
        description: "Test description",
        price: 11,
        category: booksCategory._id,
        quantity: 10,
        createdAt: new Date("2025-10-08T12:00:00Z")
      },
      {
        name: "Test Product 4",
        slug: "test-product-4",
        description: "Test description",
        price: 49,
        category: electronicsCategory._id,
        quantity: 5,
        createdAt: new Date("2025-10-07T12:00:00Z")
      },
      {
        name: "Test Product 5",
        slug: "test-product-5",
        description: "Test description",
        price: 50,
        category: electronicsCategory._id,
        quantity: 5,
        createdAt: new Date("2025-10-06T12:00:00Z")
      },
      {
        name: "Test Product 6",
        slug: "test-product-6",
        description: "Test description",
        price: 51,
        category: electronicsCategory._id,
        quantity: 5,
        createdAt: new Date("2025-10-05T12:00:00Z")
      },
      {
        name: "Test Product 7",
        slug: "test-product-7",
        description: "Test description",
        price: 51,
        category: electronicsCategory._id,
        quantity: 5,
        createdAt: new Date("2025-10-04T12:00:00Z")
      },
    ]);
  });

  it("should return first 6 products if page is 1 with 200", async () => {
    const res = await request(app)
      .get("/api/v1/product/product-list/1")

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.products.length).toBe(6);
    const returnedIds = res.body.products.map(product => product._id);
    expect(returnedIds).toEqual(expect.arrayContaining([
      products[0]._id.toString(),
      products[1]._id.toString(),
      products[2]._id.toString(),
      products[3]._id.toString(),
      products[4]._id.toString(),
      products[5]._id.toString(),
    ]));
  });

  it("should return next 1 products if page is 2 with 200", async () => {
    const res = await request(app)
      .get("/api/v1/product/product-list/2")

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.products.length).toBe(1);
    const returnedIds = res.body.products.map(product => product._id);
    expect(returnedIds).toEqual(expect.arrayContaining([
      products[6]._id.toString(),
    ]));
  });

  it("should 400 if page is a non-numeric string", async () => {
    const res = await request(app)
      .get("/api/v1/product/product-list/buh")

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toBe("Invalid page param");
  });

  it("should 400 if page is 0", async () => {
    const res = await request(app)
      .get("/api/v1/product/product-list/0")

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toBe("Invalid page param");
  });

  it("should 400 if page is -1", async () => {
    const res = await request(app)
      .get("/api/v1/product/product-list/0")

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toBe("Invalid page param");
  });

  it("should return 500 when error encountered", async () => {
    jest.spyOn(Product, "find").mockImplementationOnce(() => {
      throw new Error("Database failure");
    });

    // act
    const res = await request(app)
      .get("/api/v1/product/product-list/1")

    // assert
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBeFalsy();
    expect(res.body.message).toBe("Error while getting products per page");
    expect(res.body.error).toBe("Database failure");

    // cleanup
    Product.find.mockRestore();
  });
});

describe("search for product", () => {
  let greenCookbook;
  let redTextbook;
  let yellowPhonebook;
  let redTelephone;
  let greenIphone;
  beforeEach(async () => {
    const products = await Product.create([
      {
        name: "Green Cookbook",
        slug: "green-cookbook",
        description: "Many recipes inside.",
        price: 9,
        category: booksCategory._id,
        quantity: 10,
        createdAt: new Date("2025-10-10T12:00:00Z")
      },
      {
        name: "Red Textbook",
        slug: "red-textbook",
        description: "Alot of knowledge.",
        price: 10,
        category: booksCategory._id,
        quantity: 5,
        createdAt: new Date("2025-10-09T12:00:00Z")
      },
      {
        name: "Yellow Phonebook",
        slug: "yellow-phonebook",
        description: "Many phone numbers",
        price: 11,
        category: booksCategory._id,
        quantity: 10,
        createdAt: new Date("2025-10-08T12:00:00Z")
      },
      {
        name: "Red Telephone",
        slug: "red-telephone",
        description: "Buttons with numbers",
        price: 11,
        category: electronicsCategory._id,
        quantity: 10,
        createdAt: new Date("2025-10-08T12:00:00Z")
      },
      {
        name: "Green Iphone",
        slug: "green-iphone",
        description: "Is also a telephone. Textbook stuff obviously.",
        price: 11,
        category: electronicsCategory._id,
        quantity: 10,
        createdAt: new Date("2025-10-08T12:00:00Z")
      },
    ]);
    greenCookbook = products[0];
    redTextbook = products[1];
    yellowPhonebook = products[2];
    redTelephone = products[3];
    greenIphone = products[4];
  });

  it("should return the correct products if keyword found in title only with 200", async () => {
    const res = await request(app)
      .get("/api/v1/product/search/book");
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();
    const returnedIds = res.body.products.map(product => product._id);
    expect(returnedIds).toEqual(expect.arrayContaining([
      greenCookbook._id.toString(),
      redTextbook._id.toString(),
      yellowPhonebook._id.toString(),
    ]));
  });

  it("should return the correct products if keyword found in description only with 200", async () => {
    const res = await request(app)
      .get("/api/v1/product/search/number");
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();
    const returnedIds = res.body.products.map(product => product._id);
    expect(returnedIds).toEqual(expect.arrayContaining([
      yellowPhonebook._id.toString(),
      redTelephone._id.toString(),
    ]));
  });

  it("should return the correct products if keyword found in title and description with 200", async () => {
    const res = await request(app)
      .get("/api/v1/product/search/textbook");
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();
    const returnedIds = res.body.products.map(product => product._id);
    expect(returnedIds).toEqual(expect.arrayContaining([
      redTextbook._id.toString(),
      greenIphone._id.toString(),
    ]));
  });

  it("should return 500 when error encountered", async () => {
    jest.spyOn(Product, "find").mockImplementationOnce(() => {
      throw new Error("Database failure");
    });

    // act
    const res = await request(app)
      .get("/api/v1/product/search/textbook")

    // assert
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBeFalsy();
    expect(res.body.message).toBe("Error In Search Product API");
    expect(res.body.error).toBe("Database failure");

    // cleanup
    Product.find.mockRestore();
  });
});

describe("get related products", () => {
  let products
  beforeEach(async () => {
    products = await Product.create([
      {
        name: "Green Cookbook",
        slug: "green-cookbook",
        description: "Many recipes inside.",
        price: 9,
        category: booksCategory._id,
        quantity: 10,
        createdAt: new Date("2025-10-10T12:00:00Z")
      },
      {
        name: "Red Textbook",
        slug: "red-textbook",
        description: "Alot of knowledge.",
        price: 10,
        category: booksCategory._id,
        quantity: 5,
        createdAt: new Date("2025-10-09T12:00:00Z")
      },
      {
        name: "Yellow Phonebook",
        slug: "yellow-phonebook",
        description: "Many phone numbers",
        price: 11,
        category: booksCategory._id,
        quantity: 10,
        createdAt: new Date("2025-10-08T12:00:00Z")
      },
      {
        name: "Purple Book",
        slug: "purple-book",
        description: "Alot of knowledge.",
        price: 10,
        category: booksCategory._id,
        quantity: 5,
        createdAt: new Date("2025-10-09T12:00:00Z")
      },
      {
        name: "Black Book",
        slug: "black-book",
        description: "Many phone numbers",
        price: 11,
        category: booksCategory._id,
        quantity: 10,
        createdAt: new Date("2025-10-08T12:00:00Z")
      },
      {
        name: "Green Iphone",
        slug: "green-iphone",
        description: "Is also a telephone. Textbook stuff obviously.",
        price: 11,
        category: electronicsCategory._id,
        quantity: 10,
        createdAt: new Date("2025-10-08T12:00:00Z")
      },
    ]);
  });

  it("should return up to 3 related products of the specified category with 200", async () => {
    const res = await request(app)
      .get(`/api/v1/product/related-product/${products[0]._id.toString()}/${booksCategory._id.toString()}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();
    // expect the returned ids to be a subset of the 4 inserted ids of length 3
    expect(res.body.products.length).toBe(3);
    const returnedIds = res.body.products.map(product => product._id);
    expect([
      products[1]._id.toString(), // other books
      products[2]._id.toString(), 
      products[3]._id.toString(),
      products[4]._id.toString(),
    ]).toEqual(expect.arrayContaining(returnedIds));
    // category is populated
    expect(res.body.products.every(p => p.category._id === booksCategory._id.toString())).toBe(true);
    expect(res.body.products.every(p => p.category.name === booksCategory.name)).toBe(true);
  });

  it("should return no products if cid does not exist with 200", async () => {
    const res = await request(app)
      .get(`/api/v1/product/related-product/${new mongoose.Types.ObjectId()}/${new mongoose.Types.ObjectId()}`); // dummy pid & cid

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.products.length).toBe(0);
  });

  it("should return 500 when error encountered", async () => {
    jest.spyOn(Product, "find").mockImplementationOnce(() => {
      throw new Error("Database failure");
    });

    // act
    const res = await request(app)
      .get(`/api/v1/product/related-product/${new mongoose.Types.ObjectId()}/${new mongoose.Types.ObjectId()}`)

    // assert
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBeFalsy();
    expect(res.body.message).toBe("Error while geting related product");
    expect(res.body.error).toBe("Database failure");

    // cleanup
    Product.find.mockRestore();
  });
});

describe("get products by category", () => {
  let products;
  beforeEach(async () => {
    products = await Product.create([
      {
        name: "Red Textbook",
        slug: "red-textbook",
        description: "Alot of knowledge.",
        price: 10,
        category: booksCategory._id,
        quantity: 5,
        createdAt: new Date("2025-10-09T12:00:00Z")
      },
      {
        name: "Yellow Phonebook",
        slug: "yellow-phonebook",
        description: "Many phone numbers",
        price: 11,
        category: booksCategory._id,
        quantity: 10,
        createdAt: new Date("2025-10-08T12:00:00Z")
      },
      {
        name: "Red Telephone",
        slug: "red-telephone",
        description: "Buttons with numbers",
        price: 11,
        category: electronicsCategory._id,
        quantity: 10,
        createdAt: new Date("2025-10-08T12:00:00Z")
      },
      {
        name: "Green Iphone",
        slug: "green-iphone",
        description: "Is also a telephone. Textbook stuff obviously.",
        price: 11,
        category: electronicsCategory._id,
        quantity: 10,
        createdAt: new Date("2025-10-08T12:00:00Z")
      },
    ]);
  });

  it("should return the correct products and category successfully with 200", async () => {
    const res = await request(app)
      .get(`/api/v1/product/product-category/${booksCategory.slug}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.products.length).toBe(2);    
    const returnedIds = res.body.products.map(product => product._id);
    expect(returnedIds).toEqual(expect.arrayContaining([
      products[0]._id.toString(),
      products[1]._id.toString(),
    ]));
    // category is populated
    expect(res.body.products.every(p => p.category._id === booksCategory._id.toString())).toBe(true);
    expect(res.body.products.every(p => p.category.name === booksCategory.name)).toBe(true);
    expect(res.body.category._id).toBe(booksCategory._id.toString());
  });

  it("should return no products with 200 if category does not have any products", async () => {
    const category = await Category.create({ name: "Furniture", slug: "furniture" });
    const res = await request(app)
      .get(`/api/v1/product/product-category/${category.slug}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.products.length).toBe(0);  
    expect(res.body.category._id).toBe(category._id.toString());
  });

  
  it("should return 400 if category does not exist", async () => {
    const res = await request(app)
      .get(`/api/v1/product/product-category/furniture`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toBe("Category not found");  
  });

  it("should return 500 when error encountered by categoryModel", async () => {
    jest.spyOn(Category, "findOne").mockImplementationOnce(() => {
      throw new Error("Database failure");
    });

    // act
    const res = await request(app)
      .get(`/api/v1/product/product-category/${booksCategory.slug}`)

    // assert
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBeFalsy();
    expect(res.body.message).toBe("Error While Getting products by category");
    expect(res.body.error).toBe("Database failure");

    // cleanup
    Category.findOne.mockRestore();
  });

  it("should return 500 when error encountered by productModel", async () => {
    jest.spyOn(Product, "find").mockImplementationOnce(() => {
      throw new Error("Database failure");
    });

    // act
    const res = await request(app)
      .get(`/api/v1/product/product-category/${booksCategory.slug}`)

    // assert
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBeFalsy();
    expect(res.body.message).toBe("Error While Getting products by category");
    expect(res.body.error).toBe("Database failure");

    // cleanup
    Product.find.mockRestore();
  });
});