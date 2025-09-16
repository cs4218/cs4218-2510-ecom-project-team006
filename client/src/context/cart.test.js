import { act, renderHook } from "@testing-library/react";
import { useCart, CartProvider } from "./cart";

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

describe("CartProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("initializes with an empty array when localStorage is empty", () => {
    // getItem defaults to undefined
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
    expect(result.current[0]).toEqual([]);
    expect(localStorage.getItem).toHaveBeenCalledWith("cart");
  });

  it("loads initial cart from localStorage", () => {
    const mockCart = [{ id: 1, name: "Alpha", price: 10 }];
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(mockCart));

    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    expect(localStorage.getItem).toHaveBeenCalledWith("cart");
    expect(result.current[0]).toEqual(mockCart);
  });

  it("updates cart by appending new items", () => {
    const initial = [{ id: 1, name: "Alpha", price: 10 }];
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(initial));

    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    expect(result.current[0]).toEqual(initial);

    const extra = [{ id: 2, name: "Bravo", price: 20 }];
    act(() => {
      result.current[1]([...result.current[0], ...extra]);
    });

    expect(result.current[0]).toEqual([
      { id: 1, name: "Alpha", price: 10 },
      { id: 2, name: "Bravo", price: 20 },
    ]);
  });

  it("supports functional updates that remove an item", () => {
    const initial = [
      { id: 1, name: "Alpha", price: 10 },
      { id: 2, name: "Bravo", price: 20 },
      { id: 3, name: "Charlie", price: 30 },
    ];
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(initial));

    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    act(() => {
      // remove item with id 2
      result.current[1]((prev) => prev.filter((x) => x.id !== 2));
    });

    expect(result.current[0]).toEqual([
      { id: 1, name: "Alpha", price: 10 },
      { id: 3, name: "Charlie", price: 30 },
    ]);
  });

  it("does not persist updates to localStorage in this provider version", () => {
    // This provider only reads from localStorage on mount
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    act(() => {
      result.current[1]([{ id: 99, name: "Zeta", price: 999 }]);
    });

    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
});
