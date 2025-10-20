import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import React from "react";
import toast, { Toaster } from "react-hot-toast";
import { CartProvider, useCart } from "../context/cart";
import axios from "axios";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "../context/auth";
import { SearchProvider } from "../context/search";
import ProductDetails from "./ProductDetails";

jest.mock("axios");

// mock window.matchMedia used by react-hot-toast (generated from ChatGPT)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,       // or true if you want
    media: query,
    onchange: null,
    addListener: jest.fn(),  // deprecated, but some libs still use it
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const mockProduct = {
  _id: "product-000",
  name: "Purple Dictionary",
  description: "Test product description",
  price: 50,
  category: { _id: "cat-123", name: "Books" },
  slug: "purple-dictionary",
};

const mockRelatedProducts = [
  {
    _id: "product-123",
    name: "Green Cookbook",
    description: "Test product description 1",
    price: 99,
    slug: "green-cookbook",
  },
  {
    _id: "product-456",
    name: "Red Textbook",
    description: "Test product description 2. A very long description about the product named Test Product 2 that exceeds the 60 char description limit",
    price: 20,
    slug: "red-textbook",
  },
  {
    _id: "product-789",
    name: "Yellow Phonebook",
    description: "Test product description 3.",
    price: 20,
    slug: "yellow-phonebook",
  },
];

function mockAxios() {
  axios.get.mockImplementation((url) => {
    if (url.includes("/api/v1/category/get-category")) {
      // mock for useCategory hook in header
      return Promise.resolve({
        data: {
          success: true,
          category: [],
        }
      });
    }

    if (url.includes("/api/v1/product/get-product")) {
      return Promise.resolve({
        data: {
          success: true,
          product: mockProduct
        },
      });
    }

    if (url.includes("/api/v1/product/related-product")) {
      return Promise.resolve({
        data: {
          success: true,
          products: mockRelatedProducts
        },
      });
    }

    return Promise.resolve({
      data: {},
    });
  });
}

beforeEach(() => {
  localStorage.clear();
  mockAxios();
});

afterEach(() => {
  toast.remove(); // ensure all toast elements are removed after each test
  jest.clearAllMocks();
})

/**
 * Helper component to verify navigation is correct by displaying location.
 */
function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}</div>;
}

/**
 * Helper component to peek at the contents of the useCart Context cart State.
 */
function CartStateDisplay() {
  const [cart] = useCart();

  return (
    <div data-testid="cart-state-display">
      { cart.map(p => p._id).join() }
    </div>
  );
};

function renderProductDetailsPage(url=`/product/${mockProduct.slug}`) {
  return render(
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <MemoryRouter initialEntries={[url]}>
            <Routes>
              <Route path="/product/:slug" element={<ProductDetails />} />
            </Routes>
            {/* Location display without a route because we are testing navigating to the same page with different params */}
            <LocationDisplay /> 
          </MemoryRouter>
          <Toaster />
          <CartStateDisplay />
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );
}

describe("ProductDetails Page integration tests", () => {
  it("renders and fetches product and related products based on url param", async () => {
    // sanity check test
    renderProductDetailsPage();

    await waitFor(() => {
      expect(screen.getByText(/Purple Dictionary/i)).toBeInTheDocument();
      expect(screen.getByText(/Green Cookbook/i)).toBeInTheDocument();
      expect(screen.getByText(/Red Textbook/i)).toBeInTheDocument();
      expect(screen.getByText(/Yellow Phonebook/i)).toBeInTheDocument();
    });
  });

  it("adds main product to cart, updates localStorage & toasts", async () => {
    renderProductDetailsPage();

    // click the first button (main product)
    const buttons = await screen.findAllByRole("button", { name: /ADD TO CART/i });
    fireEvent.click(buttons[0]);
        
    // verify product added to cart context
    const cartDisplay = await screen.findByTestId("cart-state-display");
    expect(cartDisplay.textContent).toBe(mockProduct._id);

    // expect at least 1 toast
    const toasts = await screen.findAllByText(/Item Added to cart/i);
    expect(toasts.length).toBeGreaterThan(0);
    
    // verify item added to localstorage cart
    const storedCart = JSON.parse(localStorage.getItem("cart"));
    expect(storedCart).toEqual(expect.arrayContaining([mockProduct]));
  });

  it("adds related product to cart, updates localStorage & toasts", async () => {
    renderProductDetailsPage();

    // click the 2nd button (1st related product)
    const buttons = await screen.findAllByRole("button", { name: /ADD TO CART/i });
    fireEvent.click(buttons[1]);
        
    // verify product added to cart context
    const cartDisplay = await screen.findByTestId("cart-state-display");
    expect(cartDisplay.textContent).toBe(mockRelatedProducts[0]._id);

    // expect at least 1 toast
    const toasts = await screen.findAllByText(/Item Added to cart/i);
    expect(toasts.length).toBeGreaterThan(0);
    
    // verify item added to localstorage cart
    const storedCart = JSON.parse(localStorage.getItem("cart"));
    expect(storedCart).toEqual(expect.arrayContaining([mockRelatedProducts[0]]));
  });

  it("navigates correctly when related products 'More Details' is clicked", async () => {
    renderProductDetailsPage();

    // click the first button (1st related product)
    const buttons = await screen.findAllByRole("button", { name: /More Details/i });
    expect(buttons.length).toBe(3);
    fireEvent.click(buttons[0]);

    // verify navigated to correct location
    const location = await screen.findByTestId("location-display");
    expect(location).toHaveTextContent(`/product/${mockRelatedProducts[0].slug}`);
  });
});