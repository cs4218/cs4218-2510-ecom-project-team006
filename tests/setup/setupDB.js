import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import fs from "fs";
import path from "path";
import categoryModel from "../../models/categoryModel.js"
import orderModel from "../../models/orderModel.js"
import productModel from "../../models/productModel.js"
import userModel from "../../models/userModel.js"
import { connect } from "http2";

let mongoServer;

const connectTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await seedTestDB();
};

const seedTestDB = async () => {
  const loadJSON = (filename) =>
    JSON.parse(fs.readFileSync(path.resolve("./tests/setup/", filename), "utf-8"));

  const categories = loadJSON("test.categories.json");
  const orders = loadJSON("test.orders.json");
  const products = loadJSON("test.products.json");
  const processed = products.map((item) => {
    if (item.photo?.data?.$binary?.base64) {
      item.photo.data = Buffer.from(item.photo.data.$binary.base64, "base64");
    }
    return item;
  });
  const users = loadJSON("test.users.json");

  await categoryModel.insertMany(categories);
  await orderModel.insertMany(orders);
  await productModel.insertMany(processed);
  await userModel.insertMany(users);
};

export default connectTestDB;