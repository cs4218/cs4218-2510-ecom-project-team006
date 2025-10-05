import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import { MemoryRouter, useNavigate, useParams } from "react-router-dom";
import axios from 'axios';
import CategoryProduct from "./CategoryProduct";
import toast from "react-hot-toast";
import { useCart } from "../context/cart";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));
jest.mock("./../components/Layout", () => ({ children }) => (
  <div data-testid="layout">
    {children}
  </div>
));
jest.mock("../context/cart", () => ({
  useCart: jest.fn().mockReturnValue([[], jest.fn()]),
}));

Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

const mockProducts = [
  {
    _id: "product-123",
    name: "Test Product 1",
    description: "Test product description 1",
    price: 99,
    slug: "test-product-1",
  },
  {
    _id: "product-456",
    name: "Test Product 2",
    description: "Test product description 2. A very long description about the product named Test Product 2 that exceeds the 60 char description limit",
    price: 20,
    slug: "test-product-2",
  },
];

const mockCategory = {
  name: "Category A",
};

describe("CategoryProduct Component", () => {
  beforeEach(() => {
    useParams.mockReturnValue({ slug: "category-a"  });
    useNavigate.mockReturnValue(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders category name & all products fetched successfully", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { products: mockProducts, category: mockCategory } }); // get product-category

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    // wait for product to be fetched
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(`/api/v1/product/product-category/category-a`)
      // category name is displayed
      expect(screen.getByText(`Category - ${mockCategory.name}`)).toBeInTheDocument();
      expect(screen.getByText(`${mockProducts.length} result found`)).toBeInTheDocument();
      

      const img0 = screen.getByAltText(new RegExp(mockProducts[0].name));
      expect(img0).toBeInTheDocument();
      expect(img0).toHaveAttribute("src", `/api/v1/product/product-photo/${mockProducts[0]._id}`);
      expect(screen.getByText(new RegExp(mockProducts[0].name))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(mockProducts[0].description.substring(0, 60)))).toBeInTheDocument();
      expect(screen.getByText("$99.00")).toBeInTheDocument();

      const img1 = screen.getByAltText(new RegExp(mockProducts[1].name));
      expect(img1).toBeInTheDocument();
      expect(img1).toHaveAttribute("src", `/api/v1/product/product-photo/${mockProducts[1]._id}`);
      expect(screen.getByText(new RegExp(mockProducts[1].name))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(mockProducts[1].description.substring(0, 60)))).toBeInTheDocument();
      expect(screen.getByText("$20.00")).toBeInTheDocument();
    });
  });

  it("navigates to product when 'More Details' is pressed", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { products: mockProducts, category: mockCategory } }); // get product-category

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    // wait for product to be fetched
    await waitFor(() => {
      const buttons = screen.getAllByRole("button", { name: /More Details/ });
        fireEvent.click(buttons[0]);
        fireEvent.click(buttons[1]);

      expect(useNavigate()).toHaveBeenCalledWith(`/product/${mockProducts[0].slug}`);
      expect(useNavigate()).toHaveBeenCalledWith(`/product/${mockProducts[1].slug}`);
    });
  });

  it("adds to cart if 'ADD TO CART' button is pressed", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { products: mockProducts, category: mockCategory } }); // get product-category
    const [mockCart, mockSetCart] = useCart();

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    // wait for product to be fetched
    await waitFor(() => {
      const buttons = screen.getAllByRole("button", { name: /ADD TO CART/ });
      fireEvent.click(buttons[0]); // test add product 1

      expect(mockSetCart).toHaveBeenCalledWith([...mockCart, mockProducts[0]]);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "cart",
        JSON.stringify([...mockCart, mockProducts[0]])
      );
      expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
    });
  });

  it("handles error when fetching product-category fails", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const error = new Error("Product-category fetch failed");
    axios.get.mockRejectedValueOnce(error);

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(new RegExp(`Error: ${error.message}`))).toBeInTheDocument()
      expect(consoleSpy).toHaveBeenCalledWith(error);
    });
  });

  it("does not fetch or render products if slug params is missing", async () => {
    useParams.mockReturnValue(null)
    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).not.toHaveBeenCalled();
    });
  });
});