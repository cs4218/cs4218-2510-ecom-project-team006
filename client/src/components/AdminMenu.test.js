import React from 'react';
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminMenu from "./AdminMenu";
import "@testing-library/jest-dom";

describe("Admin Menu Component", () => {
  test("renders the heading label", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });

  test("renders all labels and links correctly", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    const links = [
      { label: "Create Category", url: "/dashboard/admin/create-category" },
      { label: "Create Product", url: "/dashboard/admin/create-product" },
      { label: "Products", url: "/dashboard/admin/products" },
      { label: "Orders", url: "/dashboard/admin/orders" },
      { label: "Users", url: "/dashboard/admin/users" },
    ];

    links.forEach(({ label, url }) => {
      expect(screen.getByText(label)).toBeInTheDocument();

      const link = screen.getByRole("link", { name: label });
      expect(link).toHaveAttribute("href", url);
    });
  });
});
