import React from "react";
import { render, fireEvent, screen, waitFor, within } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import CreateCategory from "./CreateCategory";
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
const getCategoryURL = "/api/v1/category/get-category";
const createCategoryURL = "/api/v1/category/create-category";
const updateCategoryURL = (id) => `/api/v1/category/update-category/${id}`;
const deleteCategoryURL = (id) => `/api/v1/category/delete-category/${id}`;

// Mock categories
const mockCategoryName1 = "Category 1";
const mockCategoryName2 = "Category 2";
const mockCategory1 = { _id: "1", name: mockCategoryName1 };
const mockCategory2 = { _id: "2", name: mockCategoryName2 };
const mockCategories = [mockCategory1, mockCategory2];

describe("CreateCategory Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders components correctly", () => {
    render(<CreateCategory />);
    expect(screen.getByText("AdminMenuMock")).toBeInTheDocument();
    expect(screen.getByText("Manage Category")).toBeInTheDocument();
  });

  test("fetches and displays categories successfully", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(<CreateCategory />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getCategoryURL);
      expect(screen.getByText(mockCategoryName1)).toBeInTheDocument();
      expect(screen.getByText(mockCategoryName2)).toBeInTheDocument();
      expect(screen.getAllByText("Edit").length).toBe(2);
      expect(screen.getAllByText("Delete").length).toBe(2);
    });
  });

  test("handles fetch categories unsuccessful", async () => {
    axios.get.mockResolvedValueOnce({ data: { success: false}});

    render(<CreateCategory />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getCategoryURL);
      expect(screen.queryByText(mockCategoryName1)).not.toBeInTheDocument();
      expect(screen.queryByText(mockCategoryName2)).not.toBeInTheDocument();
    });
  });

  test("handles fetch categories error", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    render(<CreateCategory />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getCategoryURL);
      expect(screen.queryByText(mockCategoryName1)).not.toBeInTheDocument();
      expect(screen.queryByText(mockCategoryName2)).not.toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  test("creates and displays category successfully", async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.post.mockResolvedValueOnce({ data: { success: true, message: "Category created successfully" }});
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [mockCategory1] } });

    render(<CreateCategory />);

    fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
      target: { value: mockCategoryName1 },
    });
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(createCategoryURL, {
        name: mockCategoryName1,
      });
      expect(toast.success).toHaveBeenCalledWith("Category created successfully");
      expect(screen.getByText(mockCategoryName1)).toBeInTheDocument();
    });
  });
  
  test("handles create category unsuccessful", async () => {
    axios.post.mockResolvedValueOnce({
        data: { success: false, message: "Create failed" },
    });

    render(<CreateCategory />);

    fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
      target: { value: mockCategoryName1 },
    });
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Create failed");
    });
 });

  test("handles create category error", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network error"));

    render(<CreateCategory />);

    fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
      target: { value: mockCategoryName1 },
    });
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  test("deletes category successfully", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [mockCategory1] } });
    axios.delete.mockResolvedValueOnce({ data: { success: true, message: "Category deleted successfully"} });
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } }); 

    render(<CreateCategory />);

    await waitFor(() => {
      expect(screen.getByText(mockCategory1.name)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete"));

    // Assert
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(deleteCategoryURL(mockCategory1._id));
      expect(toast.success).toHaveBeenCalledWith("Category deleted successfully");
      expect(screen.queryByText(mockCategory1.name)).not.toBeInTheDocument();
    });
  });

  test("handles delete category unsuccessful", async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [mockCategory1] } });
    axios.delete.mockResolvedValueOnce({ data: { success: false, message: "Delete failed" } });

    render(<CreateCategory />);

    await waitFor(() => {
      expect(screen.getByText(mockCategory1.name)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Delete failed");
    });
  });

  test("handles delete category error", async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [mockCategory1] } });
    axios.delete.mockRejectedValueOnce(new Error("Network error"));

    render(<CreateCategory />);

    await waitFor(() => {
      expect(screen.getByText(mockCategory1.name)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  test("opening and closing of update modal", async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [mockCategory1] } });

    render(<CreateCategory />);

    await waitFor(() => {
        expect(screen.getByText(mockCategory1.name)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Edit"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Close"));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("updates category successfully", async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [mockCategory1] } })
    axios.put.mockResolvedValueOnce({ data: { success: true, message: "Category updated successfully" } });
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [ { ...mockCategory1, name: mockCategoryName2 } ] } });

    render(<CreateCategory />);

    await waitFor(() => {
        expect(screen.getByText(mockCategory1.name)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Edit"));

    const modal = screen.getByRole("dialog"); 
    fireEvent.change(within(modal).getByPlaceholderText("Enter new category"), {
      target: { value: mockCategoryName2 },
    });
    fireEvent.click(within(modal).getByText("Submit"));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        updateCategoryURL(mockCategory1._id),
        { name: mockCategoryName2 }
      );
      expect(toast.success).toHaveBeenCalledWith("Category updated successfully");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.queryByText(mockCategory1.name)).not.toBeInTheDocument();
      expect(screen.getByText(mockCategoryName2)).toBeInTheDocument();
    });
  });

  test("handles update category unsuccessful", async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [mockCategory1] } });
    axios.put.mockResolvedValueOnce({ data: { success: false, message: "Update failed" } });

    render(<CreateCategory />);

    await waitFor(() => {
        expect(screen.getByText(mockCategory1.name)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Edit"));

    const modal = screen.getByRole("dialog"); 
    fireEvent.change(within(modal).getByPlaceholderText("Enter new category"), {
      target: { value: mockCategoryName2 },
    });
    fireEvent.click(within(modal).getByText("Submit"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Update failed");
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  test("handles update category error", async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [mockCategory1] } });
    axios.put.mockRejectedValueOnce(new Error("Network error"));
    render(<CreateCategory />);

    await waitFor(() => {
        expect(screen.getByText(mockCategory1.name)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Edit"));

    const modal = screen.getByRole("dialog"); 
    fireEvent.change(within(modal).getByPlaceholderText("Enter new category"), {
      target: { value: mockCategoryName2 },
    });
    fireEvent.click(within(modal).getByText("Submit"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

});
