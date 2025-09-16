import React from "react";
import { render, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Categories from "./Categories";
import useCategory from "../hooks/useCategory";
import "@testing-library/jest-dom/extend-expect";

// Mock the custom hook for categories.
jest.mock("../hooks/useCategory");

// Mock the Layout component to isolate Categories from Header.
jest.mock("../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout">
    <h1>{title}</h1>
    {children}
  </div>
));

// Mocks for context hooks used by Header/Layout.
jest.mock("../context/auth", () => ({
  useAuth: () => [null, jest.fn()],
}));
jest.mock("../context/cart", () => ({
  useCart: () => [[], jest.fn()],
}));
jest.mock("../context/search", () => ({
  useSearch: () => [{ keyword: "" }, jest.fn()],
}));

describe("Categories Component — EP and BVA", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // BVA: 0 items
  it("renders no category links when list is empty", () => {
    useCategory.mockReturnValue([]);

    const { getByTestId } = render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    const layout = getByTestId("layout");
    expect(within(layout).getByText("All Categories")).toBeInTheDocument();

    const links = layout.querySelectorAll(".btn.btn-primary");
    expect(links.length).toBe(0);
  });

  // BVA: 1 item
  it("renders exactly one category link", () => {
    useCategory.mockReturnValue([{ _id: "1", name: "Books", slug: "books" }]);

    const { getByTestId } = render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    const layout = getByTestId("layout");
    const links = layout.querySelectorAll(".btn.btn-primary");
    expect(links.length).toBe(1);

    const booksLink = within(layout).getByText("Books").closest("a");
    expect(booksLink).toHaveAttribute("href", "/category/books");
  });

  // BVA: 2 items
  it("renders exactly two category links", () => {
    useCategory.mockReturnValue([
      { _id: "1", name: "Books", slug: "books" },
      { _id: "2", name: "Electronics", slug: "electronics" },
    ]);

    const { getByTestId } = render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    const layout = getByTestId("layout");
    const links = layout.querySelectorAll(".btn.btn-primary");
    expect(links.length).toBe(2);

    const books = within(layout).getByText("Books").closest("a");
    const electronics = within(layout).getByText("Electronics").closest("a");
    expect(books).toHaveAttribute("href", "/category/books");
    expect(electronics).toHaveAttribute("href", "/category/electronics");
  });

  // EP: Typical valid data (multiple items)
  it("renders all categories from a typical list", () => {
    useCategory.mockReturnValue([
      { _id: "1", name: "Books", slug: "books" },
      { _id: "2", name: "Home", slug: "home" },
      { _id: "3", name: "Toys", slug: "toys" },
    ]);

    const { getByTestId } = render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    const layout = getByTestId("layout");
    expect(within(layout).getByText("Books").closest("a")).toHaveAttribute(
      "href",
      "/category/books"
    );
    expect(within(layout).getByText("Home").closest("a")).toHaveAttribute(
      "href",
      "/category/home"
    );
    expect(within(layout).getByText("Toys").closest("a")).toHaveAttribute(
      "href",
      "/category/toys"
    );
  });

  // EP: Unusual but valid characters 
  it("supports accents and punctuation in category names", () => {
    useCategory.mockReturnValue([
      { _id: "1", name: "Café & Bakery", slug: "cafe-bakery" },
      { _id: "2", name: "Kids-Toys!", slug: "kids-toys" },
    ]);

    const { getByTestId } = render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    const layout = getByTestId("layout");
    expect(within(layout).getByText("Café & Bakery").closest("a")).toHaveAttribute(
      "href",
      "/category/cafe-bakery"
    );
    expect(within(layout).getByText("Kids-Toys!").closest("a")).toHaveAttribute(
      "href",
      "/category/kids-toys"
    );
  });
});
