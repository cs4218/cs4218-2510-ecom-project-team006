import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Users from "./Users";
import axios from "axios";
import toast from "react-hot-toast"; 
import "@testing-library/jest-dom";

// AI Attribution: The following test code was generated with the assistance of AI (ChatGPT).

// Mock axios
jest.mock("axios");

// Mock toast
jest.mock("react-hot-toast");

// Mock useAuth
jest.mock("../../context/auth", () => ({
  useAuth: () => [null],
}));

// Mock Layout
jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

// Mock AdminMenu
jest.mock("../../components/AdminMenu", () => () => <div>AdminMenuMock</div>);

// URLs
const getUsersUrl = "/api/v1/auth/all-users";

const mockUsers = [
  {
    name: "Mr Guy",
    email: "guy@gmail.com",
    phone: "12345678",
    address: "123 Main St"
  },
  {
    name: "Mr Guy 2",
    email: "guy2@gmail.com",
    phone: "87654321",
    address: "456 Side St"
  }
]

describe("Users Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders component correctly", () => {
    render(<Users />);

    expect(screen.getByText("AdminMenuMock")).toBeInTheDocument();
    expect(screen.getByText("All Users")).toBeInTheDocument(); 
    expect(screen.getByText("#")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Phone")).toBeInTheDocument();
    expect(screen.getByText("Address")).toBeInTheDocument();
  });

  test("fetches and displays users successfully", async () => {
    axios.get.mockResolvedValue({ data: { success: true, users: mockUsers } });

    render(<Users />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getUsersUrl);

      mockUsers.forEach((u, i) => {
        expect(screen.getByText(i + 1)).toBeInTheDocument();
        expect(screen.getByText(u.name)).toBeInTheDocument();
        expect(screen.getByText(u.email)).toBeInTheDocument();
        expect(screen.getByText(u.phone)).toBeInTheDocument();
        expect(screen.getByText(u.address)).toBeInTheDocument();
      });
    });
  });

  test("handles fetch users failure", async () => {
    axios.get.mockResolvedValue({ data: { success: false } });

    render(<Users />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getUsersUrl);
      expect(screen.queryByText(mockUsers[0].name)).not.toBeInTheDocument();
      expect(screen.queryByText(mockUsers[1].name)).not.toBeInTheDocument();
    });
  });

  test("handles fetch users error", async () => {
    axios.get.mockRejectedValue(new Error("Network Error"));

    render(<Users />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(getUsersUrl);
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      expect(screen.queryByText(mockUsers[0].name)).not.toBeInTheDocument();
      expect(screen.queryByText(mockUsers[1].name)).not.toBeInTheDocument();
    });
  });
});
