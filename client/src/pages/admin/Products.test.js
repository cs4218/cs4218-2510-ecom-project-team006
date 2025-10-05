import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Products from "./Products";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast"; 
import "@testing-library/jest-dom";

// AI Attribution: The following test code was generated with the assistance of AI (ChatGPT).

// Mock axios
jest.mock("axios");

// Mock toast
jest.mock("react-hot-toast");

// Mock Layout
jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

// Mock AdminMenu
jest.mock("../../components/AdminMenu", () => () => <div>AdminMenuMock</div>);

// URLs
const getProductsUrl = "/api/v1/product/get-product";

const mockProducts = [
  {
    _id: "1",
    name: "Product 1",
    description: "Description 1",
    slug: "product-1",
  },
  {
    _id: "2",
    name: "Product 2",
    description: "Description 2",
    slug: "product-2",
  },
];

describe("Products Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders component correctly", () => {
    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    expect(screen.getByText("AdminMenuMock")).toBeInTheDocument();
    expect(screen.getByText("All Products List")).toBeInTheDocument();
  });

  test("fetches and displays products successfully", async () => {
    axios.get.mockResolvedValue({ data: { success: true, products: mockProducts } });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getProductsUrl);

      mockProducts.forEach((p) => {
        expect(screen.getByText(p.name)).toBeInTheDocument();
        expect(screen.getByText(p.description)).toBeInTheDocument();

        const link = screen.getByRole("link", { name: new RegExp(p.name) });
        expect(link).toHaveAttribute("href", `/dashboard/admin/product/${p.slug}`);

        const img = screen.getByAltText(p.name);
        expect(img).toHaveAttribute("src", `/api/v1/product/product-photo/${p._id}`);
      });
    });
  });

  test("handles fetch products failure", async () => {
    axios.get.mockResolvedValue({ data: { success: false } });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getProductsUrl);
      expect(screen.queryByText(mockProducts[0].name)).not.toBeInTheDocument();
      expect(screen.queryByText(mockProducts[1].name)).not.toBeInTheDocument();
    });
  });

  test("handles fetch products error", async () => {
    axios.get.mockRejectedValue(new Error("Network Error"));

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getProductsUrl);
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      expect(screen.queryByText(mockProducts[0].name)).not.toBeInTheDocument();
      expect(screen.queryByText(mockProducts[1].name)).not.toBeInTheDocument();
    });
  });
});
