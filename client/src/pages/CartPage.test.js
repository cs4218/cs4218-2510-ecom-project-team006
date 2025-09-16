import React from "react";
import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import CartPage from "./CartPage";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import axios from "axios";
import toast from "react-hot-toast";

// ---- Mocks ----
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

jest.mock("braintree-web-drop-in-react", () => {
  const MockDropIn = function DropInMock(props) {
    if (props && typeof props.onInstance === "function") {
      const inst =
        global.__btInstance ||
        {
          requestPaymentMethod: jest.fn().mockResolvedValue({ nonce: "nonce-xyz" }),
        };
      props.onInstance(inst);
    }
    return null;
  };
  return { __esModule: true, default: MockDropIn };
});

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
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

// ---- Helpers and fixtures ----
const makeInstance = (nonce = "nonce-123") => ({
  requestPaymentMethod: jest.fn().mockResolvedValue({ nonce }),
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

beforeEach(() => {
  jest.clearAllMocks();
  // Default Braintree instance for tests unless a test overrides it
  global.__btInstance = makeInstance("nonce-xyz");
});

// ---- Tests ----
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

  it("EP: authed + address + non-empty cart → checkout visible and enabled", async () => {
    useAuth.mockReturnValue(authedWithAddress);
    useCart.mockReturnValue(cartMulti);
    axios.get.mockResolvedValueOnce({ data: { clientToken: "ct" } });

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    const btn = await screen.findByRole("button", { name: /make payment/i });
    await waitFor(() => expect(btn).not.toBeDisabled());
  });

  it("EP: authed + no address + non-empty cart → button disabled", async () => {
    useAuth.mockReturnValue(authedNoAddress);
    useCart.mockReturnValue(cartSingle);
    axios.get.mockResolvedValueOnce({ data: { clientToken: "ct" } });

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    const btn = await screen.findByRole("button", { name: /make payment/i });
    expect(btn).toBeDisabled();
  });
});

describe("CartPage – Boundary Value Analysis", () => {
  it("BVA: price extremes aggregate to formatted total", () => {
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

  it("BVA: long description truncates", () => {
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

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(setCart).toHaveBeenCalledWith([]);
  });
});

describe("CartPage – Additional focused cases", () => {
  it("logs a message when token response is shaped incorrectly", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    useAuth.mockReturnValue(authedWithAddress);
    useCart.mockReturnValue(cartSingle);

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

  it("shows Processing while payment in-flight then resets on error", async () => {
    // Arrange
    useAuth.mockReturnValue([
      { token: "t", user: { name: "Ivy", email: "ivy@example.com", address: "123 Main" } },
      jest.fn(),
    ]);
    useCart.mockReturnValue([
      [{ itemCart_id: "r1", _id: 1, name: "Z", price: 10, description: "d" }],
      jest.fn(),
    ]);

    // Provide a valid client token so the checkout block renders
    axios.get.mockResolvedValueOnce({ data: { clientToken: "ct" } });

    // Make DropIn return a stable instance
    const failingInstance = {
      requestPaymentMethod: jest.fn().mockResolvedValue({ nonce: "nx" }),
    };
    global.__btInstance = failingInstance;

    // Force the payment request to reject
    axios.post.mockRejectedValueOnce(new Error("boom"));

    // Silence console noise but keep an assertion
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    const button = await screen.findByRole("button", { name: /make payment/i });
    await waitFor(() => expect(button).not.toBeDisabled());
    fireEvent.click(button);

    expect(
      await screen.findByRole("button", { name: /Processing \.\.\.\./i })
    ).toBeInTheDocument();

    await waitFor(() => expect(logSpy).toHaveBeenCalledWith(expect.any(Error)));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /make payment/i })).toBeInTheDocument()
    );

    logSpy.mockRestore();
  });


  it("precisely sums decimal edge cases", () => {
    useAuth.mockReturnValue(authedWithAddress);
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

  it("removes the middle item from a three-item cart by index", () => {
    const setCart = jest.fn();
    const current = [
      { itemCart_id: "k1", _id: 1, name: "P1", price: 10, description: "d" },
      { itemCart_id: "k2", _id: 2, name: "P2", price: 20, description: "d" },
      { itemCart_id: "k3", _id: 3, name: "P3", price: 30, description: "d" },
    ];
    useAuth.mockReturnValue(authedWithAddress);
    useCart.mockReturnValue([current, setCart]);

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[1]);

    const expected = [current[0], current[2]];
    expect(setCart).toHaveBeenCalledWith(expected);
    expect(window.localStorage.setItem).toHaveBeenCalledWith("cart", JSON.stringify(expected));
  });

  it("renders product image alt and url", () => {
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

  // Make sure the instance returns the nonce we assert on
  global.__btInstance = makeInstance("nonce-xyz");

  axios.post.mockResolvedValueOnce({ data: { ok: true } });

  render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>
  );

  const btn = await screen.findByRole("button", { name: /make payment/i });
  await waitFor(() => expect(btn).not.toBeDisabled());
  fireEvent.click(btn);

  await waitFor(() => {
    expect(global.__btInstance.requestPaymentMethod).toHaveBeenCalled();
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
  useAuth.mockReturnValue(authedNoAddress);
  useCart.mockReturnValue(cartSingle);
  render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>
  );
  expect(screen.getByRole("button", { name: /update address/i })).toBeInTheDocument();

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

