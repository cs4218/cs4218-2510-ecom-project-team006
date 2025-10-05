import React from "react";
import ProductDetails from "./ProductDetails";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import { MemoryRouter, useNavigate, useParams } from "react-router-dom";
import axios from 'axios';
import { act } from "react-dom/test-utils";
import { useCart } from "../context/cart";
import toast from "react-hot-toast";

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

const mockProduct = {
  _id: "product-123",
  name: "Test Product",
  description: "Test product description",
  price: 99,
  category: { _id: "cat-123", name: "Category A" },
  slug: "test-product",
};

const mockRelatedProducts = [
  {
    _id: "product-456",
    name: "Related Product 1",
    description: "Related product description 1",
    price: 20,
    slug: "related-product-1",
  },
  {
    _id: "product-789",
    name: "Related Product 2",
    description: "Related product description 2",
    price: 40,
    slug: "related-product-2",
  },
];

describe("ProductDetails Component", () => {
  beforeEach(() => {
    useParams.mockReturnValue({ slug: "test-product" });
    useNavigate.mockReturnValue(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  })

  describe("product details", () => {
    it("renders product details & image if product fetched successfully", async () => {
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } }) // getProduct
        .mockResolvedValueOnce({ data: { products: mockRelatedProducts } }); // get related products

      render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      );

      expect(screen.getByText("Product Details")).toBeInTheDocument();
      // wait for product to be fetched
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(`/api/v1/product/get-product/test-product`)
        const img = screen.getByAltText(new RegExp(mockProduct.name));
        
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", `/api/v1/product/product-photo/${mockProduct._id}`);
        expect(screen.getByText(new RegExp(mockProduct.name))).toBeInTheDocument();
        expect(screen.getByText(new RegExp(mockProduct.description))).toBeInTheDocument();
        expect(screen.getByText("Price :$99.00")).toBeInTheDocument();
        expect(screen.getByText(new RegExp(mockProduct.category.name))).toBeInTheDocument();
      });
    });

    it("adds product to cart if 'ADD TO CART' button is pressed", async () => {
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } }) // getProduct
        .mockResolvedValueOnce({ data: { products: mockRelatedProducts } }); // get related products
      const [mockCart, mockSetCart] = useCart();

      render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      );

      // wait for product to be fetched
      await waitFor(() => {
        const buttons = screen.getAllByRole("button", { name: /ADD TO CART/ });
        fireEvent.click(buttons[0]); // first add to cart button is for main product

        expect(mockSetCart).toHaveBeenCalledWith([...mockCart, mockProduct]);
        expect(localStorage.setItem).toHaveBeenCalledWith(
          "cart",
          JSON.stringify([...mockCart, mockProduct])
        );
        expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
      });
    });

    it("does not fetch or render product if slug params is missing", async () => {
      useParams.mockReturnValue(null)
      render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).not.toHaveBeenCalled();
        expect(screen.queryByRole("image")).not.toBeInTheDocument();
        expect(screen.queryByText(/Name :/)).not.toBeInTheDocument();
      });
    });
    
    it("handles error when fetching product fails", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      const error = new Error("Product fetch failed");
      axios.get.mockRejectedValueOnce(error);

      render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`Error: ${error.message}`))).toBeInTheDocument()
        expect(screen.queryByRole("image")).not.toBeInTheDocument();
        expect(screen.queryByText(/Name :/)).not.toBeInTheDocument();
        expect(consoleSpy).toHaveBeenCalledWith(error);
      });
    });
  });

  describe("related products", () => {
    it("renders related product details & image if fetched successfully", async () => {
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } }) // getProduct
        .mockResolvedValueOnce({ data: { products: mockRelatedProducts } }); // get related products

      render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      );

      expect(screen.getByText("Similar Products ➡️")).toBeInTheDocument();
      // wait for product to be fetched
      await waitFor(() => {
        expect(axios.get)
          .toHaveBeenCalledWith(`/api/v1/product/related-product/${mockProduct._id}/${mockProduct.category._id}`)
        
        expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
        expect(screen.queryByText(/No Similar Products found/)).not.toBeInTheDocument();
          // related product 1
        const img1 = screen.getByAltText(new RegExp(mockRelatedProducts[0].name));
        expect(img1).toBeInTheDocument();
        expect(img1).toHaveAttribute("src", `/api/v1/product/product-photo/${mockRelatedProducts[0]._id}`);
        expect(screen.getByText(new RegExp(mockRelatedProducts[0].name))).toBeInTheDocument();
        expect(screen.getByText("$20.00")).toBeInTheDocument();
        expect(screen.getByText(`${mockRelatedProducts[0].description.substring(0, 60)}...`))
        // related product 2
        const img2 = screen.getByAltText(new RegExp(mockRelatedProducts[1].name));
        expect(img2).toBeInTheDocument();
        expect(img2).toHaveAttribute("src", `/api/v1/product/product-photo/${mockRelatedProducts[1]._id}`);
        expect(screen.getByText(new RegExp(mockRelatedProducts[1].name))).toBeInTheDocument();
        expect(screen.getByText("$40.00")).toBeInTheDocument();
        expect(screen.getByText(`${mockRelatedProducts[1].description.substring(0, 60)}...`))
      });
    });

    it("navigates to similar products if 'More Details' button pressed", async () => {
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } }) // getProduct
        .mockResolvedValueOnce({ data: { products: mockRelatedProducts } }); // get related products

      render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      );

      // wait for product to be fetched
      await waitFor(() => {
        const buttons = screen.getAllByRole("button", { name: /More Details/ });
        fireEvent.click(buttons[0]);
        fireEvent.click(buttons[1]);

        expect(useNavigate()).toHaveBeenCalledWith(`/product/${mockRelatedProducts[0].slug}`);
        expect(useNavigate()).toHaveBeenCalledWith(`/product/${mockRelatedProducts[1].slug}`);
      });
    });

    it("adds similar product to cart if 'ADD TO CART' button is pressed", async () => {
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } }) // getProduct
        .mockResolvedValueOnce({ data: { products: mockRelatedProducts } }); // get related products
      const [mockCart, mockSetCart] = useCart();

      render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      );

      // wait for product to be fetched
      await waitFor(() => {
        const buttons = screen.getAllByRole("button", { name: /ADD TO CART/ });
        fireEvent.click(buttons[1]); // first similar product is button index 1

        expect(mockSetCart).toHaveBeenCalledWith([...mockCart, mockRelatedProducts[0]]);
        expect(localStorage.setItem).toHaveBeenCalledWith(
          "cart",
          JSON.stringify([...mockCart, mockRelatedProducts[0]])
        );
        expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
      });
    });

    it("renders no similar products if fetched successfully & empty", async () => {
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } }) // getProduct
        .mockResolvedValueOnce({ data: { products: [] } }); // get related products

      await act(async () => render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      ));

      await waitFor(() => {
        expect(screen.getByText("No Similar Products found")).toBeInTheDocument();
      });
    });

    it("handles error when fetching related products fails", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      const error = new Error("Related fetch failed");
      // First call resolves product
      axios.get.mockResolvedValueOnce({ data: { product: mockProduct } });
      // Second call rejects
      axios.get.mockRejectedValueOnce(error);

      render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText(/No Similar Products found/)).not.toBeInTheDocument();
        expect(screen.getByText(new RegExp(`Error: ${error.message}`))).toBeInTheDocument();
        expect(consoleSpy).toHaveBeenCalledWith(error);
      });
    });
  });
});