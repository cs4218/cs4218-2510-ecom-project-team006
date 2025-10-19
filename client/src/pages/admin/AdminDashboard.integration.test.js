import React from "react";
import { within, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom"; 
import { AuthProvider } from "../../context/auth";
import { CartProvider } from "../../context/cart";
import { SearchProvider } from "../../context/search";
import axios from "axios";
import "@testing-library/jest-dom";

import AdminDashboard from "./AdminDashboard";
import CreateCategory from "./CreateCategory";
import CreateProduct from "./CreateProduct";
import UpdateProduct from "./UpdateProduct.js";
import Products from "./Products";
import Users from "./Users";
import AdminOrders from "./AdminOrders";

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import authRoutes from "../../../../routes/authRoute.js";
import categoryRoutes from "../../../../routes/categoryRoutes.js";
import productRoutes from "../../../../routes/productRoutes.js";
import categoryModel from "../../../../models/categoryModel.js";
import orderModel from "../../../../models/orderModel.js";
import productModel from "../../../../models/productModel.js";
import userModel from "../../../../models/userModel.js";
import slugify from "slugify";


// AI Attribution: The following test code was generated with the assistance of AI (ChatGPT).

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const AdminDashboardSubmodule = ({initialEntry = "/dashboard/admin"}) => (
  <AuthProvider>
    <SearchProvider>
      <CartProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/admin/create-category" element={<CreateCategory />} />
            <Route path="/dashboard/admin/create-product" element={<CreateProduct />} />
            <Route path="/dashboard/admin/product/:slug" element={<UpdateProduct />} />
            <Route path="/dashboard/admin/products" element={<Products />} />
            <Route path="/dashboard/admin/orders" element={<AdminOrders />} />
            <Route path="/dashboard/admin/users" element={<Users />} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    </SearchProvider>
  </AuthProvider>
);

describe("Admin Dashboard FE Integration", () => {
  // mock axios as we are only testing FE integration
  beforeEach(() => jest.mock('axios'));

  test("Rendering of auxiliary components (Header, Search, Footer)", () => {
    render(
      <AdminDashboardSubmodule />
    )
  
    expect(screen.getByText(/Virtual Vault/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
  })

  test("Navigation between all admin dashboard components using AdminMenu", async () => {
    
    render(
      <AdminDashboardSubmodule />
    );

    // Admin dashboard
    expect(screen.getByText(/Admin Name/i)).toBeInTheDocument();

    // Admin menu links
    expect(screen.getByText(/Create Category/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Product/i)).toBeInTheDocument();
    expect(screen.getByText(/Products/i)).toBeInTheDocument();
    expect(screen.getByText(/Orders/i)).toBeInTheDocument();
    expect(screen.getByText(/Users/i)).toBeInTheDocument();

    // Click "Create Category" in the sidebar
    fireEvent.click(screen.getByText(/Create Category/i));

    // Click "Create Product"
    fireEvent.click(screen.getByText(/Create Product/i));

    // Click "Products"
    fireEvent.click(screen.getByText(/Products/i));
    await waitFor(() => expect(screen.getByText(/All Products List/i)).toBeInTheDocument());

    // Click "Orders"
    fireEvent.click(screen.getByText(/Orders/i));
    await waitFor(() => expect(screen.getByText(/All Orders/i)).toBeInTheDocument());

    // Click "Users"
    fireEvent.click(screen.getByText(/Users/i));
    await waitFor(() => expect(screen.getByText(/All Users/i)).toBeInTheDocument());
  });

  test("Integration between admin dashboard and useAuth", async () => {
     const mockAuthData = {
      user: { name: "Mr Guy", email: "guy@gmail.com", phone: "98765432" },
      token: "fake-token",
    };
    localStorage.setItem("auth", JSON.stringify(mockAuthData));

    render(
      <AdminDashboardSubmodule />
    );

    await waitFor(() => {
      expect(screen.getByText(/Admin Name : Mr Guy/i)).toBeInTheDocument();
      expect(screen.getByText(/Admin Email : guy@gmail.com/i)).toBeInTheDocument();
      expect(screen.getByText(/Admin Contact : 98765432/i)).toBeInTheDocument();
    });
  })
});

process.env.JWT_SECRET = "test-secret"
jest.mock("braintree") // not testing braintree integration

describe("Admin Dashboard FE + BE Integration", () => {
  let mongod;
  let server;
  let adminToken;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    await mongoose.connect(uri);
    await categoryModel.insertMany([
      { name: "Books" },
      { name: "Electronics" },
      { name: "Clothing" },
    ]);
  
    await userModel.insertMany([{
      name: "John Doe",
      address: "123 Main St",
      answer: "Blue",
      phone: "91234567",
      email: "john.doe@example.com",
      password: "password123",
      role: 0,
    },
    {
      name: "Jane Smith",
      address: "456 Elm St",
      answer: "Green",
      phone: "92345678",
      email: "jane.smith@example.com",
      password: "mypassword",
      role: 0,
    }])

    const category = await categoryModel.findOne({ name: "Electronics" });

    await productModel.insertMany([
      {
        name: "Gaming Laptop",
        description: "A high-end gaming laptop",
        price: 1999,
        quantity: 5,
        category: category._id,
        shipping: true,
        slug: slugify("Gaming Laptop"),
      },
      {
        name: "Wireless Mouse",
        description: "Ergonomic wireless mouse",
        price: 49,
        quantity: 50,
        category: category._id,
        shipping: true,
        slug: slugify("Wireless Mouse"),
      },
    ]);

    const buyer1 = await userModel.findOne({ email: "john.doe@example.com" });
    const buyer2 = await userModel.findOne({ email: "jane.smith@example.com" });
    const products = await productModel.find({});

    await orderModel.insertMany([
      {
        products,
        payment: { success: true },
        buyer: buyer1._id,
        status: "Not Processed",
      },
      {
        products,
        payment: { success: false },
        buyer: buyer2._id,
        status: "Processing",
      },
    ]);

    const app = express();
    app.use(cors())
    app.use(express.json())
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/category", categoryRoutes);
    app.use("/api/v1/product", productRoutes);

    const adminUser = await userModel.create({
      name: "Admin",
      address: "Example Address",
      answer: "Answer",
      phone: "98765432",
      email: "admin@example.com",
      password: "password",
      role: 1,
    });
    
    adminToken = jwt.sign({ _id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    localStorage.setItem("auth", JSON.stringify({ user: adminUser, token: adminToken }));
  
    server = app.listen(5050);
    axios.defaults.baseURL = `http://localhost:5050`;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await mongod.stop();
    await server.close();
  });

  test("CreateCategory.js Integration", async() => {
    render(<AdminDashboardSubmodule initialEntry="/dashboard/admin/create-category" />);

    await waitFor(() => {
      const table = screen.getByRole("table");
      expect(within(table).getByText("Books")).toBeInTheDocument();
      expect(within(table).getByText("Electronics")).toBeInTheDocument();
      expect(within(table).getByText("Clothing")).toBeInTheDocument();
    });

    const input = screen.getByRole("textbox");
    const submitBtn = screen.getByRole("button", { name: /submit/i });

    fireEvent.change(input, { target: { value: "New Category" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("New Category")).toBeInTheDocument();
    });

    const editBtns = screen.getAllByText("Edit");
    const lastEditBtn = editBtns[editBtns.length - 1];
    fireEvent.click(lastEditBtn);
    
    const modal = screen.getByRole("dialog"); 
    fireEvent.change(within(modal).getByPlaceholderText("Enter new category"), {
      target: { value: "Updated Category" },
    });
    fireEvent.click(within(modal).getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText("Updated Category")).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByText("Delete");
    const lastDeleteBtn = deleteBtns[deleteBtns.length - 1];
    fireEvent.click(lastDeleteBtn);

    await waitFor(() => {
      expect(screen.queryByText("Updated Category")).not.toBeInTheDocument();
    });
  });

  test("CreateProduct.js + Product.js + UpdateProduct.js Integration", async() => {
    global.URL.createObjectURL = jest.fn(() => "mocked-url");

    render(<AdminDashboardSubmodule initialEntry="/dashboard/admin/create-product" />);

    const select = screen.getByText("Select a category");
    fireEvent.mouseDown(select);
    await waitFor(() => {
      expect(screen.getAllByText("Books")).toHaveLength(2);
      expect(screen.getAllByText("Electronics")).toHaveLength(2);
      expect(screen.getAllByText("Clothing")).toHaveLength(2);

      const electronics = screen.getAllByText("Electronics");
      fireEvent.click(electronics[1]); 
    });
    
    fireEvent.change(screen.getByPlaceholderText(/Write a name/i), {
      target: { value: "New Laptop" },
    });

    fireEvent.change(screen.getByPlaceholderText(/Write a description/i), {
      target: { value: "A new laptop" },
    });

    fireEvent.change(screen.getByPlaceholderText(/Write a price/i), {
      target: { value: "999" },
    });

    fireEvent.change(screen.getByPlaceholderText(/Write a quantity/i), {
      target: { value: "100" },
    });

    fireEvent.mouseDown(screen.getByText("No"));
    await waitFor(() => fireEvent.click(screen.getByText("Yes")));

    const file = new File(["dummy content"], "laptop.png", { type: "image/png" });
    const input = screen.getByLabelText(/Upload Photo/i);
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(screen.getByText("All Products List")).toBeInTheDocument();
      
      expect(screen.getByText("Gaming Laptop")).toBeInTheDocument();
      expect(screen.getByText("A high-end gaming laptop")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: new RegExp("Gaming Laptop") })).toBeInTheDocument();
      expect(screen.getByAltText("Gaming Laptop")).toBeInTheDocument();

      expect(screen.getByText("Wireless Mouse")).toBeInTheDocument();
      expect(screen.getByText("Ergonomic wireless mouse")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: new RegExp("Wireless Mouse") })).toBeInTheDocument();
      expect(screen.getByAltText("Wireless Mouse")).toBeInTheDocument();

      expect(screen.getByText("New Laptop")).toBeInTheDocument();
      expect(screen.getByText("A new laptop")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: new RegExp("New Laptop") })).toBeInTheDocument();
      expect(screen.getByAltText("New Laptop")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("New Laptop"));

    await waitFor(() => {
      expect(screen.getByText("UPDATE PRODUCT")).toBeInTheDocument();

      expect(screen.getAllByText("Electronics")).toHaveLength(2);
      expect(screen.getByAltText("original_product_photo")).toBeInTheDocument();
      expect(screen.getByDisplayValue("New Laptop")).toBeInTheDocument();
      expect(screen.getByDisplayValue("A new laptop")).toBeInTheDocument();
      expect(screen.getByDisplayValue("999")).toBeInTheDocument();
      expect(screen.getByDisplayValue("100")).toBeInTheDocument();
      expect(screen.getByText("Yes")).toBeInTheDocument();
    })

    fireEvent.change(screen.getByPlaceholderText("Write a name"), {
      target: { value: "Updated Laptop" },
    });
    fireEvent.change(screen.getByPlaceholderText("Write a description"), {
      target: { value: "An updated laptop" },
    });
    fireEvent.change(screen.getByPlaceholderText("Write a price"), {
      target: { value: "12345" },
    });
    fireEvent.change(screen.getByPlaceholderText("Write a quantity"), {
      target: { value: "54321" },
    });

    const electronics = screen.getAllByText("Electronics");
    fireEvent.mouseDown(electronics[1]);
    await waitFor(() => {
      const books = screen.getAllByText("Books");
      fireEvent.click(books[1]);
    });

    const shippingSelect = screen.getByText("Yes");
    fireEvent.mouseDown(shippingSelect);
    await waitFor(() => {
      fireEvent.click(screen.getByText("No"));
    });

    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(screen.getByText("All Products List")).toBeInTheDocument();
      
      expect(screen.getByText("Gaming Laptop")).toBeInTheDocument();
      expect(screen.getByText("A high-end gaming laptop")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: new RegExp("Gaming Laptop") })).toBeInTheDocument();
      expect(screen.getByAltText("Gaming Laptop")).toBeInTheDocument();

      expect(screen.getByText("Wireless Mouse")).toBeInTheDocument();
      expect(screen.getByText("Ergonomic wireless mouse")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: new RegExp("Wireless Mouse") })).toBeInTheDocument();
      expect(screen.getByAltText("Wireless Mouse")).toBeInTheDocument();

      expect(screen.getByText("Updated Laptop")).toBeInTheDocument();
      expect(screen.getByText("An updated laptop")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: new RegExp("Updated Laptop") })).toBeInTheDocument();
      expect(screen.getByAltText("Updated Laptop")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Updated Laptop"));

    await waitFor(() => {
      expect(screen.getByText("UPDATE PRODUCT")).toBeInTheDocument();

      expect(screen.getAllByText("Books")).toHaveLength(2);
      expect(screen.getByAltText("original_product_photo")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Updated Laptop")).toBeInTheDocument();
      expect(screen.getByDisplayValue("An updated laptop")).toBeInTheDocument();
      expect(screen.getByDisplayValue("12345")).toBeInTheDocument();
      expect(screen.getByDisplayValue("54321")).toBeInTheDocument();
      expect(screen.getByText("No")).toBeInTheDocument();
    })
    
    jest.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByText("DELETE PRODUCT"));

    await waitFor(() => {
      expect(screen.getByText("All Products List")).toBeInTheDocument();
      
      expect(screen.getByText("Gaming Laptop")).toBeInTheDocument();
      expect(screen.getByText("A high-end gaming laptop")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: new RegExp("Gaming Laptop") })).toBeInTheDocument();
      expect(screen.getByAltText("Gaming Laptop")).toBeInTheDocument();

      expect(screen.getByText("Wireless Mouse")).toBeInTheDocument();
      expect(screen.getByText("Ergonomic wireless mouse")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: new RegExp("Wireless Mouse") })).toBeInTheDocument();
      expect(screen.getByAltText("Wireless Mouse")).toBeInTheDocument();

      expect(screen.queryByText("Updated Laptop")).not.toBeInTheDocument();
      expect(screen.queryByText("An updated laptop")).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: new RegExp("Updated Laptop") })).not.toBeInTheDocument();
      expect(screen.queryByAltText("Updated Laptop")).not.toBeInTheDocument();
    });
  });

  test("AdminOrders.js Integration", async() => {
    render(<AdminDashboardSubmodule initialEntry="/dashboard/admin/orders" />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(screen.getByText("Not Processed")).toBeInTheDocument();

      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Failed")).toBeInTheDocument();
      expect(screen.getByText("Processing")).toBeInTheDocument();

      expect(screen.getAllByText("Gaming Laptop")).toHaveLength(2);
      expect(screen.getAllByText("Wireless Mouse")).toHaveLength(2);
    });

    const select = screen.getByText("Not Processed"); 
    fireEvent.mouseDown(select); 
    fireEvent.click(screen.getByText("Delivered"));

    await waitFor(() => {
      expect(screen.getAllByText("Delivered").length).toBeGreaterThan(0);
    });
  });

  test("Users.js", async () => {
    render(<AdminDashboardSubmodule initialEntry="/dashboard/admin/users"/>)

    await waitFor(() => {
      const table = screen.getByRole("table");

      expect(within(table).getByText("Admin")).toBeInTheDocument();
      expect(within(table).getByText("Example Address")).toBeInTheDocument();
      expect(within(table).getByText("98765432")).toBeInTheDocument();
      expect(within(table).getByText("admin@example.com")).toBeInTheDocument();   
      
      expect(within(table).getByText("John Doe")).toBeInTheDocument();
      expect(within(table).getByText("123 Main St")).toBeInTheDocument();
      expect(within(table).getByText("91234567")).toBeInTheDocument();
      expect(within(table).getByText("john.doe@example.com")).toBeInTheDocument();

      expect(within(table).getByText("Jane Smith")).toBeInTheDocument();
      expect(within(table).getByText("456 Elm St")).toBeInTheDocument();
      expect(within(table).getByText("92345678")).toBeInTheDocument();
      expect(within(table).getByText("jane.smith@example.com")).toBeInTheDocument();       
    });
  });
});
