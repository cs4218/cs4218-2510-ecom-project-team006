import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";

import fs from "fs";
import slugify from "slugify";
import braintree from "braintree";
import dotenv from "dotenv";
import { ca } from "date-fns/locale";

dotenv.config();

//payment gateway
var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

export const createProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;

    switch (true) {
      case !name:
        return res.status(400).send({ error: "Name is required" });
      case !description:
        return res.status(400).send({ error: "Description is required" });
      case !price:
        return res.status(400).send({ error: "Price is required" });
      case !category:
        return res.status(400).send({ error: "Category is required" });
      case !quantity:
        return res.status(400).send({ error: "Quantity is required" });
      case !shipping:
        return res.status(400).send({ error: "Shipping is required" });
      case photo && photo.size > 1000000:
        return res
          .status(400)
          .send({ error: "Photo should be less than 1MB" });
    }

    const existingProduct = await productModel.findOne({ slug: slugify(name) });
    if (existingProduct) {
      return res.status(409).send({
        success: false,
        message: "Product with this name already exists",
      });
    }

    const existingCategory = await categoryModel.findById(category);
    if (!existingCategory) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }

    const product = new productModel({
      ...req.fields,
      slug: slugify(req.fields.name)
    });

    if (photo) {
      product.photo.data = fs.readFileSync(photo.path);
      product.photo.contentType = photo.type;
    }

    const savedProduct = await product.save();

    res.status(201).send({
      success: true,
      message: "Product created successfully",
      product: savedProduct,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in creating product",
    });
  }
};

//get all products
export const getProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate("category")
      .select("-photo")
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      countTotal: products.length,
      message: "AllProducts",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Erorr in getting products",
      error: error.message,
    });
  }
};
// get single product
export const getSingleProductController = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).send({
        success: false,
        error: "Slug is required",
      })
    }

    const product = await productModel
      .findOne({ slug })
      .select("-photo")
      .populate("category");
    if (product === null) {
      return res.status(404).send({
        success: false,
        error: "Single Product Not Found",
      })
    }

    res.status(200).send({
      success: true,
      message: "Single Product Fetched",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting single product",
      error: error.message,
    });
  }
};

// get photo
export const productPhotoController = async (req, res) => {
  try {
    const { pid } = req.params;
    if (!pid) {
      return res.status(400).send({
        success: false,
        error: "Product Id: pid is required",
      });
    }

    const product = await productModel
      .findById(req.params.pid)
      .select("photo");
    
    if (product === null) {
      return res.status(404).send({
        success: false,
        error: "Product not found",
      });
    } else if (!product.photo?.data) {
      return res.status(404).send({
        success: false,
        error: "Product photo not found",
      });
    } else {
      res.set("Content-type", product.photo.contentType);
      return res.status(200).send(product.photo.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Erorr while getting photo",
      error: error.message,
    });
  }
};

//delete controller
export const deleteProductController = async (req, res) => {
  try {
    const { pid } = req.params;

    if (!pid) {
      return res.status(400).send({
        success: false,
        message: "Product ID is required",
      });
    }

    const product = await productModel.findByIdAndDelete(pid);

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting product",
      error,
    });
  }
};

//update product
export const updateProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;
    const { pid } = req.params

    if (!pid) {
      return res.status(400).send({
        success: false,
        message: "Product ID is required",
      });
    }

    switch (true) {
      case !name:
        return res.status(400).send({ error: "Name is required" });
      case !description:
        return res.status(400).send({ error: "Description is required" });
      case !price:
        return res.status(400).send({ error: "Price is required" });
      case !category:
        return res.status(400).send({ error: "Category is required" });
      case !quantity:
        return res.status(400).send({ error: "Quantity is required" });
      case !shipping:
        return res.status(400).send({ error: "Shipping is required" });
      case photo && photo.size > 1000000:
        return res
          .status(400)
          .send({ error: "Photo should be less than 1MB" });
    }

    const product = await productModel.findById(pid);
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    const existingProduct = await productModel.findOne({ slug: slugify(name) });
    if (existingProduct && existingProduct._id.toString() !== product._id.toString()) {
      return res.status(409).send({
        success: false,
        message: "Product with this name already exists",
      });
    }

    const existingCategory = await categoryModel.findById(category);
    if (!existingCategory) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }

    Object.assign(product, { ...req.fields, slug: slugify(name) });

    if (photo) {
      product.photo.data = fs.readFileSync(photo.path);
      product.photo.contentType = photo.type;
    }

    const savedProduct = await product.save();

    res.status(200).send({
      success: true,
      message: "Product updated successfully",
      product: savedProduct,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in updating product",
    });
  }
};


/**
 * Get products with filter.
 * checked: list of categories
 * radio: list of length 2, representing price range
 * @param {*} req 
 * @param {*} res 
 */
export const productFiltersController = async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {};
    if (checked && checked.length > 0) args.category = checked;

    if (radio && radio.length > 0) {
      if (radio.length === 2) {
        args.price = { $gte: radio[0], $lte: radio[1] };
      } else {
        return res.status(400).send({
          success: false,
          error: "Invalid radio(price) filter",
        });
      }
    }

    const products = await productModel.find(args);
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while Filtering Products",
      error,
    });
  }
};

// product count
export const productCountController = async (req, res) => {
  try {
    const total = await productModel.find({}).estimatedDocumentCount();
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error while getting product count",
      error: error.message,
      success: false,
    });
  }
};

// product list base on page
export const productListController = async (req, res) => {
  try {
    const perPage = 6;
    let { page } = req.params;
    if (page === undefined || page === null) {
      page = 1;
    } else if (page <= 0) {
      return res.status(400).send({
        success: false,
        error: "Invalid page param",
      });
    }
    
    const products = await productModel
      .find({})
      .select("-photo")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting products per page",
      error: error.message,
    });
  }
};

/**
 * Searches for product by checking if the name or description matches the search term.
 * @param {*} req 
 * @param {*} res 
 */
export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;
    if (!keyword) {
      return res.status(400).send({
        success: false,
        error: "Keyword param is required",
      });
    }
    const results = await productModel
      .find({
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
        ],
      })
      .select("-photo");
    res.status(200).send({
      success: true,
      products: results
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error In Search Product API",
      error: error.message,
    });
  }
};

/**
 * Gets up to 3 other products in the same category.
 * TODO fix name to *relatedProductController*
 * @param {*} req 
 * @param {*} res 
 */
export const realtedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;
    if (!pid || !cid) {
      return res.status(400).send({
        success: false,
        error: "pid & cid are required",
      })
    }

    const products = await productModel
      .find({
        category: cid,
        _id: { $ne: pid },
      })
      .select("-photo")
      .limit(3)
      .populate("category");
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while geting related product",
      error: error.message,
    });
  }
};

// get product by catgory
export const productCategoryController = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).send({
        success: false,
        error: "Category slug param is required",
      })
    }
    const category = await categoryModel.findOne({ slug });
    const products = await productModel
      .find({ category })
      .populate("category");
    res.status(200).send({
      success: true,
      category,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error While Getting products by category",
    });
  }
};

//payment gateway api
//token
export const braintreeTokenController = async (req, res) => {
  try {
    gateway.clientToken.generate({}, function (err, response) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send(response);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

//payment
export const brainTreePaymentController = async (req, res) => {
  try {
    const { nonce, cart } = req.body;
    let total = 0;
    cart.map((i) => {
      total += i.price;
    });
    let newTransaction = gateway.transaction.sale(
      {
        amount: total,
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true,
        },
      },
      function (error, result) {
        if (result) {
          const order = new orderModel({
            products: cart,
            payment: result,
            buyer: req.user._id,
          }).save();
          res.json({ ok: true });
        } else {
          res.status(500).send(error);
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};