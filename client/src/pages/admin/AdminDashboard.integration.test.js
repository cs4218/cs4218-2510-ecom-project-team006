import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom"; 
import { AuthProvider } from "../../context/auth";
import { CartProvider } from "../../context/cart";
import { SearchProvider } from "../../context/search";
import "@testing-library/jest-dom";

import AdminDashboard from "./AdminDashboard";
import CreateCategory from "./CreateCategory";
import CreateProduct from "./CreateProduct";
import Products from "./Products";
import Users from "./Users";
import AdminOrders from "./AdminOrders";

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

const AdminDashboardSubmodule = () => {
  return <AuthProvider>
          <SearchProvider>
            <CartProvider>
              <MemoryRouter initialEntries={["/dashboard/admin"]}>
                <Routes>
                  <Route path="/dashboard/admin" element={<AdminDashboard />} />
                  <Route path="/dashboard/admin/create-category" element={<CreateCategory />} />
                  <Route path="/dashboard/admin/create-product" element={<CreateProduct />} />
                  <Route path="/dashboard/admin/products" element={<Products />} />
                  <Route path="/dashboard/admin/orders" element={<AdminOrders />} />
                  <Route path="/dashboard/admin/users" element={<Users />} />
                </Routes>
              </MemoryRouter>
            </CartProvider>
          </SearchProvider>
        </AuthProvider>;
};

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
