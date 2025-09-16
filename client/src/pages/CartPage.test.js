// client/src/pages/CartPage.techniques.test.js
import React from "react";
import { render, waitFor, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import CartPage from "./CartPage";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import axios from "axios";
import toast from "react-hot-toast";
import DropIn from "braintree-web-drop-in-react";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("../hooks/useCategory", () => jest.fn(() => []));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("braintree-web-drop-in-react", () => ({
  __esModule: true,
  default: jest.fn((props) => <div data-testid="dropin">dropin</div>),
}));

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

const authedWithAddress = [
  { token: "t", user: { name: "Ivy", email: "ivy@example.com", address: "123 Main" } },
  jest.fn(),
];
const authedNoAddress = [
  { token: "t", user: { name: "Ivy", email: "ivy@example.com" } },
  jest.fn(),
];
const guest = [{ token: null }, jest.fn()];

const cartEmpty = [[], jest.fn()];
const cartSingle = [
  [{ itemCart_id: "row-1", _id: 1, name: "One", price: 50, description: "x".repeat(40) }],
  jest.fn(),
];
const cartMulti = [
  [
    { itemCart_id: "row-1", _id: 1, name: "A", price: 30, description: "A..." },
    { itemCart_id: "row-2", _id: 2, name: "B", price: 70, description: "B..." },
  ],
  jest.fn(),
];

const makeInstance = (nonce = "nonce-123") => ({
  requestPaymentMethod: jest.fn().mockResolvedValue({ nonce }),
});

beforeEach(() => {
  jest.clearAllMocks();
});

//
// 1) Equivalence Partitioning
//
describe("CartPage – Equivalence Partitioning", () => {
  it("EP: guest + empty cart", () => {
    useAuth.mockReturnValue(guest);
    useCart.mockReturnValue(cartEmpty);
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Hello Guest/i)).toBeInTheDocument();
    expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
    expect(screen.queryByTestId("dropin")).not.toBeInTheDocument();
  });

  it("EP: guest + non-empty cart", () => {
    useAuth.mockReturnValue(guest);
    useCart.mockReturnValue(cartSingle);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Hello Guest/i)).toBeInTheDocument();
    expect(screen.getByText(/You have 1 items in your cart/i)).toBeInTheDocument();
    expect(screen.getByText(/Please login to checkout!/i)).toBeInTheDocument();
    expect(screen.queryByTestId("dropin")).not.toBeInTheDocument();
  });

  it("EP: authed + address + non-empty cart → checkout visible", async () => {
    useAuth.mockReturnValue(authedWithAddress);
    useCart.mockReturnValue(cartMulti);
    axios.get.mockResolvedValueOnce({ data: { clientToken: "ct" } });

    DropIn.mockImplementationOnce(({ onInstance }) => {
      act(() => onInstance(makeInstance()));
      return <div data-testid="dropin">dropin</div>;
    });

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByTestId("dropin")).toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /make payment/i })).not.toBeDisabled()
    );
  });

  it("EP: authed + no address + non-empty cart → button disabled", async () => {
    useAuth.mockReturnValue(authedNoAddress);
    useCart.mockReturnValue(cartSingle);
    axios.get.mockResolvedValueOnce({ data: { clientToken: "ct" } });

    DropIn.mockImplementationOnce(({ onInstance }) => {
      act(() => onInstance(makeInstance()));
      return <div data-testid="dropin">dropin</div>;
    });

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByTestId("dropin")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /make payment/i })).toBeDisabled();
  });
});

//
// 2) Boundary Value Analysis
//
describe("CartPage – Boundary Value Analysis", () => {
  it("BVA: price extremes aggregate to a precise formatted total", () => {
    useAuth.mockReturnValue(authedWithAddress);
    useCart.mockReturnValue([
      [
        { itemCart_id: "row-1", _id: 1, name: "High", price: 99999.99, description: "hi" },
        { itemCart_id: "row-2", _id: 2, name: "Low", price: 0.01, description: "lo" },
      ],
      jest.fn(),
    ]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId("total-price")).toHaveTextContent("Total : $100,000.00");
  });

  it("BVA: long description truncates safely", () => {
    const long = "L".repeat(500);
    useAuth.mockReturnValue(authedWithAddress);
    useCart.mockReturnValue([
      [{ itemCart_id: "row-1", _id: 1, name: "X", price: 10, description: long }],
      jest.fn(),
    ]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    expect(screen.getByText("X")).toBeInTheDocument();
    // The UI shows description.substring(0, 30)
    expect(screen.getByText(long.substring(0, 30))).toBeInTheDocument();
    expect(screen.getByTestId("total-price")).toHaveTextContent("Total : $10.00");
  });

  it("BVA: remove from single-item cart leaves empty", () => {
    const setCart = jest.fn();
    useAuth.mockReturnValue(authedWithAddress);
    useCart.mockReturnValue([
      [{ itemCart_id: "only", _id: 10, name: "Solo", price: 15, description: "d" }],
      setCart,
    ]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    // Now removal is by mapped index; clicking the only Remove should call setCart([])
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(setCart).toHaveBeenCalledWith([]);
  });
});

//
// 3) Token shape + pre-instance + loading UI + rounding + render details
//
describe("CartPage – Additional focused cases", () => {
  it("logs a message when token response is shaped incorrectly", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    useAuth.mockReturnValue([
      { token: "t", user: { name: "Ivy", email: "ivy@example.com", address: "123 Main" } },
      jest.fn(),
    ]);
    useCart.mockReturnValue([
      [{ itemCart_id: "r1", _id: 1, name: "Z", price: 10, description: "d" }],
      jest.fn(),
    ]);

    // Missing clientToken field → should log the new message text
    axios.get.mockResolvedValueOnce({ data: { somethingElse: true } });

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith("Wrong API response message");
    });
    spy.mockRestore();
  });

  it("shows 'Processing ....' while payment is in-flight, then resets on error", async () => {
    useAuth.mockReturnValue([
      { token: "t", user: { name: "Ivy", email: "ivy@example.com", address: "123 Main" } },
      jest.fn(),
    ]);
    useCart.mockReturnValue([
      [{ itemCart_id: "r1", _id: 1, name: "Z", price: 10, description: "d" }],
      jest.fn(),
    ]);

    axios.get.mockResolvedValueOnce({ data: { clientToken: "ct" } });

    DropIn.mockImplementationOnce(({ onInstance }) => {
      act(() =>
        onInstance({ requestPaymentMethod: jest.fn().mockResolvedValue({ nonce: "nx" }) })
      );
      return <div data-testid="dropin">dropin</div>;
    });

    // Make axios.post hang briefly so we can assert "Processing ...."
    let resolvePost;
    const postPromise = new Promise((res) => (resolvePost = res));
    axios.post.mockImplementationOnce(() => postPromise);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    const button = await screen.findByRole("button", { name: /make payment/i });
    fireEvent.click(button);

    // During in-flight: text changes
    expect(await screen.findByRole("button", { name: /Processing \.\.\.\./i })).toBeInTheDocument();

    // Fail the payment
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    resolvePost(Promise.reject(new Error("boom")));
    await waitFor(() => expect(logSpy).toHaveBeenCalledWith(expect.any(Error)));
    logSpy.mockRestore();

    // After failure, button text returns to Make Payment (loading false)
    expect(screen.getByRole("button", { name: /make payment/i })).toBeInTheDocument();
  });

  it("precisely sums decimal edge cases (e.g., 0.1 + 0.2 → $0.30)", () => {
    useAuth.mockReturnValue([
      { token: "t", user: { name: "Ivy", email: "ivy@example.com", address: "123 Main" } },
      jest.fn(),
    ]);
    useCart.mockReturnValue([
      [
        { itemCart_id: "a", _id: 1, name: "Dec A", price: 0.1, description: "a" },
        { itemCart_id: "b", _id: 2, name: "Dec B", price: 0.2, description: "b" },
      ],
      jest.fn(),
    ]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId("total-price")).toHaveTextContent("Total : $0.30");
  });

  it("removes the middle line item from a three-item cart correctly (by index)", () => {
    const setCart = jest.fn();
    const current = [
      { itemCart_id: "k1", _id: 1, name: "P1", price: 10, description: "d" },
      { itemCart_id: "k2", _id: 2, name: "P2", price: 20, description: "d" },
      { itemCart_id: "k3", _id: 3, name: "P3", price: 30, description: "d" },
    ];
    useAuth.mockReturnValue([
      { token: "t", user: { name: "Ivy", email: "ivy@example.com", address: "123 Main" } },
      jest.fn(),
    ]);
    useCart.mockReturnValue([current, setCart]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    // Click the second "Remove" (mapped index 1)
    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[1]);

    const expected = [current[0], current[2]];
    expect(setCart).toHaveBeenCalledWith(expected);
    expect(window.localStorage.setItem).toHaveBeenCalledWith("cart", JSON.stringify(expected));
  });

  it("renders product image alt and url based on item data", () => {
    useAuth.mockReturnValue(authedWithAddress);
    useCart.mockReturnValue([
      [{ itemCart_id: "r1", _id: 42, name: "X-Ray", price: 9, description: "d" }],
      jest.fn(),
    ]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    const img = screen.getByAltText("X-Ray");
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toContain("/api/v1/product/product-photo/42");
  });
});

it("getToken: logs error when axios.get rejects", async () => {
  const spy = jest.spyOn(console, "log").mockImplementation(() => {});
  useAuth.mockReturnValue(authedWithAddress);
  useCart.mockReturnValue(cartSingle);

  axios.get.mockRejectedValueOnce(new Error("network down"));

  render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(spy).toHaveBeenCalledWith(expect.any(Error));
  });
  spy.mockRestore();
});

it("useEffect: refetches token when auth.token changes", async () => {
  useAuth
    .mockReturnValueOnce(guest) // initial
    .mockReturnValueOnce(authedWithAddress); // after change
  useCart.mockReturnValue(cartSingle);

  axios.get
    .mockResolvedValueOnce({ data: { clientToken: "ct-guest" } })
    .mockResolvedValueOnce({ data: { clientToken: "ct-authed" } });

  const { rerender } = render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>
  );

  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

  rerender(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>
  );

  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
});

it("handlePayment success flow: clears cart, navigates, and toasts", async () => {
  const setCart = jest.fn();
  useAuth.mockReturnValue([
    { token: "t", user: { name: "Ivy", email: "ivy@example.com", address: "123 Main" } },
    jest.fn(),
  ]);
  useCart.mockReturnValue([
    [
      { itemCart_id: "r1", _id: 1, name: "Z", price: 10, description: "d" },
      { itemCart_id: "r2", _id: 2, name: "Y", price: 5, description: "d" },
    ],
    setCart,
  ]);

  axios.get.mockResolvedValueOnce({ data: { clientToken: "ct" } });

  const instance = makeInstance("nonce-xyz");
  DropIn.mockImplementationOnce(({ onInstance }) => {
    act(() => onInstance(instance));
    return <div data-testid="dropin">dropin</div>;
  });

  axios.post.mockResolvedValueOnce({ data: { ok: true } });

  render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>
  );

  const btn = await screen.findByRole("button", { name: /make payment/i });
  fireEvent.click(btn);

  await waitFor(() => {
    expect(instance.requestPaymentMethod).toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalledWith("/api/v1/product/braintree/payment", {
      nonce: "nonce-xyz",
      cart: expect.any(Array),
    });
    expect(window.localStorage.removeItem).toHaveBeenCalledWith("cart");
    expect(setCart).toHaveBeenCalledWith([]);
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");
    expect(toast.success).toHaveBeenCalledWith("Payment Completed Successfully");
  });
});

it("Address actions: Update Address navigates to profile when authed with address", () => {
  useAuth.mockReturnValue(authedWithAddress);
  useCart.mockReturnValue(cartSingle);

  render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: /update address/i }));
  expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/profile");
});

it("Address actions: authed without address shows Update; guest shows Login and navigates with state '/cart'", () => {
  // Authed without address
  useAuth.mockReturnValue(authedNoAddress);
  useCart.mockReturnValue(cartSingle);
  render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>
  );
  expect(screen.getByRole("button", { name: /update address/i })).toBeInTheDocument();

  // Guest path
  useAuth.mockReturnValue(guest);
  render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>
  );
  const loginBtn = screen.getByRole("button", { name: /please login to checkout/i });
  fireEvent.click(loginBtn);
  expect(mockNavigate).toHaveBeenCalledWith("/login", { state: "/cart" });
});

it("Checkout block hidden if missing clientToken or missing token or empty cart", () => {
  // Missing clientToken
  useAuth.mockReturnValue(authedWithAddress);
  useCart.mockReturnValue(cartSingle);
  axios.get.mockResolvedValueOnce({ data: { somethingElse: true } });

  render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>
  );
  expect(screen.queryByTestId("dropin")).not.toBeInTheDocument();

  // Missing auth token
  useAuth.mockReturnValue(guest);
  useCart.mockReturnValue(cartSingle);
  render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>
  );
  expect(screen.queryByTestId("dropin")).not.toBeInTheDocument();

  // Empty cart
  useAuth.mockReturnValue(authedWithAddress);
  useCart.mockReturnValue(cartEmpty);
  render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>
  );
  expect(screen.queryByTestId("dropin")).not.toBeInTheDocument();
});
