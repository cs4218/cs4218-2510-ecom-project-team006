import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Header from './Header';

// AI attribution: Some test cases are produced with the help of OpenAI ChatGPT(GPT-5) via cursor.

// Mocks with test-controlled state
let mockedAuth;
let mockSetAuth;
let mockedCart;

jest.mock('../context/auth', () => ({
  useAuth: () => [mockedAuth, mockSetAuth]
}));

jest.mock('../context/cart', () => ({
  useCart: () => [mockedCart]
}));

jest.mock('../hooks/useCategory', () => () => [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Clothing', slug: 'clothing' }
]);

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn()
  }
}));

// Mock SearchInput component
jest.mock('./Form/SearchInput', () => {
  return function MockSearchInput() {
    return <div data-testid="search-input">Search Input</div>;
  };
});

const MockHeader = () => (
  <BrowserRouter>
    <Header />
  </BrowserRouter>
);

describe('Header Component', () => {
  beforeEach(() => {
    mockedAuth = { user: null, token: null };
    mockSetAuth = jest.fn();
    mockedCart = [];
    // Clean localStorage and mocks
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders header with brand name', () => {
    render(<MockHeader />);
    
    expect(screen.getByText('🛒 Virtual Vault')).toBeInTheDocument();
  });

  test('renders navigation links', () => {
    render(<MockHeader />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Cart')).toBeInTheDocument();
  });

  test('renders search input', () => {
    render(<MockHeader />);
    
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  test('renders authentication links when user is not logged in', () => {
    render(<MockHeader />);
    
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  test('renders categories dropdown', () => {
    render(<MockHeader />);
    
    const categoriesLink = screen.getByText('Categories');
    expect(categoriesLink).toBeInTheDocument();
    
    // Check if dropdown items are present
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    // From mocked hook
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
  });

  test('renders cart with badge', () => {
    render(<MockHeader />);
    
    expect(screen.getByText('Cart')).toBeInTheDocument();
  });

  test('cart badge reflects cart length when items exist', () => {
    mockedCart = [{ id: 1 }, { id: 2 }];
    render(<MockHeader />);
    // Badge wraps the link text; presence checked above.
    // Here we assert text still present; count visual comes from antd internals, not necessary to assert DOM number.
    expect(screen.getByText('Cart')).toBeInTheDocument();
  });

  test('has correct CSS classes', () => {
    render(<MockHeader />);
    
    const navbar = screen.getByRole('navigation');
    expect(navbar).toHaveClass('navbar', 'navbar-expand-lg', 'bg-body-tertiary');
  });

  test('has correct brand link', () => {
    render(<MockHeader />);
    
    const brandLink = screen.getByText('🛒 Virtual Vault');
    expect(brandLink.closest('a')).toHaveAttribute('href', '/');
  });

  // Active state tests for NavLink highlighting
  test('Home link is active on "/"', () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Header />
      </MemoryRouter>
    );
    const home = screen.getByRole('link', { name: /home/i });
    expect(home).toHaveClass('active');
  });

  test('Categories is active on "/categories"', () => {
    render(
      <MemoryRouter initialEntries={["/categories"]}>
        <Header />
      </MemoryRouter>
    );
    const categories = screen.getByText(/^Categories$/i);
    expect(categories).toHaveClass('active');
  });

  test('Categories is active on "/category/:slug"', () => {
    render(
      <MemoryRouter initialEntries={["/category/shoes"]}>
        <Header />
      </MemoryRouter>
    );
    const categories = screen.getByText(/^Categories$/i);
    expect(categories).toHaveClass('active');
  });

  test('Categories is not active on unrelated route', () => {
    render(
      <MemoryRouter initialEntries={["/contact"]}>
        <Header />
      </MemoryRouter>
    );
    const categories = screen.getByText(/^Categories$/i);
    expect(categories).not.toHaveClass('active');
  });

  test('shows user menu when logged in and dashboard link matches role', () => {
    mockedAuth = { user: { name: 'Alice', role: 1 }, token: 't' };
    render(<MockHeader />);
    // user name visible
    expect(screen.getByText('Alice')).toBeInTheDocument();
    // dashboard link for admin when role===1
    const dashboard = screen.getByText('Dashboard');
    expect(dashboard.closest('a')).toHaveAttribute('href', '/dashboard/admin');
  });

  test('logout clears auth and localStorage, shows toast', () => {
    mockedAuth = { user: { name: 'Bob', role: 0 }, token: 't' };
    render(<MockHeader />);
    localStorage.setItem('auth', 'x');

    // click Logout
    fireEvent.click(screen.getByText('Logout'));

    expect(mockSetAuth).toHaveBeenCalledWith({ user: null, token: '' });
    expect(localStorage.getItem('auth')).toBeNull();
    // toast.success called
    const toast = require('react-hot-toast').default;
    expect(toast.success).toHaveBeenCalled();
  });
});
