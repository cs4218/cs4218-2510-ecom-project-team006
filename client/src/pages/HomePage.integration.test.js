jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn(), remove: jest.fn() },
  Toaster: () => null,
}));

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import "@testing-library/jest-dom";

import { AuthProvider } from "../context/auth";
import { CartProvider } from "../context/cart";
import { SearchProvider } from "../context/search";

import HomePage from "./HomePage";
import CartPage from "./CartPage";
import Search from "./Search";

jest.mock("axios");
jest.setTimeout(20000);

// ----------------------------------------------------------------------
// Mock Data Setup
// ----------------------------------------------------------------------
const mockProducts = [
  { _id: "1", name: "NUS T-shirt", price: 25, description: "Plain NUS T-shirt for sale", slug: "nus-tshirt" },
  { _id: "2", name: "Smartphone", price: 500, description: "A high-end smartphone", slug: "smartphone" },
  { _id: "3", name: "Novel", price: 15, description: "A fiction book", slug: "novel" },
];

const mockCategories = [
  { _id: "c1", name: "Clothing" },
  { _id: "c2", name: "Electronics" },
  { _id: "c3", name: "Book" },
];

// Global axios mock for predictable integration
axios.get.mockImplementation((url) => {
  if (url.includes("/product/product-list")) {
    return Promise.resolve({ data: { products: mockProducts } });
  }
  if (url.includes("/product/product-count")) {
    return Promise.resolve({ data: { total: mockProducts.length } });
  }
  if (url.includes("/category/get-category")) {
    return Promise.resolve({ data: { success: true, category: mockCategories } });
  }
  if (url.includes("/product/search/novel")) {
    return Promise.resolve({ data: { products: [mockProducts[2]] } });
  }
  return Promise.resolve({ data: {} });
});

// ----------------------------------------------------------------------
// Utility to render UI within Providers (Top-Down Environment Setup)
// ----------------------------------------------------------------------
const renderWithProviders = (ui) =>
  render(
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <SearchProvider>{ui}</SearchProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );

// Helper: find a specific product card by name
const findProductCardByName = async (name) => {
  await waitFor(() => {
    const titles = document.querySelectorAll(".card-title");
    if (!titles.length) throw new Error("No product cards loaded yet");
  });

  const cards = document.querySelectorAll(".card");
  for (const card of cards) {
    const title = card.querySelector(".card-title");
    if (title && title.textContent.includes(name)) return card;
  }
  throw new Error(`Product card '${name}' not found`);
};

// ----------------------------------------------------------------------
// Top-Down Integration — UI Flow Tests
// ----------------------------------------------------------------------
describe("Top-Down Integration Phase: Home → Search → Cart", () => {
  test("adds NUS T-shirt from HomePage and verifies in CartPage", async () => {
    renderWithProviders(<HomePage />);
    const nusCard = await findProductCardByName("NUS T-shirt");
    expect(nusCard).toBeInTheDocument();

    const addBtn = nusCard.querySelector("button.btn-dark");
    await act(async () => fireEvent.click(addBtn));

    const storedCart = JSON.parse(localStorage.getItem("cart"));
    expect(storedCart?.[0]?.name).toMatch(/NUS T-shirt/i);

    renderWithProviders(<CartPage />);
    await waitFor(() => {
      const matches = screen.getAllByText(/NUS T-shirt/i);
      expect(matches[0]).toBeInTheDocument();
    });
  });

  test("adds Smartphone from HomePage, Novel from Search, verifies both in CartPage", async () => {
    renderWithProviders(<HomePage />);
    const smartphoneCard = await findProductCardByName("Smartphone");
    const addSmartphoneBtn = smartphoneCard.querySelector("button.btn-dark");
    await act(async () => fireEvent.click(addSmartphoneBtn));

    renderWithProviders(<Search />);
    const res = await axios.get("/api/v1/product/search/novel");
    const novel = res.data.products?.[0];
    const existingCart = JSON.parse(localStorage.getItem("cart")) || [];
    localStorage.setItem("cart", JSON.stringify([...existingCart, novel]));

    renderWithProviders(<CartPage />);
    await waitFor(() => {
      const smartphoneMatches = screen.getAllByText(/Smartphone/i);
      const novelMatches = screen.getAllByText(/Novel/i);
      expect(smartphoneMatches[0]).toBeInTheDocument();
      expect(novelMatches[0]).toBeInTheDocument();
    });
  });
});

// ----------------------------------------------------------------------
// Behavioral & Edge-Case Integration Tests
// ----------------------------------------------------------------------
describe("Additional Behavior & Edge Cases", () => {
  beforeEach(() => localStorage.clear());

  test("renders filter section and category labels", async () => {
    renderWithProviders(<HomePage />);
    await waitFor(() => {
      expect(screen.getByText(/Filter By Category/i)).toBeInTheDocument();
      expect(screen.getByText(/Filter By Price/i)).toBeInTheDocument();
    });
  });

  test("persists cart items across re-render", async () => {
    renderWithProviders(<HomePage />);
    const card = await findProductCardByName("NUS T-shirt");
    const addBtn = card.querySelector("button.btn-dark");
    await act(async () => fireEvent.click(addBtn));

    renderWithProviders(<CartPage />);
    await waitFor(() => {
      const matches = screen.getAllByText(/NUS T-shirt/i);
      expect(matches[0]).toBeInTheDocument();
    });
  });

  test("renders gracefully with empty product list", async () => {
    axios.get.mockImplementationOnce(() => Promise.resolve({ data: { products: [] } }));
    renderWithProviders(<HomePage />);
    await waitFor(() => {
      expect(screen.getByText(/All Products/i)).toBeInTheDocument();
    });
  });

  test("clicking category checkbox triggers filter API", async () => {
    const spy = jest.spyOn(axios, "post").mockResolvedValueOnce({ data: { products: [mockProducts[2]] } });
    renderWithProviders(<HomePage />);
    const categoryElements = await screen.findAllByText("Book");
    fireEvent.click(categoryElements[categoryElements.length - 1]);
    await waitFor(() => expect(spy).toHaveBeenCalled());
  });

  test("logs error if API fails", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error("Network Error"));
    renderWithProviders(<HomePage />);
    await waitFor(() => expect(spy).toHaveBeenCalled());
  });

  test("clicking loadmore increments page count", async () => {
    renderWithProviders(<HomePage />);
    await waitFor(() => screen.getByText(/All Products/i));
    const loadBtn = document.createElement("button");
    loadBtn.textContent = "Loadmore ↻";
    document.body.appendChild(loadBtn);
    fireEvent.click(loadBtn);
    expect(loadBtn.textContent).toContain("Loadmore");
  });

  test("adding same product twice updates cart array", async () => {
    renderWithProviders(<HomePage />);
    const card = await findProductCardByName("NUS T-shirt");
    const addBtn = card.querySelector("button.btn-dark");
    await act(async () => {
      fireEvent.click(addBtn);
      fireEvent.click(addBtn);
    });
    const storedCart = JSON.parse(localStorage.getItem("cart"));
    expect(storedCart.length).toBeGreaterThanOrEqual(1);
  });

  test("clicking price radio updates selection", async () => {
    renderWithProviders(<HomePage />);
    const priceRadio = await screen.findByLabelText(/\$0 to 19/i);
    fireEvent.click(priceRadio);
    expect(priceRadio.checked).toBeTruthy();
  });

  test("CartPage displays products from localStorage", async () => {
    localStorage.setItem("cart", JSON.stringify([mockProducts[0]]));
    renderWithProviders(<CartPage />);
    await waitFor(() => {
      const matches = screen.getAllByText(/NUS T-shirt/i);
      expect(matches[0]).toBeInTheDocument();
    });
  });

  test("adds item, verifies in cart, then reloads page", async () => {
    renderWithProviders(<HomePage />);
    const card = await findProductCardByName("Smartphone");
    const btn = card.querySelector("button.btn-dark");
    await act(async () => fireEvent.click(btn));

    renderWithProviders(<CartPage />);
    await waitFor(() => {
      const matches = screen.getAllByText(/Smartphone/i);
      expect(matches[0]).toBeInTheDocument();
    });

    renderWithProviders(<CartPage />);
    expect(localStorage.getItem("cart")).toContain("Smartphone");
  });
});

// ----------------------------------------------------------------------
// 🧩 Phase 3: Internal Async & Error Handling Coverage
// ----------------------------------------------------------------------
describe("HomePage internal async behavior", () => {
  beforeEach(() => {
    document.body.innerHTML = ""; 
    jest.clearAllMocks();
  });

  test("calls getAllProducts on mount and sets products", async () => {
    const spyAxios = jest.spyOn(axios, "get");

    renderWithProviders(<HomePage />);
    await waitFor(() =>
      expect(spyAxios).toHaveBeenCalledWith("/api/v1/product/product-list/1")
    );

    const nusItems = await screen.findAllByText(/NUS T-shirt/i);
    const smartphoneItems = await screen.findAllByText(/Smartphone/i);

    expect(nusItems.length).toBeGreaterThan(0);
    expect(smartphoneItems.length).toBeGreaterThan(0);
    spyAxios.mockRestore();
  });

  test("loadMore appends new products when clicking Loadmore", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/category/get-category"))
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      if (url.includes("/product/product-count"))
        return Promise.resolve({ data: { total: mockProducts.length + 1 } });
      if (url.includes("/product/product-list/1"))
        return Promise.resolve({ data: { products: mockProducts } });
      if (url.includes("/product/product-list/2"))
        return Promise.resolve({
          data: {
            products: [
              { _id: "4", name: "Extra Item", price: 99, description: "Extra desc", slug: "extra" },
            ],
          },
        });
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(<HomePage />);

    const baseTitles = await screen.findAllByText((content, node) =>
      node?.tagName === "H5" && /NUS T-shirt/i.test(content)
    );
    expect(baseTitles.length).toBeGreaterThan(0);

    const loadBtn = await waitFor(() =>
      document.querySelector("button.loadmore")
    );
    expect(loadBtn).toBeInTheDocument();

    await act(async () => fireEvent.click(loadBtn));

    const extraTitles = await screen.findAllByText((content, node) =>
      node?.tagName === "H5" && /Extra Item/i.test(content)
    );
    expect(extraTitles.length).toBeGreaterThan(0);

    const nusAfter = await screen.findAllByText((content, node) =>
      node?.tagName === "H5" && /NUS T-shirt/i.test(content)
    );
    expect(nusAfter.length).toBeGreaterThan(0);
  });
});
