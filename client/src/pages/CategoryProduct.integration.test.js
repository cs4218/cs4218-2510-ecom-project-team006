import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import React from "react";
import toast, { Toaster } from "react-hot-toast";
import { CartProvider, useCart } from "../context/cart";
import axios from "axios";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import CategoryProduct from "./CategoryProduct";
import { AuthProvider } from "../context/auth";
import { SearchProvider } from "../context/search";

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

const mockProducts = [
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
];

const mockCategory = {
  name: "Books",
  slug: "books",
};

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

    if (url.includes("/api/v1/product/product-category")) {
      return Promise.resolve({
        data: {
          success: true,
          category: mockCategory,
          products: mockProducts
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

function renderCategoryPage(url=`/category/${mockCategory.slug}`) {
  return render(
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <MemoryRouter initialEntries={[url]}>
            <Routes>
              <Route path="/category/:slug" element={<CategoryProduct />} />
              <Route path="*" element={<LocationDisplay />} />
            </Routes>
          </MemoryRouter>
          <Toaster />
          <CartStateDisplay />
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );
}

describe("CategoryProduct Page integration tests", () => {
  it("renders and fetches products from the correct category based on url param", async () => {
    renderCategoryPage();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/product/product-category/${mockCategory.slug}`)
      ); // since axios is mocked, we must verify it was called with the right url param
      expect(screen.getByText(`Category - ${mockCategory.name}`)).toBeInTheDocument();
      expect(screen.getByText(`${mockProducts.length} result found`)).toBeInTheDocument();
      expect(screen.getByText("Green Cookbook")).toBeInTheDocument();
      expect(screen.getByText("Red Textbook")).toBeInTheDocument();
    });
  });

  it("adds the product to cart, updates localStorage & toasts", async () => {
    renderCategoryPage();

    // click the first button (product 0)
    const buttons = await screen.findAllByRole("button", { name: /ADD TO CART/i });
    fireEvent.click(buttons[0]);
        
    // verify product added to cart context
    const cartDisplay = await screen.findByTestId("cart-state-display");
    expect(cartDisplay.textContent).toBe(mockProducts[0]._id);

    // expect at least 1 toast
    const toasts = await screen.findAllByText(/Item Added to cart/i);
    expect(toasts.length).toBeGreaterThan(0);
    
    // verify item added to localstorage cart
    const storedCart = JSON.parse(localStorage.getItem("cart"));
    expect(storedCart).toEqual(expect.arrayContaining([mockProducts[0]]));
  });

  it("navigates correctly when 'More Details' is clicked", async () => {
    renderCategoryPage();

    // click the first button (product 0)
    const buttons = await screen.findAllByRole("button", { name: /More Details/i });
    fireEvent.click(buttons[0]);

    // verify navigated to correct location
    expect(screen.getByTestId("location-display")).toHaveTextContent(`/product/${mockProducts[0].slug}`);
  });

});