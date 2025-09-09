import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom"; 
import AdminDashboard from "./AdminDashboard";
import { useAuth } from "../../context/auth";
import "@testing-library/jest-dom";

// Mock useAuth
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

const mockUser = {
  name: "Mr Guy",
  email: "guy@gmail.com",
  phone: "98765432",
};

// Mock Layout 
jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

// Mock AdminMenu
jest.mock("../../components/AdminMenu", () => () => <div>AdminMenuMock</div>);

describe("Admin Dashboard Component", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders AdminMenu", () => {
    useAuth.mockReturnValue([{ user: mockUser }]);
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText("AdminMenuMock")).toBeInTheDocument();
  });

  test("renders admin info correctly", () => {
    useAuth.mockReturnValue([{ user: mockUser }]);
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(`Admin Name : ${mockUser.name}`)).toBeInTheDocument();
    expect(screen.getByText(`Admin Email : ${mockUser.email}`)).toBeInTheDocument();
    expect(screen.getByText(`Admin Contact : ${mockUser.phone}`)).toBeInTheDocument();
  });

  test("handles missing auth object gracefully", () => {
    useAuth.mockReturnValue([null]);
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText("Admin Name :")).toBeInTheDocument();
    expect(screen.getByText("Admin Email :")).toBeInTheDocument();
    expect(screen.getByText("Admin Contact :")).toBeInTheDocument();
  });

  test("handles missing user object gracefully", () => {
    useAuth.mockReturnValue([{}]);
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText("Admin Name :")).toBeInTheDocument();
    expect(screen.getByText("Admin Email :")).toBeInTheDocument();
    expect(screen.getByText("Admin Contact :")).toBeInTheDocument();
  });
});
