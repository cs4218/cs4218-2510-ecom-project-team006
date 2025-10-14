import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { BrowserRouter, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useCart } from "../context/cart";
import HomePage from "./HomePage";
import "@testing-library/jest-dom";

// Mocks
jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../styles/Homepages.css", () => ({}));

// Mock useCart hook
jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

// Mock Prices list so tests are stable
jest.mock("../components/Prices", () => ({
  Prices: [
    { _id: "price1", name: "$0 - $20", array: [0, 20 - Number.EPSILON] },
    { _id: "price2", name: "$21 - $50", array: [21, 50 - Number.EPSILON] },
  ],
}));

// Mock Layout component
jest.mock("../components/Layout", () => {
  return function MockLayout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

// Partially mock react-router-dom to override useNavigate only
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: jest.fn(),
  };
});

const mockedAxios = axios;
const mockedToast = toast;
const mockedUseCart = useCart;
const mockedUseNavigate = useNavigate;

// Mock sample data
const baseProducts = [
  {
    _id: "p1",
    name: "Sample Product 1",
    description:
      "This is a very long description that definitely exceeds the sixty character limit for the card preview text.",
    price: 9.99,
    category: { _id: "catA", name: "Category A" },
    slug: "sample-product-1",
    quantity: 1,
  },
  {
    _id: "p2",
    name: "Sample Product 2",
    description: "Description for product 2",
    price: 59.99,
    category: { _id: "catB", name: "Category B" },
    slug: "sample-product-2",
    quantity: 50,
  },
];

const nextPageProducts = [
  {
    _id: "p3",
    name: "Sample Product 3",
    description: "Description for product 3",
    price: 29.99,
    category: { _id: "catA", name: "Category A" },
    slug: "sample-product-3",
    quantity: 5,
  },
  {
    _id: "p4",
    name: "Sample Product 4",
    description: "Description for product 4",
    price: 39.99,
    category: { _id: "catB", name: "Category B" },
    slug: "sample-product-4",
    quantity: 2,
  },
];

const baseCategories = [
  { _id: "catA", name: "Category A", slug: "category-a" },
  { _id: "catB", name: "Category B", slug: "category-b" },
];

const originalConsoleError = console.error;

afterAll(() => {
  console.error = originalConsoleError;
});

describe("HomePage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock cart state
    const setCart = jest.fn();
    mockedUseCart.mockReturnValue([[], setCart]);

    // Mock navigate
    mockedUseNavigate.mockReturnValue(jest.fn());

    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();

    // Mock successful API responses
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: baseCategories },
        });
      }
      if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({
          data: { success: true, total: 4 },
        });
      }
      if (url.includes("/api/v1/product/product-list")) {
        return Promise.resolve({
          data: { success: true, products: baseProducts },
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  test("loads and displays initial products", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "/api/v1/product/product-list/1"
    );

    expect(screen.getByText("All Products")).toBeInTheDocument();
    expect(screen.getByText("Sample Product 1")).toBeInTheDocument();
    expect(screen.getByText("Sample Product 2")).toBeInTheDocument();

    expect(screen.getByText("$9.99")).toBeInTheDocument();
    expect(screen.getByText("$59.99")).toBeInTheDocument();

    const expectedTrunc = `${baseProducts[0].description.substring(0, 60)}...`;
    expect(screen.getByText(expectedTrunc)).toBeInTheDocument();
  });

  test("navigates to product details when clicking More Details", async () => {
    const navSpy = jest.fn();
    mockedUseNavigate.mockReturnValue(navSpy);

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    const btn = screen.getAllByText("More Details")[0];
    await act(async () => {
      fireEvent.click(btn);
    });

    expect(navSpy).toHaveBeenCalledWith("/product/sample-product-1");
  });

  test("truncates long descriptions to 60 chars plus ellipsis (from baseProducts)", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    const expected = `${baseProducts[0].description.substring(0, 60)}...`;
    await waitFor(() => {
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    expect(
      screen.queryByText(baseProducts[0].description)
    ).not.toBeInTheDocument();
  });

  test("filters by a single category", async () => {
    mockedAxios.post = jest.fn().mockResolvedValueOnce({
      data: { success: true, products: [baseProducts[0]] },
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    const catACheckbox = screen
      .getByText("Category A")
      .closest("label")
      .querySelector("input");

    await act(async () => {
      fireEvent.click(catACheckbox);
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "/api/v1/product/product-filters",
      { checked: ["catA"], radio: [] }
    );

    await waitFor(() => {
      expect(screen.getByText("Sample Product 1")).toBeInTheDocument();
      expect(screen.queryByText("Sample Product 2")).not.toBeInTheDocument();
    });
  });

  test("filters by multiple categories", async () => {
    const catAItem = {
      ...baseProducts[0],
      name: "Category A Item",
      description: "Item from A",
      slug: "a-item",
    };
    const catBItem = {
      ...baseProducts[1],
      name: "Category B Item",
      description: "Item from B",
      slug: "b-item",
    };

    mockedAxios.post = jest
      .fn()
      .mockResolvedValueOnce({
        data: { success: true, products: [catAItem] },
      })
      .mockResolvedValueOnce({
        data: { success: true, products: [catAItem, catBItem] },
      });

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    const catACheckbox = screen
      .getByText("Category A")
      .closest("label")
      .querySelector("input");
    const catBCheckbox = screen
      .getByText("Category B")
      .closest("label")
      .querySelector("input");

    await act(async () => {
      fireEvent.click(catACheckbox);
    });

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        { checked: ["catA"], radio: [] }
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Category A Item")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(catBCheckbox);
    });

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        { checked: ["catA", "catB"], radio: [] }
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Category A Item")).toBeInTheDocument();
      expect(screen.getByText("Category B Item")).toBeInTheDocument();
    });
  });

  test("filters by first price range", async () => {
    mockedAxios.post = jest.fn().mockResolvedValueOnce({
      data: { success: true, products: [baseProducts[0]] },
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    const firstRadio = screen.getAllByRole("radio")[0];

    await act(async () => {
      fireEvent.click(firstRadio);
    });

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        { checked: [], radio: [0, 20 - Number.EPSILON] }
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Sample Product 1")).toBeInTheDocument();
      expect(screen.queryByText("Sample Product 2")).not.toBeInTheDocument();
    });
  });

  test("clears category filter when unchecked and reloads all products", async () => {
    mockedAxios.post = jest.fn().mockResolvedValueOnce({
      data: { success: true, products: [baseProducts[0]] },
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    const catACheckbox = screen
      .getByText("Category A")
      .closest("label")
      .querySelector("input");

    await act(async () => {
      fireEvent.click(catACheckbox);
    });

    await waitFor(() => {
      expect(screen.getByText("Sample Product 1")).toBeInTheDocument();
    });

    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, products: baseProducts },
    });

    await act(async () => {
      fireEvent.click(catACheckbox);
    });

    await waitFor(() => {
      expect(screen.getByText("Sample Product 1")).toBeInTheDocument();
      expect(screen.getByText("Sample Product 2")).toBeInTheDocument();
    });
  });

  test("adds product to cart and persists to localStorage", async () => {
    const cartState = [];
    const setCart = jest.fn();
    mockedUseCart.mockReturnValue([cartState, setCart]);

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    const addBtns = screen.getAllByText("ADD TO CART");
    await act(async () => {
      fireEvent.click(addBtns[0]);
    });

    const expectedItem = {
      _id: "p1",
      name: "Sample Product 1",
      price: 9.99,
      slug: "sample-product-1",
      quantity: 1,
    };

    expect(setCart).toHaveBeenCalledWith([expectedItem]);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "cart",
      JSON.stringify([expectedItem])
    );
    expect(mockedToast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  test("loads more products on Loadmore click and shows loading state", async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: baseCategories },
        });
      }
      if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({
          data: { success: true, total: 4 },
        });
      }
      if (url.includes("/api/v1/product/product-list/1")) {
        return Promise.resolve({
          data: { success: true, products: baseProducts },
        });
      }
      if (url.includes("/api/v1/product/product-list/2")) {
        return Promise.resolve({
          data: { success: true, products: nextPageProducts },
        });
      }
      return Promise.resolve({ data: {} });
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Sample Product 1")).toBeInTheDocument();
    });

    const loadMoreBtn = screen.getByText(/Loadmore/i).closest("button");

    mockedAxios.get.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: { success: true, products: nextPageProducts },
              }),
            100
          )
        )
    );

    await act(async () => {
      fireEvent.click(loadMoreBtn);
    });

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Sample Product 3")).toBeInTheDocument();
      expect(screen.getByText("Sample Product 4")).toBeInTheDocument();
    });
  });

  test("handles generic API error gracefully", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("API Error"));
    console.log = jest.fn();

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    expect(screen.getByText("Filter By Category")).toBeInTheDocument();
    expect(screen.getByText("All Products")).toBeInTheDocument();
    expect(console.log).toHaveBeenCalled();
  });

  test("renders products even if categories API fails", async () => {
    jest.clearAllMocks();

    mockedUseCart.mockReturnValue([[], jest.fn()]);
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.reject(new Error("Category API Error"));
      }
      if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({ data: { success: true, total: 4 } });
      }
      if (url.includes("/api/v1/product/product-list")) {
        return Promise.resolve({
          data: { success: true, products: baseProducts },
        });
      }
      return Promise.resolve({ data: {} });
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Sample Product 1")).toBeInTheDocument();
    });
  });

  test("loads products but hides Loadmore when product count API fails", async () => {
    jest.clearAllMocks();

    mockedUseCart.mockReturnValue([[], jest.fn()]);
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: baseCategories },
        });
      }
      if (url.includes("/api/v1/product/product-count")) {
        return Promise.reject(new Error("Count error"));
      }
      if (url.includes("/api/v1/product/product-list")) {
        return Promise.resolve({
          data: { success: true, products: baseProducts },
        });
      }
      return Promise.resolve({ data: {} });
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Sample Product 1")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Loadmore/i)).not.toBeInTheDocument();
  });

  test("reset button triggers window.location.reload", async () => {
    const originalLocation = window.location;
    delete window.location;
    window.location = { reload: jest.fn() };

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    const resetBtn = screen.getByText("RESET FILTERS");
    await act(async () => {
      fireEvent.click(resetBtn);
    });

    expect(window.location.reload).toHaveBeenCalled();

    window.location = originalLocation;
  });
});
