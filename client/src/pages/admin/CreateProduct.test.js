import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import CreateProduct from "./CreateProduct";
import "@testing-library/jest-dom";

// Mock navigate hook
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock axios
jest.mock("axios");

// Mock toast
jest.mock("react-hot-toast")

// Mock Layout
jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

// URLs
const getCategoryURL = "/api/v1/category/get-category";
const createProductURL = "/api/v1/product/create-product";

// Mock categories
const mockCategoryName1 = "Category 1";
const mockCategoryName2 = "Category 2";
const mockCategory1 = { _id: "1", name: mockCategoryName1 };
const mockCategory2 = { _id: "2", name: mockCategoryName2 };
const mockCategories = [mockCategory1, mockCategory2];

// Mock product
const mockProductCategory = mockCategory1._id;
const mockProductPhoto = new File(["dummy content"], "example.png", { type: "image/png" });
const mockProductName = "Test Product";
const mockProductDescription = "Test description";
const mockProductPrice = "100";
const mockProductQuantity = "5";
const mockProductShipping = "1";
const mockProduct = new FormData();
mockProduct.append("category", mockProductCategory);
mockProduct.append("photo", mockProductPhoto);
mockProduct.append("name", mockProductName);
mockProduct.append("description", mockProductDescription);
mockProduct.append("price", mockProductPrice);
mockProduct.append("quantity", mockProductQuantity);
mockProduct.append("shipping", mockProductShipping);

// Mock AdminMenu
jest.mock("../../components/AdminMenu", () => () => <div>AdminMenuMock</div>);

describe("CreateProduct Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => "mocked-url");
  });

  test("renders components correctly", () => {
    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    expect(screen.getByText("AdminMenuMock")).toBeInTheDocument();
    expect(screen.getByText("Create Product")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create product/i })).toBeInTheDocument();
  });

  test("fetches and displays categories successfully", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    const select = screen.getByText("Select a category");
    fireEvent.mouseDown(select);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getCategoryURL);
      expect(screen.getByText(mockCategoryName1)).toBeInTheDocument();
      expect(screen.getByText(mockCategoryName2)).toBeInTheDocument();
    });
  });

  test("handles fetch categories unsuccessful", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: false, category: mockCategories },
    });

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    const select = screen.getByText("Select a category");
    fireEvent.mouseDown(select);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getCategoryURL);
      expect(screen.queryByText(mockCategoryName1)).not.toBeInTheDocument();
      expect(screen.queryByText(mockCategoryName2)).not.toBeInTheDocument();
    });
  });

  test("handles fetch categories error", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getCategoryURL);
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });
  
  test("all text fields are rquired", async () => {
    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    const submitButton = screen.getByRole("button", { name: /create product/i });
    const nameInput = screen.getByPlaceholderText("Write a name");
    const descriptionInput = screen.getByPlaceholderText("Write a description");
    const priceInput = screen.getByPlaceholderText("Write a price");
    const quantityInput = screen.getByPlaceholderText("Write a quantity");
    
    const fields = [nameInput, descriptionInput, priceInput, quantityInput];
    for (const field of fields) {
      fireEvent.change(nameInput, { target: { value: mockProductName },});
      fireEvent.change(descriptionInput, { target: { value: mockProductDescription },});
      fireEvent.change(priceInput, { target: { value: mockProductPrice },});
      fireEvent.change(quantityInput, { target: { value: mockProductQuantity },});
      
      fireEvent.change(field, { target: { value: "" } });

      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(axios.post).not.toHaveBeenCalled();
      });
    }
  });

  test.each([
    ["0.00", true],
    ["0.01", true],
    ["-0.01", false],
    ["12.345", false],
    ["abc", false],
  ])("price=%s should be valid=%s", (value, expected) => {
    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );
    const priceInput = screen.getByPlaceholderText("Write a price");
    fireEvent.change(priceInput, { target: { value } });
    expect(priceInput.validity.valid).toBe(expected);
  });

  test.each([
    ["0", true],
    ["1", true],
    ["-1", false],
    ["1.5", false],
    ["abc", false],
  ])("quantity=%s should be valid=%s", (value, expected) => {
    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );
    const quantityInput = screen.getByPlaceholderText("Write a quantity");
    fireEvent.change(quantityInput, { target: { value } });
    expect(quantityInput.validity.valid).toBe(expected);
  });

  test("uploads and clears photo successfully", () => {
    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    expect(screen.queryByAltText("product_photo")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /clear photo/i })).not.toBeInTheDocument();

    const fileInput = screen.getByLabelText(/upload photo/i);
    fireEvent.change(fileInput, {
      target: { files: [mockProductPhoto] },
    });

    expect(screen.getByAltText("product_photo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear photo/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /clear photo/i }));

    expect(screen.queryByAltText("product_photo")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /clear photo/i })).not.toBeInTheDocument();
  });
  test("creates product successfully", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });
    axios.post.mockResolvedValueOnce({ 
      data: { success: true, message: "Product created successfully" } 
    });

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Write a name"), {
      target: { value: mockProductName },
    });
    fireEvent.change(screen.getByPlaceholderText("Write a description"), {
      target: { value: mockProductDescription },
    });
    fireEvent.change(screen.getByPlaceholderText("Write a price"), {
      target: { value: mockProductPrice },
    });
    fireEvent.change(screen.getByPlaceholderText("Write a quantity"), {
      target: { value: mockProductQuantity },
    });

    const fileInput = screen.getByLabelText(/upload photo/i);
    fireEvent.change(fileInput, {
      target: { files: [mockProductPhoto] },
    });

    const categorySelect = screen.getByText("Select a category");
    fireEvent.mouseDown(categorySelect);
    await waitFor(() => {
      fireEvent.click(screen.getByText(mockCategoryName1));
    });

    const shippingSelect = screen.getByText("No");
    fireEvent.mouseDown(shippingSelect);
    fireEvent.click(screen.getByText("Yes"));

    fireEvent.click(screen.getByRole("button", { name: /create product/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        createProductURL,
        mockProduct 
      );
      expect(toast.success).toHaveBeenCalledWith("Product created successfully");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    });
  });

  test("handles create product unsuccessful", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });
    axios.post.mockResolvedValueOnce({
        data: { success: false, message: "Create failed" },
    });

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Write a name"), {
      target: { value: mockProductName },
    });
    fireEvent.change(screen.getByPlaceholderText("Write a description"), {
      target: { value: mockProductDescription },
    });
    fireEvent.change(screen.getByPlaceholderText("Write a price"), {
      target: { value: mockProductPrice },
    });
    fireEvent.change(screen.getByPlaceholderText("Write a quantity"), {
      target: { value: mockProductQuantity },
    });


    fireEvent.click(screen.getByRole("button", { name: /create product/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("Create failed");
    });
  });

  test("handles create product error", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });
    axios.post.mockRejectedValueOnce(new Error("Network error"));

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Write a name"), {
      target: { value: mockProductName },
    });
    fireEvent.change(screen.getByPlaceholderText("Write a description"), {
      target: { value: mockProductDescription },
    });
    fireEvent.change(screen.getByPlaceholderText("Write a price"), {
      target: { value: mockProductPrice },
    });
    fireEvent.change(screen.getByPlaceholderText("Write a quantity"), {
      target: { value: mockProductQuantity },
    });


    fireEvent.click(screen.getByRole("button", { name: /create product/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });
});
