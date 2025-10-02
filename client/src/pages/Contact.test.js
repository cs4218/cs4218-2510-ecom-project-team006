import React from "react";
import Contact from "./Contact";
import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';

jest.mock("react-icons/bi", () => {
  return {
    BiMailSend: () => <span data-testid="icon-mail" />,
    BiPhoneCall: () => <span data-testid="icon-phone" />,
    BiSupport: () => <span data-testid="icon-support" />,
  };
});

jest.mock("./../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" title={title}>
    {children}
  </div>
));

describe("Contact Component", () => {
  it("renders Layout with correct title", () => {
    render( <Contact />);
    const layout = screen.getByTestId("layout");
    expect(layout).toBeInTheDocument();
    expect(layout).toHaveAttribute("title", "Contact us");
  });

  it("renders contactus image", () => {
    render(<Contact />);
    const img = screen.getByAltText("contactus");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/contactus.jpeg");
  });

  it("renders CONTACT US heading", () => {
    render(<Contact />);
    expect(screen.getByRole("heading", { 
      level: 1, 
      name: /CONTACT US/i 
    })).toBeInTheDocument();
  });

  it("renders contact information", () => {
    render(<Contact />);

    expect(
      screen.getByText(/www\.help@ecommerceapp\.com/i)
    ).toBeInTheDocument();

    expect(screen.getByText(/012-3456789/i)).toBeInTheDocument();

    expect(screen.getByText(/1800-0000-0000/i)).toBeInTheDocument();
  });
});