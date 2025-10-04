import React from "react";
import { render, fireEvent, screen, waitFor, within } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import moment from "moment";
import AdminOrders from "./AdminOrders";
import "@testing-library/jest-dom";

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
const getOrdersUrl = "/api/v1/auth/all-orders";
const updateOrderStatusUrl = (orderId) => `/api/v1/auth/order-status/${orderId}`;

const mockOrders = [
  {
    _id: "order1",
    status: "Processing",
    buyer: { name: "Mr Guy" },
    createdAt: "2025-10-04T11:30:00.000Z",  
    payment: { success: true },
    products: [
      {
        _id: "p1",
        name: "Product 1",
        description: "Desc 1",
        price: 100,
      },
      {
        _id: "p2",
        name: "Product 2",
        description: "Desc 2",
        price: 200,
      },
    ],
  },
  {
    _id: "order2",
    status: "Shipped",
    buyer: { name: "Mr Guy 2" },
    createdAt: "2024-12-15T18:45:00.000Z",
    payment: { success: false },
    products: [
      {
        _id: "p3",
        name: "Product 3",
        description: "A very very long description to test truncation in the UI.",
        price: 300,
      },
    ],
  },
];

describe("AdminOrders Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders components correctly", () => {
    render(<AdminOrders />);

    expect(screen.getByText("AdminMenuMock")).toBeInTheDocument();
    expect(screen.getByText("All Orders")).toBeInTheDocument();
  });

  test("fetches and displays orders successfully", async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(<AdminOrders />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getOrdersUrl);

      expect(screen.getAllByText("#")).toHaveLength(2);
      expect(screen.getAllByText("1")).toHaveLength(2); // because of quantity column
      expect(screen.getAllByText("2")).toHaveLength(2); // because of quantity column

      expect(screen.getAllByText("Status")).toHaveLength(2);
      expect(screen.getByText(mockOrders[0].status)).toBeInTheDocument();
      expect(screen.getByText(mockOrders[1].status)).toBeInTheDocument();

      expect(screen.getAllByText("Buyer")).toHaveLength(2);
      expect(screen.getByText(mockOrders[0].buyer.name)).toBeInTheDocument(); 
      expect(screen.getByText(mockOrders[1].buyer.name)).toBeInTheDocument();

      expect(screen.getAllByText("Date")).toHaveLength(2);
      expect(screen.getByText(moment(mockOrders[0].createdAt).fromNow())).toBeInTheDocument();
      expect(screen.getByText(moment(mockOrders[1].createdAt).fromNow())).toBeInTheDocument();

      expect(screen.getAllByText("Payment")).toHaveLength(2);
      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(screen.getByText("Failed")).toBeInTheDocument();

      expect(screen.getAllByText("Quantity")).toHaveLength(2);

      expect(screen.getByText(mockOrders[0].products[0].name)).toBeInTheDocument();
      expect(screen.getByText(mockOrders[0].products[1].name)).toBeInTheDocument();
      expect(screen.getByText(mockOrders[1].products[0].name)).toBeInTheDocument();

      expect(screen.getByText(mockOrders[0].products[0].description)).toBeInTheDocument();
      expect(screen.getByText(mockOrders[0].products[1].description)).toBeInTheDocument();
      expect(screen.getByText(mockOrders[1].products[0].description.substring(0,30))).toBeInTheDocument(); 

      expect(screen.getByText(`Price : ${mockOrders[0].products[0].price}`)).toBeInTheDocument();
      expect(screen.getByText(`Price : ${mockOrders[0].products[1].price}`)).toBeInTheDocument();
      expect(screen.getByText(`Price : ${mockOrders[1].products[0].price}`)).toBeInTheDocument();

      const imgs = screen.getAllByRole("img");
      expect(imgs).toHaveLength(3);
      imgs.forEach((img, i) => {
        expect(img).toHaveAttribute("src", `/api/v1/product/product-photo/p${i+1}`);
      });
    });
  });

  test("handles fetch orders error", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    render(<AdminOrders />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getOrdersUrl)
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  test("updates order status successfully", async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText(mockOrders[0].status)).toBeInTheDocument();
    });

    const select = screen.getByText(mockOrders[0].status); 
    fireEvent.mouseDown(select); 
    expect(screen.getAllByText("Not Processed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Delivered").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cancel").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("Delivered"));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        updateOrderStatusUrl(mockOrders[0]._id),
        { status: "Delivered" }
      );
      expect(toast.success).toHaveBeenCalledWith("Order status updated");
    });
  });

  test("handles order status update error", async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockRejectedValueOnce(new Error("Network error"));

    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText(mockOrders[0].status)).toBeInTheDocument();
    });

    const select = screen.getByText(mockOrders[0].status);
    fireEvent.mouseDown(select);
    fireEvent.click(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        updateOrderStatusUrl(mockOrders[0]._id),
        { status: "Cancel" }
      );
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

});
