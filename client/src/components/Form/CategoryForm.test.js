import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CategoryForm from "./CategoryForm";
import "@testing-library/jest-dom";

const handleSubmitMock = jest.fn((e) => e.preventDefault());
const setValueMock = jest.fn();
const mockValue1 = "Category 1";
const mockValue2 = "Category 2";

const inputPlaceholderText = "Enter new category";

describe("CategoryForm component", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders correct label and value", () => {
    render(<CategoryForm handleSubmit={handleSubmitMock} value={mockValue1} setValue={setValueMock} />);
    
    const input = screen.getByPlaceholderText(inputPlaceholderText);
    expect(input).toBeInTheDocument();
    expect(input.value).toBe(mockValue1);
  });

  test("calls setValue on input change", () => {
    render(<CategoryForm handleSubmit={handleSubmitMock} value={mockValue1} setValue={setValueMock} />);
    
    const input = screen.getByPlaceholderText(inputPlaceholderText);
    fireEvent.change(input, { target: { value: mockValue2} });
    
    expect(setValueMock).toHaveBeenCalledWith(mockValue2);
  });

  test("calls handleSubmit on form submit", () => {
    render(<CategoryForm handleSubmit={handleSubmitMock} value={mockValue1} setValue={setValueMock} />);
    
    fireEvent.click(screen.getByText("Submit"));
    
    expect(handleSubmitMock).toHaveBeenCalled();
  });

  test("does not call handleSubmit if input is empty", () => {
    render(<CategoryForm handleSubmit={handleSubmitMock} value={""} setValue={setValueMock} />);
    
    fireEvent.click(screen.getByText("Submit"));
    
    expect(handleSubmitMock).not.toHaveBeenCalled();
  });
});
