import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import UpdateProduct from "./UpdateProduct";
import "@testing-library/jest-dom";

// Mock navigate hook
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({ slug: "test-slug" }),
}));

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
const getCategoryURL = "/api/v1/category/get-category";
const getProductURL = (slug) => `/api/v1/product/get-product/${slug}`;
const getProductPhotoURL = (id) => `/api/v1/product/product-photo/${id}`;
const updateProductURL = (id) => `/api/v1/product/update-product/${id}`;
const deleteProductURL = (id) => `/api/v1/product/delete-product/${id}`;

// Mock categories
const mockCategoryName1 = "Category 1";
const mockCategoryName2 = "Category 2";
const mockCategory1 = { _id: "1", name: mockCategoryName1 };
const mockCategory2 = { _id: "2", name: mockCategoryName2 };
const mockCategories = [mockCategory1, mockCategory2];

// Mock product
const mockProductCategory = { _id: mockCategory1._id };
const mockProductName = "Test Product";
const mockProductDescription = "Test description";
const mockProductPrice = "100";
const mockProductQuantity = "5";
const mockProductShipping = true;
const mockProductID = "123";
const mockProduct = {
  _id: mockProductID,
  category: mockProductCategory,
  name: mockProductName,
  description: mockProductDescription,
  price: mockProductPrice,
  quantity: mockProductQuantity,
  shipping: mockProductShipping,
};
const mockProductFormData = new FormData();
mockProductFormData.append("category", mockProductCategory._id);
mockProductFormData.append("name", mockProductName);
mockProductFormData.append("description", mockProductDescription);
mockProductFormData.append("price", mockProductPrice);
mockProductFormData.append("quantity", mockProductQuantity);
mockProductFormData.append("shipping", mockProductShipping);

const updatedProductCategory = { _id: mockCategory2._id };
const updatedProductPhoto = new File(["new content"], "new-example.png", { type: "image/png" });
const updatedProductName = "Updated Product"; 
const updatedProductDescription = "Updated description";
const updatedProductPrice = "150";
const updatedProductQuantity = "10";
const updatedProductShipping = false;
const updatedProduct = new FormData();
updatedProduct.append("category", updatedProductCategory._id);
updatedProduct.append("photo", updatedProductPhoto);
updatedProduct.append("name", updatedProductName);
updatedProduct.append("description", updatedProductDescription);
updatedProduct.append("price", updatedProductPrice);
updatedProduct.append("quantity", updatedProductQuantity);
updatedProduct.append("shipping", updatedProductShipping);
console.log(updatedProduct, "UPDATED PRODUCT")

describe("UpdateProduct Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => "mocked-url");
  });

  test("renders components correctly", () => {
    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    expect(screen.getByText("AdminMenuMock")).toBeInTheDocument();
    expect(screen.getByText("Update Product")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update product/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete product/i })).toBeInTheDocument();
  });

  test("fetches product with photo & categories", async () => {
    axios.get.mockImplementation((url) => {
      if (url === getProductURL("test-slug")) {
        return Promise.resolve({ data: { success: true, product: mockProduct } });
      } else if (url === getCategoryURL) {
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      }
    });

    axios.head.mockResolvedValue({ status: 200 });

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getProductURL("test-slug"));
      expect(screen.getByDisplayValue(mockProductName)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockProductDescription)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockProductPrice)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockProductQuantity)).toBeInTheDocument();
      expect(screen.getByText("Yes")).toBeInTheDocument();

      expect(axios.head).toHaveBeenCalledWith(getProductPhotoURL(mockProductID));
      expect(screen.getByAltText("original_product_photo")).toHaveAttribute(
        "src", getProductPhotoURL(mockProductID));
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getCategoryURL);
      expect(screen.getByText(mockCategoryName1)).toBeInTheDocument();
    });

    const select = screen.getByText(mockCategoryName1);
    fireEvent.mouseDown(select);
    expect(screen.getByText(mockCategoryName2)).toBeInTheDocument();
  });

  test("fetches product with photo not found", async () => {
    axios.get.mockImplementation((url) => {
      if (url === getProductURL("test-slug")) {
        return Promise.resolve({ data: { success: true, product: mockProduct } });
      } else if (url === getCategoryURL) {
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      }
    });

    axios.head.mockResolvedValue({ status: 404 });

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.head).toHaveBeenCalledWith(getProductPhotoURL(mockProductID));
      expect(screen.queryByAltText("original_product_photo")).not.toBeInTheDocument();
      expect(screen.getByText("Upload Photo")).toBeInTheDocument(); 
    });
  });

  test("fetches product with photo error", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-product/")) {
        return Promise.resolve({ data: { success: true, product: mockProduct } });
      }  
      if (url.includes("/get-category")) {
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      }
    });

    axios.head.mockRejectedValueOnce(new Error("Network Error"));

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.head).toHaveBeenCalledWith(getProductPhotoURL(mockProductID));
      expect(screen.queryByAltText("original_product_photo")).not.toBeInTheDocument();
      expect(screen.getByText("Upload Photo")).toBeInTheDocument(); 
    });
  });

  test("handles fetch product unsuccessful", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-product/")) {
        return Promise.resolve({ data: { success: false } });
      }
      if (url.includes("/get-category")) {
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      }
    });

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getProductURL("test-slug"));
      expect(screen.queryByDisplayValue(mockProductName)).not.toBeInTheDocument();
    });
  });

  test("handles fetch product error", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-product/")) {
        return Promise.reject(new Error("Network Error"));
      }
      if (url.includes("/get-category")) {
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      }
    });

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getProductURL("test-slug"));
      expect(screen.queryByDisplayValue(mockProductName)).not.toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  test("handles fetch categories unsuccessful", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-product/")) {
        return Promise.resolve({ data: { success: true, product: mockProduct } });
      }
      if (url.includes("/get-category")) {
        return Promise.resolve({ data: { success: false } });
      }
    });

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getCategoryURL);
      expect(screen.queryByText(mockCategoryName1)).not.toBeInTheDocument();
    });
  });

  test("handles fetch categories error", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-product/")) {
        return Promise.resolve({ data: { success: true, product: mockProduct } });
      }
      if (url.includes("/get-category")) {
        return Promise.reject(new Error("Network Error"));
      }
    });

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getCategoryURL);
      expect(screen.queryByText(mockCategoryName1)).not.toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  test("all text fields are rquired", async () => {
    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.head).toHaveBeenCalledWith(getProductPhotoURL(mockProductID));
    });

    const submitButton = screen.getByRole("button", { name: /update product/i });
    const nameInput = screen.getByPlaceholderText("Write a name");
    const descriptionInput = screen.getByPlaceholderText("Write a description");
    const priceInput = screen.getByPlaceholderText("Write a price");
    const quantityInput = screen.getByPlaceholderText("Write a quantity");
    
    const fields = [nameInput, descriptionInput, priceInput, quantityInput];
    for (const field of fields) {
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
  ])("price=%s should be valid=%s", async (value, expected) => {
    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.head).toHaveBeenCalledWith(getProductPhotoURL(mockProductID));
    });

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
  ])("quantity=%s should be valid=%s", async (value, expected) => {
    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.head).toHaveBeenCalledWith(getProductPhotoURL(mockProductID));
    });

    const quantityInput = screen.getByPlaceholderText("Write a quantity");
    fireEvent.change(quantityInput, { target: { value } });
    expect(quantityInput.validity.valid).toBe(expected);
  });

  test("uploads and clears photo successfully", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-product/")) {
        return Promise.resolve({ data: { success: true, product: mockProduct } });
      } else if (url.includes("/get-category")) {
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      }
    });
    axios.head.mockResolvedValue({ status: 200 }); 

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.head).toHaveBeenCalledWith(getProductPhotoURL(mockProductID));
    });

    expect(screen.getByAltText("original_product_photo")).toBeInTheDocument();
    expect(screen.queryByAltText("product_photo")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /clear photo/i })).not.toBeInTheDocument();

    const fileInput = screen.getByLabelText(/upload photo/i);
    fireEvent.change(fileInput, {
      target: { files: [updatedProductPhoto] },
    });

    expect(screen.queryByAltText("original_product_photo")).not.toBeInTheDocument();
    expect(screen.getByAltText("product_photo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear photo/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /clear photo/i }));

    await waitFor(() => {
      expect(screen.getByAltText("original_product_photo")).toBeInTheDocument();
      expect(screen.queryByAltText("product_photo")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /clear photo/i })).not.toBeInTheDocument();
    });
  });

  test("updates product successfully", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-product/")) {
        return Promise.resolve({ data: { success: true, product: mockProduct } });
      } else if (url.includes("/get-category")) {
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      }
    });
    axios.head.mockResolvedValue({ status: 200 }); 

    axios.put.mockResolvedValue({ data: { success: true, message: "Product updated successfully" } });

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getProductURL("test-slug"));
      expect(axios.head).toHaveBeenCalledWith(getProductPhotoURL(mockProductID));
      expect(axios.get).toHaveBeenCalledWith(getCategoryURL);
    });

    fireEvent.change(screen.getByPlaceholderText("Write a name"), {
      target: { value: updatedProductName },
    });
    fireEvent.change(screen.getByPlaceholderText("Write a description"), {
      target: { value: updatedProductDescription },
    });
    fireEvent.change(screen.getByPlaceholderText("Write a price"), {
      target: { value: updatedProductPrice },
    });
    fireEvent.change(screen.getByPlaceholderText("Write a quantity"), {
      target: { value: updatedProductQuantity },
    });

    const fileInput = screen.getByLabelText(/upload photo/i);
    fireEvent.change(fileInput, {
      target: { files: [updatedProductPhoto] },
    });

    const categorySelect = screen.getByText(mockCategoryName1);
    fireEvent.mouseDown(categorySelect);
    await waitFor(() => {
      fireEvent.click(screen.getByText(mockCategoryName2));
    });

    const shippingSelect = screen.getByText("Yes");
    fireEvent.mouseDown(shippingSelect);
    await waitFor(() => {
      fireEvent.click(screen.getByText("No"));
    });

    fireEvent.click(screen.getByRole("button", { name: /update product/i }));

    await waitFor(() => {
       expect(axios.put).toHaveBeenCalledWith(
        updateProductURL(mockProductID),
        updatedProduct 
      );
      expect(toast.success).toHaveBeenCalledWith("Product updated successfully");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    });
  });

  test("handles update product unsuccessful", async () => {
   axios.get.mockImplementation((url) => {
      if (url.includes("/get-product/")) {
        return Promise.resolve({ data: { success: true, product: mockProduct } });
      } else if (url.includes("/get-category")) {
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      }
    });
    axios.head.mockResolvedValue({ status: 200 }); 

    axios.put.mockResolvedValueOnce({ data: { success: false, message: "Update failed" } });

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getProductURL("test-slug"));
      expect(axios.head).toHaveBeenCalledWith(getProductPhotoURL(mockProductID));
      expect(axios.get).toHaveBeenCalledWith(getCategoryURL);
    });

    fireEvent.click(screen.getByRole("button", { name: /update product/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        updateProductURL(mockProductID),
        mockProductFormData
      );
      expect(toast.error).toHaveBeenCalledWith("Update failed");
    });
  });

  test("handles update product error", async () => {
   axios.get.mockImplementation((url) => {
      if (url.includes("/get-product/")) {
        return Promise.resolve({ data: { success: true, product: mockProduct } });
      } else if (url.includes("/get-category")) {
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      }
    });
    axios.head.mockResolvedValue({ status: 200 }); 

    axios.put.mockRejectedValueOnce(new Error("Network Error"));

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getProductURL("test-slug"));
      expect(axios.head).toHaveBeenCalledWith(getProductPhotoURL(mockProductID));
      expect(axios.get).toHaveBeenCalledWith(getCategoryURL);
    });

    fireEvent.click(screen.getByRole("button", { name: /update product/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        updateProductURL(mockProductID),
        mockProductFormData
      );
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  test("handles delete cancellation", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /delete product/i }));

    await waitFor(() => {
      expect(axios.delete).not.toHaveBeenCalled();
    });
  });

  test("deletes product successfully", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-product/")) {
        return Promise.resolve({ data: { success: true, product: mockProduct } });
      } else if (url.includes("/get-category")) {
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      }
    });
    axios.head.mockResolvedValue({ status: 200 }); 
    axios.delete.mockResolvedValue({ data: { success: true, message: "Deleted product successfully" } });

    jest.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByDisplayValue(mockProduct.name));

    fireEvent.click(screen.getByRole("button", { name: /delete product/i }));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(deleteProductURL(mockProduct._id));
      expect(toast.success).toHaveBeenCalledWith("Deleted product successfully");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    });
  });

  test("handles delete product error", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-product/")) {
        return Promise.resolve({ data: { success: true, product: mockProduct } });
      } else if (url.includes("/get-category")) {
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      }
    });
    axios.head.mockResolvedValue({ status: 200 }); 
    axios.delete.mockResolvedValue({ data: { success: false, message: "Delete failed" } });

    jest.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByDisplayValue(mockProduct.name));

    fireEvent.click(screen.getByRole("button", { name: /delete product/i }));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(deleteProductURL(mockProduct._id));
      expect(toast.error).toHaveBeenCalledWith("Delete failed");
    });
  });

  test("handles delete product error", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-product/")) {
        return Promise.resolve({ data: { success: true, product: mockProduct } });
      } else if (url.includes("/get-category")) {
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      }
    });
    axios.head.mockResolvedValue({ status: 200 }); 
    axios.delete.mockRejectedValueOnce(new Error("Network Error"));

    jest.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByDisplayValue(mockProduct.name));

    fireEvent.click(screen.getByRole("button", { name: /delete product/i }));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(deleteProductURL(mockProduct._id));
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });
});
