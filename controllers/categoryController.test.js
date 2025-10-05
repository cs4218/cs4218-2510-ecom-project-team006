import { createCategoryController, updateCategoryController, deleteCategoryController } from "./categoryController.js";
import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";

// AI Attribution: The following test code was generated with the assistance of AI (ChatGPT).

jest.mock("../models/categoryModel.js");

describe("createCategoryController", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test("unsuccessful if name is missing", async () => {
    req.body = {};
    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Name is required",
    });
  });

  test("unsuccessful if category already exists", async () => {
    req.body = { name: "Category 1" };
    categoryModel.findOne.mockResolvedValueOnce({ _id: "1", name: "Category 1" });

    await createCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: slugify("Category 1") });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Category with this name already exists",
    });
  });

  test("creates new category successfully", async () => {
    req.body = { name: "Category 1" };
    categoryModel.findOne.mockResolvedValueOnce(null);
    const savedCategory = { _id: "1", name: "Category 1", slug: slugify("Category 1") };
    const saveMock = jest.fn().mockResolvedValue(savedCategory);
    categoryModel.mockImplementation(() => ({
      save: saveMock,
    }));

    await createCategoryController(req, res);

    expect(categoryModel).toHaveBeenCalledWith({ name: "Category 1", slug: slugify("Category 1") });
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "New category created",
      category: savedCategory,
    });
  });

  test("handles server error", async () => {
    req.body = { name: "Category 1" };
    categoryModel.findOne.mockRejectedValueOnce(new Error("DB error"));

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: new Error("DB error"),
        message: "Error while creating category",
      })
    );
  });
});

describe("updateCategoryController", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test("unsuccessful if name is missing", async () => {
    req.params = { id: "1" };
    req.body = {};

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Name is required",
    });
  });

  test("unsuccessful if id param is missing", async () => {
    req.params = {}; 
    req.body = { name: "Updated" };

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Category ID is required",
    });
 });

  test("unsuccessful if category with same slug exists", async () => {
    req.params = { id: "1" };
    req.body = { name: "Duplicate" };

    categoryModel.findOne.mockResolvedValueOnce({ _id: "2", name: "Duplicate" });

    await updateCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: slugify("Duplicate") });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Category with this name already exists",
    });
  });

  test("unsuccessful if category with same id is not found", async () => {
    req.params = { id: "1" };
    req.body = { name: "Updated" };

    categoryModel.findOne.mockResolvedValue(null);
    categoryModel.findByIdAndUpdate.mockResolvedValue(null);

    await updateCategoryController(req, res);

    expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "1",
      { name: "Updated", slug: slugify("Updated") },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Category with this ID not found",
    });
  });

  test("updates category successfully", async () => {
    req.params = { id: "1" };
    req.body = { name: "Updated" };

    const updatedCategory = { _id: "1", name: "Updated", slug: slugify("Updated") };

    categoryModel.findOne.mockResolvedValue(null);
    categoryModel.findByIdAndUpdate.mockResolvedValue(updatedCategory);

    await updateCategoryController(req, res);

    expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "1",
      { name: "Updated", slug: slugify("Updated") },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Category updated successfully",
      category: updatedCategory,
    });
  });

  test("handles server error", async () => {
    req.params = { id: "1" };
    req.body = { name: "Updated" };

    categoryModel.findOne.mockRejectedValue(new Error("DB error"));

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: new Error("DB error"),
        message: "Error while updating category",
      })
    );
  });
});

describe("deleteCategoryController", () => {
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
    req.params = {};

    await deleteCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Category ID is required",
    });
  });

  test("unsuccessful if category with same id is not found", async () => {
    req.params = { id: "1" };
    categoryModel.findByIdAndDelete.mockResolvedValue(null);

    await deleteCategoryController(req, res);

    expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("1");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Category not found",
    });
  });

  test("deletes category successfully", async () => {
    req.params = { id: "1" };
    categoryModel.findByIdAndDelete.mockResolvedValue({ _id: "1", name: "Category 1" });

    await deleteCategoryController(req, res);

    expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Category deleted successfully",
    });
  });

  test("handles server error", async () => {
    req.params = { id: "1" };
    categoryModel.findByIdAndDelete.mockRejectedValue(new Error("DB error"));

    await deleteCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: new Error("DB error"),
      message: "Error while deleting category",
    });
  });
});
