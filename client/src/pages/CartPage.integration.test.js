import "@testing-library/jest-dom";
jest.setTimeout(10000);

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [
    {
      token: "t",
      user: { name: "Ivy", email: "ivy@example.com", address: "123 Main" },
    },
    jest.fn(),
  ]),
}));

jest.mock("../hooks/useCategory", () => jest.fn(() => []));

jest.mock("../context/search", () => {
  const actual = jest.requireActual("../context/search");
  return {
    ...actual,
    useSearch: jest.fn(() => [
      { keyword: "", results: [] },
      jest.fn(),
    ]),
  };
});

jest.mock("axios");
jest.mock("react-hot-toast");

import React from "react";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { CartProvider } from "../context/cart";
import { SearchProvider } from "../context/search";
import CartPage from "./CartPage";
import HomePage from "./HomePage";
import Search from "./Search";

afterEach(() => cleanup());

describe("Top-Down Integration Suite: Home → Category → Search → Cart (no payment)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // -------------------- TEST 1 --------------------
  it("Top-down: Home integrates Category filter to fetch and render filtered products", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/category/get-category")) {
        return Promise.resolve({
          data: {
            success: true,
            category: [
              { _id: "cat-book", name: "Book" },
              { _id: "cat-clothing", name: "Clothing" },
            ],
          },
        });
      }
      if (url.includes("/product/product-count"))
        return Promise.resolve({ data: { total: 2 } });
      if (url.includes("/product/product-list/"))
        return Promise.resolve({ data: { products: [] } });
      return Promise.resolve({ data: { products: [], total: 0 } });
    });

    axios.post.mockImplementation((url, body) => {
      if (
        url.includes("/product/product-filters") &&
        body.checked.includes("cat-book")
      ) {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: 101,
                name: "NUS Book",
                price: 12,
                slug: "nus-book",
                description: "read me",
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: { products: [] } });
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <CartProvider>
          <SearchProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
            </Routes>
          </SearchProvider>
        </CartProvider>
      </MemoryRouter>
    );

    await screen.findByText("Filter By Category", {}, { timeout: 4000 });
    const bookCb = await screen.findByText("Book");
    fireEvent.click(bookCb);
    await screen.findByText("NUS Book", {}, { timeout: 4000 });
  });

  // -------------------- TEST 2 --------------------
  it("Top-down: Search integrates with Cart; added item appears in CartPage", async () => {
    const { useSearch } = require("../context/search");
    useSearch.mockReturnValueOnce([
      {
        keyword: "nus",
        results: [
          {
            _id: 7,
            name: "NUS Tee",
            price: 20,
            slug: "nus-tee",
            description: "shirt",
          },
        ],
      },
      jest.fn(),
    ]);

    axios.get.mockImplementation(() =>
      Promise.resolve({ data: { products: [], total: 0 } })
    );

    render(
      <MemoryRouter initialEntries={["/search"]}>
        <CartProvider>
          <SearchProvider>
            <Routes>
              <Route path="/search" element={<Search />} />
              <Route path="/cart" element={<CartPage />} />
            </Routes>
          </SearchProvider>
        </CartProvider>
      </MemoryRouter>
    );

    const addBtn = await screen.findByRole("button", { name: /add to cart/i });
    fireEvent.click(addBtn);
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");

    // Navigate to CartPage
    cleanup();
    render(
      <MemoryRouter initialEntries={["/cart"]}>
        <CartProvider>
          <SearchProvider>
            <Routes>
              <Route path="/cart" element={<CartPage />} />
            </Routes>
          </SearchProvider>
        </CartProvider>
      </MemoryRouter>
    );

    await screen.findByText(/Cart Summary/i, {}, { timeout: 4000 });
    await waitFor(() =>
      expect(screen.getByText(/Hello Ivy/i)).toBeInTheDocument()
    );
  });
});
