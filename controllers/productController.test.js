// TEMP mock braintree gateway until it is moved to a different file
jest.mock("braintree", () => {
  return {
    BraintreeGateway: jest.fn().mockImplementation(() => {}),
    Environment: {
      Sandbox: "sandbox-stub",
    },
  };
});

import categoryModel from "../models/categoryModel";
import productModel from "../models/productModel";
import { 
  getProductController, 
  getSingleProductController, 
  productCategoryController, 
  productCountController, 
  productFiltersController, 
  productListController, 
  productPhotoController, 
  relatedProductController, 
  searchProductController 
} from "./productController";

jest.mock("../models/productModel");
jest.mock("../models/categoryModel");

describe("getProductController method", () => {
  let req, res;

  beforeEach(() => {
    // reset req and res
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // stub console.log
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns products with 200 if successful", async () => {
    const mockProducts = [
      { name: "Product 1" },
      { name: "Product 2" },
    ];

    productModel.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockProducts),
    })

    await getProductController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({});
    expect(productModel.find().populate).toHaveBeenCalledWith("category");
    expect(productModel.find().select).toHaveBeenCalledWith("-photo");
    expect(productModel.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      countTotal: mockProducts.length,
      message: "AllProducts",
      products: mockProducts,
    });
  });

  it("returns 500 if error encountered getting products", async () => {
    const error = new Error("mock error");
    productModel.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValue(error),
    })
    await getProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Erorr in getting products",
      error: error.message,
    });

  })
});

describe("getSingleProductController method", () => {
  let req, res;

  beforeEach(() => {
    // reset req and res
    req = {
      params: {
        slug: "red-t-shirt",
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // stub console.log
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns product with 200 if successful", async () => {
    const mockProduct = { name: "Red T-Shirt" };
    productModel.findOne.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockProduct),
    });

    await getSingleProductController(req, res);

    expect(productModel.findOne).toHaveBeenCalledWith({ slug: "red-t-shirt" });
    expect(productModel.findOne().select).toHaveBeenCalledWith("-photo");
    expect(productModel.findOne().populate).toHaveBeenCalledWith("category");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Single Product Fetched",
      product: mockProduct,
    });
  });
  
  it("returns 400 if slug is missing from request", async () => {
    delete req.params.slug;
    const mockProduct = { name: "Red T-Shirt" };
    productModel.findOne.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockProduct),
    });

    await getSingleProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: "Slug is required",
    });
  });

  it("returns 404 if product not found", async () => {
    productModel.findOne.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(null),
    });

    await getSingleProductController(req, res);

    expect(productModel.findOne).toHaveBeenCalledWith({ slug: "red-t-shirt" });
    expect(productModel.findOne().select).toHaveBeenCalledWith("-photo");
    expect(productModel.findOne().populate).toHaveBeenCalledWith("category");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: "Single Product Not Found",
    });
  });

  it("returns 500 if error encountered getting products", async () => {
    const error = new Error("mock error")
    productModel.findOne.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockRejectedValue(error),
    });
    
    await getSingleProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting single product",
      error: error.message,
    })
  });
});


describe("productPhotoController method", () => {
  let req, res;

  beforeEach(() => {
    // reset req and res
    req = {
      params: {
        pid: "product-id-123",
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      set: jest.fn(),
    };
    
    // stub console.log
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the photo with 200 if successful", async () => {
    const mockProduct = {
      photo: {
        data: "photo-data-0011",
        contentType: "image-type"
      }
    };
    productModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockProduct),
    });

    await productPhotoController(req, res);

    expect(productModel.findById).toHaveBeenCalledWith("product-id-123");
    expect(productModel.findById().select).toHaveBeenCalledWith("photo");
    expect(res.set).toHaveBeenCalledWith("Content-type", mockProduct.photo.contentType);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(mockProduct.photo.data);
  });

  it("returns 400 if pid missing", async () => {
    delete req.params.pid;
    const mockProduct = {
      photo: {
        data: "photo-data-0011",
        contentType: "image-type"
      }
    };
    productModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockProduct),
    });

    await productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: "Product Id: pid is required",
    });
  });

  it("returns 404 if product not found", async () => {
    productModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: "Product photo not found",
    });
  });

  it("returns 404 if product photo not found", async () => {
    const mockProduct = {
      photo: {
        data: null,
        contentType: "image-type"
      }
    };
    productModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockProduct),
    });

    await productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: "Product photo not found",
    }); 
  });

  it("returns 500 if error encountered getting photo", async () => {
    const error = new Error("mock error")
    productModel.findById.mockReturnValue({
      select: jest.fn().mockRejectedValue(error),
    });

    await productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Erorr while getting photo",
      error: error.message,
    }); 
  });
});

describe("productFiltersController method", () => {
  let req, res;

  beforeEach(() => {
    // reset req and res
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    
    // stub console.log
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns products with 200 if no checked & no radio", async () => {
    const mockProducts = [
      { name: "Red T-shirt" },
      { name: "Green T-shirt" },
    ];
    productModel.find.mockResolvedValue(mockProducts);

    await productFiltersController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("returns products with 200 if checked & no radio", async () => {
    req.body = {
      checked: ["shirts", "shorts"],
    };
    const mockProducts = [
      { name: "Red T-shirt" },
      { name: "Green T-shirt" },
    ];
    productModel.find.mockResolvedValue(mockProducts);
    
    await productFiltersController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
      category: req.body.checked,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("returns products with 200 if radio & no checked", async () => {
    req.body = {
      radio: [0, 20],
    };
    const mockProducts = [
      { name: "Red T-shirt" },
      { name: "Green T-shirt" },
    ];
    productModel.find.mockResolvedValue(mockProducts);
    
    await productFiltersController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
      price: { $gte: 0, $lte: 20 },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("returns products with 200 if checked & radio", async () => {
    req.body = {
      checked: ["shirts", "shorts"],
      radio: [0, 20],
    };
    const mockProducts = [
      { name: "Red T-shirt" },
      { name: "Green T-shirt" },
    ];
    productModel.find.mockResolvedValue(mockProducts);
    
    await productFiltersController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
      category: req.body.checked,
      price: { $gte: 0, $lte: 20 },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("returns 400 if radio filter invalid array not empty and not length 2", async () => {
    req.body = {
      radio: [0, 10, 20],
    };
    const mockProducts = [
      { name: "Red T-shirt" },
      { name: "Green T-shirt" },
    ];
    productModel.find.mockResolvedValue(mockProducts);

    await productFiltersController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: "Invalid radio(price) filter",
    });

  });

  it("returns 500 if error encountered filtering products", async () => {
    const error = new Error("mock error");
    productModel.find.mockRejectedValue(error);

    await productFiltersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while Filtering Products",
      error,
    });
  });
});

describe("productCountController method", () => {
  let req, res;

  beforeEach(() => {
    // reset req and res
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    
    // stub console.log
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it("returns total count of products with 200 if successful", async () => {
    productModel.find.mockReturnValue({
      estimatedDocumentCount: jest.fn().mockResolvedValue(5),
    });

    await productCountController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      total: 5,
    });
  });

  it("returns 500 if error encountered getting product count", async () => {
    const error = new Error("mock error")
    productModel.find.mockReturnValue({
      estimatedDocumentCount: jest.fn().mockRejectedValue(error),
    });

    await productCountController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting product count",
      error: error.message,
    });
  });
});

describe("productListController method", () => {
  let req, res;

  beforeEach(() => {
    // reset req and res
    req = {
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    
    // stub console.log
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the products in a page with 200 if page undefined", async () => {
    const mockProducts = [
      { name: "Red T-shirt" },
      { name: "Green T-shirt" },
    ];
    productModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockProducts),
    });

    await productListController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({});
    expect(productModel.find().select).toHaveBeenCalledWith("-photo");
    expect(productModel.find().skip).toHaveBeenCalledWith(0);
    expect(productModel.find().limit).toHaveBeenCalledWith(6);
    expect(productModel.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("returns the products in a page with 200 if page=2", async () => {
    req.params.page = 2;
    const mockProducts = [
      { name: "Red T-shirt" },
      { name: "Green T-shirt" },
    ];
    productModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockProducts),
    });

    await productListController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({});
    expect(productModel.find().select).toHaveBeenCalledWith("-photo");
    expect(productModel.find().skip).toHaveBeenCalledWith(6);
    expect(productModel.find().limit).toHaveBeenCalledWith(6);
    expect(productModel.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("returns the products in a page with 200 if page=1", async () => {
    req.params.page = 1;
    const mockProducts = [
      { name: "Red T-shirt" },
      { name: "Green T-shirt" },
    ];
    productModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockProducts),
    });

    await productListController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({});
    expect(productModel.find().select).toHaveBeenCalledWith("-photo");
    expect(productModel.find().skip).toHaveBeenCalledWith(0);
    expect(productModel.find().limit).toHaveBeenCalledWith(6);
    expect(productModel.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("returns 400 if invalid page=0", async () => {
    req.params.page = 0;
    const mockProducts = [
      { name: "Red T-shirt" },
      { name: "Green T-shirt" },
    ];
    productModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockProducts),
    });

    await productListController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: "Invalid page param",
    });
  });

  it("returns 400 if invalid page=-1", async () => {
    req.params.page = -1;
    const mockProducts = [
      { name: "Red T-shirt" },
      { name: "Green T-shirt" },
    ];
    productModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockProducts),
    });

    await productListController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: "Invalid page param",
    });
  });

  it("returns 500 if error encountered getting products in page", async () => {
    const error = new Error("mock error");
    productModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValue(error),
    });
    
    await productListController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting products per page",
      error: error.message,
    });
  });
});

describe("searchProductController method", () => {
  let req, res;

  beforeEach(() => {
    // reset req and res
    req = {
      params: {
        keyword: "shirt",
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    
    // stub console.log
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns products with 200 if successful", async () => {
    const mockProducts = [
      { name: "Red T-shirt" },
      { name: "Green T-shirt" },
    ];
    productModel.find.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockProducts),
    });
    const filter = {
      $or: [
        { name: { $regex: "shirt", $options: "i" } },
        { description: { $regex: "shirt", $options: "i" } },
      ],
    };

    await searchProductController(req, res);

    expect(productModel.find).toHaveBeenCalledWith(filter);
    expect(productModel.find().select).toHaveBeenCalledWith("-photo");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("returns 400 if keyword is missing", async () => {
    delete req.params.keyword;
    const mockProducts = [
      { name: "Red T-shirt" },
      { name: "Green T-shirt" },
    ];
    productModel.find.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockProducts),
    });

    await searchProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: "Keyword param is required",
    });
  });

  it("returns 500 if error encountered searching", async () => {
    const error = new Error("mock error")
    productModel.find.mockReturnValue({
      select: jest.fn().mockRejectedValue(error),
    });

    await searchProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error In Search Product API",
      error: error.message,
    });
  });
});

describe("relatedProductController method", () => {
  let req, res;

  beforeEach(() => {
    // reset req and res
    req = {
      params: {
        pid: "product-id-123",
        cid: "clothes",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    
    // stub console.log
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the products with 200 if successful", async () => {
    const mockProducts = [
      { name: "Red T-shirt" },
      { name: "Green T-shirt" },
    ];
    productModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockProducts),
    });

    await relatedProductController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
      category: "clothes",
      _id: { $ne: "product-id-123" },
    });
    expect(productModel.find().select).toHaveBeenCalledWith("-photo");
    expect(productModel.find().limit).toHaveBeenCalledWith(3);
    expect(productModel.find().populate).toHaveBeenCalledWith("category");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    })
  });

  it("returns 400 if product id is missing", async () => {
    delete req.params.pid;
    const mockProducts = [
      { name: "Red T-shirt" },
      { name: "Green T-shirt" },
    ];
    productModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockProducts),
    });

    await relatedProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: "pid & cid are required",
    });
  });

  it("returns 400 if category is missing", async () => {
    delete req.params.cid;
    const mockProducts = [
      { name: "Red T-shirt" },
      { name: "Green T-shirt" },
    ];
    productModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockProducts),
    });

    await relatedProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: "pid & cid are required",
    });
  });

  it("returns 400 if category & product id is missing", async () => {
    delete req.params.pid;
    delete req.params.cid;
    const mockProducts = [
      { name: "Red T-shirt" },
      { name: "Green T-shirt" },
    ];
    productModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockProducts),
    });

    await relatedProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: "pid & cid are required",
    });
  });

  it("returns 500 if error encountered getting related products", async () => {
    const error = new Error("mock error");
    productModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockRejectedValue(error),
    });

    await relatedProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while geting related product",
      error: error.message,
    });
  });
});

describe("productCategoryController method", () => {
  let req, res;

  beforeEach(() => {
    // reset req and res
    req = {
      params: {
        slug: "clothes",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    
    // stub console.log
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it("returns the products with 200 if slug provided and category exists", async () => {
    const mockCategory = "category";
    const mockProducts = [
      { name: "Red T-shirt" },
      { name: "Green T-shirt" },
    ];
    categoryModel.findOne.mockResolvedValue(mockCategory);
    productModel.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockProducts),
    });

    await productCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({
      slug: "clothes",
    });
    expect(productModel.find).toHaveBeenCalledWith({
      category: mockCategory,
    });
    expect(productModel.find().populate).toHaveBeenCalledWith("category");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      category: mockCategory,
      products: mockProducts,
    });
  });

  it("returns 400 if slug not provided", async () => {
    delete req.params.slug
    const mockCategory = "category";
    const mockProducts = [
      { name: "Red T-shirt" },
      { name: "Green T-shirt" },
    ];
    categoryModel.findOne.mockResolvedValue(mockCategory);
    productModel.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockProducts),
    });

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: "Category slug param is required",
    });
  });

  it("returns 404 if slug provided and category does not exist", async () => {
    const mockProducts = [
      { name: "Red T-shirt" },
      { name: "Green T-shirt" },
    ];
    categoryModel.findOne.mockResolvedValue(null);
    productModel.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockProducts),
    });

    await productCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({
      slug: "clothes",
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: "Category not found",
    });
  });

  it("returns 500 if error encountered getting category", async () => {
    const error = new Error("mock error");
    categoryModel.findOne.mockRejectedValue(error);
    productModel.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(),
    });

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: error.message,
      message: "Error While Getting products by category",
    });
  });

  it("returns 500 if error encountered getting products", async () => {
    const error = new Error("mock error");
    const mockCategory = "category";
    categoryModel.findOne.mockResolvedValue(mockCategory);
    productModel.find.mockReturnValue({
      populate: jest.fn().mockRejectedValue(error),
    });

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: error.message,
      message: "Error While Getting products by category",
    });
  });
})
