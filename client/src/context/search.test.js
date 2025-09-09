import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SearchProvider, useSearch } from "./search";

// A demo component to interact with context
const DemoComponent = () => {
  const [state, updateSearch] = useSearch();

  const runQuery = () => {
    updateSearch({ ...state, keyword: "sample-key", results: ["item1"] });
  };

  const resetQuery = () => {
    updateSearch({ ...state, keyword: "", results: [] });
  };

  return (
    <div>
      <span data-testid="keyword">{state.keyword}</span>
      <span data-testid="results-length">{state.results.length}</span>
      {state.results.length > 0 ? (
        <span data-testid="status-has-results">Found Results</span>
      ) : (
        <span data-testid="status-empty">No Matches</span>
      )}
      <button onClick={runQuery} data-testid="btn-run">
        Search
      </button>
      <button onClick={resetQuery} data-testid="btn-reset">
        Clear
      </button>
    </div>
  );
};

describe("Search context behaviour", () => {
  test("starts with blank keyword and no results", () => {
    render(
      <SearchProvider>
        <DemoComponent />
      </SearchProvider>
    );

    expect(screen.getByTestId("keyword")).toHaveTextContent("");
    expect(screen.getByTestId("results-length")).toHaveTextContent("0");
    expect(screen.getByTestId("status-empty")).toBeInTheDocument();
  });

  test("updates state when a search is triggered", () => {
    render(
      <SearchProvider>
        <DemoComponent />
      </SearchProvider>
    );

    fireEvent.click(screen.getByTestId("btn-run"));

    expect(screen.getByTestId("keyword")).toHaveTextContent("sample-key");
    expect(screen.getByTestId("results-length")).toHaveTextContent("1");
    expect(screen.getByTestId("status-has-results")).toBeInTheDocument();
  });

  test("resets state when clear is clicked", () => {
    render(
      <SearchProvider>
        <DemoComponent />
      </SearchProvider>
    );

    fireEvent.click(screen.getByTestId("btn-run"));
    expect(screen.getByTestId("keyword")).toHaveTextContent("sample-key");

    fireEvent.click(screen.getByTestId("btn-reset"));
    expect(screen.getByTestId("keyword")).toHaveTextContent("");
    expect(screen.getByTestId("results-length")).toHaveTextContent("0");
    expect(screen.getByTestId("status-empty")).toBeInTheDocument();
  });
});
