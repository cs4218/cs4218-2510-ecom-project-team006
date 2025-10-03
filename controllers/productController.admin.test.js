import { createProductController, updateProductController, deleteProductController } from "../controllers/productController.js";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import fs from "fs";
import slugify from "slugify";

jest.mock("../models/productModel.js");
jest.mock("../models/categoryModel.js");
jest.mock("fs");
jest.mock("braintree");

describe("createProductController", () => {
  let req, res;

  beforeEach(() => {
    req = { fields: {}, files: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test.each([
    ["name", "Name is required"],
    ["description", "Description is required"],
    ["price", "Price is required"],
    ["category", "Category is required"],
    ["quantity", "Quantity is required"],
    ["shipping", "Shipping is required"]
  ])("unsuccessful when %s is missing", async (field, error) => {
    req.fields = {
      name: "Test Product",
      description: "Desc",
      price: 10,
      category: "1",
      quantity: 5,
      shipping: "1",
    };
    delete req.fields[field];

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: error, success: false });
  });

  test("unsuccesful if photo size > 1MB", async () => {
    req.fields = {
      name: "Test",
      description: "Desc",
      category: "1",
      price: 10,
      quantity: 5,
      shipping: 1,
    };
    req.files = { photo: { size: 2000000 } };

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Photo should be less than 1MB", success: false })
    );
  });

  test("unsuccessful if product with same slug exists", async () => {
    req.fields = {
      name: "Test Product",
      description: "Desc",
      price: 10,
      category: "1",
      quantity: 5,
      shipping: 1,
    };

    productModel.findOne.mockResolvedValue({ _id: "1" });

    await createProductController(req, res);

    expect(productModel.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ slug: slugify("Test Product") })
    );
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.send).toHaveBeenCalledWith(
      { message: "Product with this name already exists", success: false }
    );
  });

  test("unsuccessful if category is provided but not found", async () => {
    req.fields = {
      name: "Test",
      description: "Desc",
      price: 10,
      category: "1",
      quantity: 5,
      shipping: 1,
    };

    productModel.findOne.mockResolvedValue(null);
    categoryModel.findById.mockResolvedValue(null);

    await createProductController(req, res);

    expect(categoryModel.findById).toHaveBeenCalledWith(req.fields.category);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith(
      {"message": "Category not found", "success": false}
    );
  });

  test("creates product successfully with photo", async () => {
    req.fields = {
      name: "Test Product",
      description: "Desc",
      price: 10,
      category: "1",
      quantity: 5,
      shipping: 1,
    };
    req.files = { photo: { path: "mockpath", type: "image/png" } };

    productModel.findOne.mockResolvedValue(null);
    categoryModel.findById.mockResolvedValue({ _id: "1" });
    fs.readFileSync.mockReturnValue("mock-binary");

    const savedProduct = {
      ...req.fields,
      slug: slugify(req.fields.name),
      _id: "1"
    };
    const saveMock = jest.fn().mockResolvedValue(savedProduct);
    productModel.mockImplementation(() => ({
      save: saveMock,
      photo: {}
    }));

    await createProductController(req, res);

    expect(fs.readFileSync).toHaveBeenCalledWith("mockpath"); 
    expect(productModel).toHaveBeenCalledWith({
      ...req.fields,
      slug: slugify(req.fields.name)
    });
    expect(saveMock).toHaveBeenCalled();
    const createdProduct = saveMock.mock.instances[0];
    expect(createdProduct.photo.data).toEqual("mock-binary");
    expect(createdProduct.photo.contentType).toBe("image/png");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product created successfully",
      product: savedProduct
    });
  });

  test("creates product successfully without photo", async () => {
    req.fields = {
      name: "Test Product",
      description: "Desc",
      price: 10,
      category: "1",
      quantity: 5,
      shipping: 1,
    };

    productModel.findOne.mockResolvedValue(null);
    categoryModel.findById.mockResolvedValue({ _id: "1" });

    const savedProduct = {
      ...req.fields,
      slug: slugify(req.fields.name),
      _id: "1"
    };
    const saveMock = jest.fn().mockResolvedValue(savedProduct);
    productModel.mockImplementation(() => ({
      save: saveMock,
      photo: {}
    }));

    await createProductController(req, res);

    expect(fs.readFileSync).not.toHaveBeenCalled(); 
    expect(productModel).toHaveBeenCalledWith({
      ...req.fields,
      slug: slugify(req.fields.name)
    });
    expect(saveMock).toHaveBeenCalled();
    const createdProduct = saveMock.mock.instances[0];
    expect(createdProduct.photo).toEqual({});
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product created successfully",
      product: savedProduct
    });
  });

  test("handles server error", async () => {
    req.fields = {
      name: "Test Product",
      description: "Desc",
      price: 10,
      category: "1",
      quantity: 5,
      shipping: 1,
    };

    productModel.findOne.mockRejectedValue(new Error("DB error"));

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error in creating product",
        error: new Error("DB error"),
      })
    );
  });
});

describe("updateProductController", () => {
  let req, res;

  beforeEach(() => {
    req = { fields: {}, params: {} , files: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });



  test("unsuccessful if id param is missing", async () => {
    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Product ID is required",
    });
  });

  test.each([
    ["name", "Name is required"],
    ["description", "Description is required"],
    ["price", "Price is required"],
    ["category", "Category is required"],
    ["quantity", "Quantity is required"],
    ["shipping", "Shipping is required"]
  ])("unsuccessful when %s is missing", async (field, error) => {
    req.params = { pid: "123" };
    req.fields = {
      name: "Test Product",
      description: "Desc",
      price: 10,
      category: "1",
      quantity: 5,
      shipping: "1",
    };
    delete req.fields[field];

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: error, success: false });
  });

  test("unsuccesful if photo size > 1MB", async () => {
    req.params = { pid: "123" };
    req.fields = {
      name: "Test",
      description: "Desc",
      category: "1",
      price: 10,
      quantity: 5,
      shipping: 1,
    };
    req.files = { photo: { size: 2000000 } };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Photo should be less than 1MB", success: false })
    );
  });

  test("unsusccessful if product with same id is not found", async () => {
    req.params = { pid: "123" };
    req.fields = {
      name: "Test",
      description: "Desc",
      category: "1",
      price: 10,
      quantity: 5,
      shipping: 1,
    };

    productModel.findById.mockResolvedValue(null);

    await updateProductController(req, res);

    expect(productModel.findById).toHaveBeenCalledWith("123");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Product not found",
    });
  });

  test("unsuccessful if product with same slug exists", async () => {
    req.params = { pid: "123" };
    req.fields = {
      name: "Test Product",
      description: "Desc",
      price: 10,
      category: "1",
      quantity: 5,
      shipping: 1,
    };

    productModel.findById.mockResolvedValue({ _id: "123" });
    productModel.findOne.mockResolvedValue({ _id: "1" });

    await updateProductController(req, res);

    expect(productModel.findById).toHaveBeenCalledWith("123");
    expect(productModel.findOne).toHaveBeenCalledWith({ slug: slugify("Test Product") });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.send).toHaveBeenCalledWith(
      { message: "Product with this name already exists", success: false }
    );
  });

  test("unsuccessful if category is provided but not found", async () => {
    req.params = { pid: "123" };
    req.fields = {
      name: "Test",
      description: "Desc",
      price: 10,
      category: "1",
      quantity: 5,
      shipping: 1,
    };

    productModel.findById.mockResolvedValue({ _id: "123" });
    productModel.findOne.mockResolvedValue(null);
    categoryModel.findById.mockResolvedValue(null);

    await updateProductController(req, res);

    expect(categoryModel.findById).toHaveBeenCalledWith("1");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith(
      {"message": "Category not found", "success": false}
    );
  });
  
  test("updates product successfully with photo", async () => {
    req.params = { pid: "123" };
    req.fields = {
      name: "Test Product",
      description: "Desc",
      price: 10,
      category: "1",
      quantity: 5,
      shipping: 1,
    };
    req.files = { photo: { path: "mockpath", type: "image/png" } };

    const savedProduct = {
      ...req.fields,
      slug: slugify(req.fields.name),
      _id: "123"
    };
    const saveMock = jest.fn().mockResolvedValue(savedProduct);
    const product = { _id: "123", photo: {}, save: saveMock };
    productModel.findById.mockResolvedValue(product);
    productModel.findOne.mockResolvedValue(null);
    categoryModel.findById.mockResolvedValue({ _id: "1" });
    fs.readFileSync.mockReturnValue("mock-binary");

    const assignSpy = jest.spyOn(Object, "assign");

    await updateProductController(req, res);

    expect(assignSpy).toHaveBeenCalledWith(
      product,
      { ...req.fields, slug: slugify(req.fields.name) }
    );
    expect(fs.readFileSync).toHaveBeenCalledWith("mockpath"); 
    expect(saveMock).toHaveBeenCalled();
    const updatedProduct = saveMock.mock.instances[0];
    expect(updatedProduct.photo.data).toEqual("mock-binary");
    expect(updatedProduct.photo.contentType).toBe("image/png");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product updated successfully",
      product: savedProduct
    });
  });

    
  test("updates product successfully without photo", async () => {
    req.params = { pid: "123" };
    req.fields = {
      name: "Test Product",
      description: "Desc",
      price: 10,
      category: "1",
      quantity: 5,
      shipping: 1,
    };

    const savedProduct = {
      ...req.fields,
      slug: slugify(req.fields.name),
      _id: "123"
    };
    const saveMock = jest.fn().mockResolvedValue(savedProduct);
    const product = { _id: "123", photo: {}, save: saveMock };
    productModel.findById.mockResolvedValue(product);
    productModel.findOne.mockResolvedValue(null);
    categoryModel.findById.mockResolvedValue({ _id: "1" });
    const assignSpy = jest.spyOn(Object, "assign");

    await updateProductController(req, res);

    expect(assignSpy).toHaveBeenCalledWith(
      product,
      { ...req.fields, slug: slugify(req.fields.name) }
    );
    expect(fs.readFileSync).not.toHaveBeenCalled(); 
    expect(saveMock).toHaveBeenCalled();
    const updatedProduct = saveMock.mock.instances[0];
    expect(updatedProduct.photo).toEqual({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product updated successfully",
      product: savedProduct
    });
  });

  test("handles server error", async () => {
    req.params = { pid: "123" };
    req.fields = {
      name: "Test",
      description: "Desc",
      price: 10,
      category: "1",
      quantity: 5,
      shipping: 1,
    };

    productModel.findById.mockRejectedValue(new Error("DB error"));

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: "Error in updating product",
    }));
  });
});

describe("deleteProductController", () => {
  let req, res;

  beforeEach(() => {
    req = { params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test("unsuccesful if id param is missing", async () => {
    await deleteProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Product ID is required",
    });
  });

  test("unsuccessful if product with same id is not found", async () => {
    req.params = { pid: "1" };
    productModel.findByIdAndDelete.mockResolvedValue(null);

    await deleteProductController(req, res);

    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("1");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Product not found",
    });
  });

  test("deletes product successfully", async () => {
    req.params = { pid: "1" };
    productModel.findByIdAndDelete.mockResolvedValue({ _id: "1", name: "Product 1" });

    await deleteProductController(req, res);

    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product deleted successfully",
    });
  });

  test("handles server error", async () => {
    req.params = { pid: "1" };
    productModel.findByIdAndDelete.mockRejectedValue(new Error("DB error"));

    await deleteProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: new Error("DB error"),
      message: "Error while deleting product",
    });
  });
});