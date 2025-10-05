import React from 'react';
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminMenu from "./AdminMenu";
import "@testing-library/jest-dom";

// AI Attribution: The following test code was generated with the assistance of AI (ChatGPT).

describe("AdminMenu Component", () => {
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
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", url);
    });
  });
});
