import React from "react";
import Policy from "./Policy";
import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';

jest.mock("./../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" title={title}>
    {children}
  </div>
));

describe("Policy Component", () => {
  it("renders Layout with correct title", () => {
    render( <Policy />);
    const layout = screen.getByTestId("layout");
    expect(layout).toBeInTheDocument();
    expect(layout).toHaveAttribute("title", "Privacy Policy");
  });

  it("renders contactus image", () => {
    render(<Policy />);
    const img = screen.getByAltText("contactus");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/contactus.jpeg");
  });

  it("renders privary policies", () => {
    render(<Policy />);
    expect(screen.getAllByText(/privacy policy/i).length).toBeGreaterThan(0);
  });
});