import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Search from './Search';
import { toast } from 'react-hot-toast';

jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));
jest.mock('react-hot-toast');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

jest.mock('../components/Layout', () => {
  return function MockLayout({ children }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

const mockSetValues = jest.fn();
let mockSearchValues = { keyword: '', results: [] };
jest.mock('../context/search', () => ({
  useSearch: () => [mockSearchValues, mockSetValues]
}));

const mockSetCart = jest.fn();
let mockCart = [];
jest.mock('../context/cart', () => ({
  useCart: () => [mockCart, mockSetCart]
}));

const mockSearchResults = [
  {
    _id: '101',
    name: 'Aurora Desk Lamp',
    description: 'Warm dimmable LED lamp with touch slider control for late night study sessions.',
    price: 79.5,
    category: { name: 'Home & Living' },
    slug: 'aurora-desk-lamp'
  },
  {
    _id: '202',
    name: 'Nimbus Wireless Headphones',
    description: 'Over-ear headphones with ANC and 30 hour battery life, lightweight and comfy.',
    price: 219.0,
    category: { name: 'Audio' },
    slug: 'nimbus-wireless-headphones'
  }
];

beforeEach(() => {
  jest.clearAllMocks();
  mockNavigate.mockClear();
  mockSetCart.mockClear();
  toast.success.mockClear();
  localStorage.clear();
  mockCart = [];
  mockSearchValues = { keyword: '', results: [] };
});

describe('Search Component base tests', () => {
  test('displays results', () => {
    mockSearchValues = { keyword: 'aurora', results: mockSearchResults };
    render(<BrowserRouter><Search /></BrowserRouter>);
    expect(screen.getByText(`Found ${mockSearchResults.length}`)).toBeInTheDocument();
    expect(screen.getByText('Aurora Desk Lamp')).toBeInTheDocument();
    expect(screen.getByText('Nimbus Wireless Headphones')).toBeInTheDocument();
  });

  test('shows empty state', () => {
    mockSearchValues = { keyword: 'aurora', results: [] };
    render(<BrowserRouter><Search /></BrowserRouter>);
    expect(screen.getByText('No Products Found')).toBeInTheDocument();
  });

  test('navigates to details', () => {
    mockSearchValues = { keyword: 'aurora', results: [mockSearchResults[0]] };
    render(<BrowserRouter><Search /></BrowserRouter>);
    fireEvent.click(screen.getByText('More Details'));
    expect(mockNavigate).toHaveBeenCalledWith(`/product/${mockSearchResults[0].slug}`);
  });

  test('adds to cart', () => {
    mockSearchValues = { keyword: 'aurora', results: [mockSearchResults[0]] };
    render(<BrowserRouter><Search /></BrowserRouter>);
    fireEvent.click(screen.getByText('ADD TO CART'));
    expect(mockSetCart).toHaveBeenCalledWith([mockSearchResults[0]]);
    expect(JSON.parse(localStorage.getItem('cart'))).toEqual([mockSearchResults[0]]);
    expect(toast.success).toHaveBeenCalledWith('Item Added to cart');
  });
});

//
// Equivalence Partitioning examples
//
describe('Equivalence Partitioning', () => {
  test('partition: one result', () => {
    mockSearchValues = { keyword: 'aurora', results: [mockSearchResults[0]] };
    render(<BrowserRouter><Search /></BrowserRouter>);
    expect(screen.getByText('Found 1')).toBeInTheDocument();
  });

  test('partition: keyword empty', () => {
    mockSearchValues = { keyword: '', results: mockSearchResults };
    render(<BrowserRouter><Search /></BrowserRouter>);
    expect(screen.getByText(`Found ${mockSearchResults.length}`)).toBeInTheDocument();
  });

  test('partition: existing cart contains different product', () => {
    mockCart = [mockSearchResults[0]];
    mockSearchValues = { keyword: 'nimbus', results: [mockSearchResults[1]] };
    render(<BrowserRouter><Search /></BrowserRouter>);
    fireEvent.click(screen.getByText('ADD TO CART'));
    expect(mockSetCart).toHaveBeenCalledWith([mockSearchResults[0], mockSearchResults[1]]);
  });
});

//
// Boundary Value Analysis examples
//
describe('Boundary Value Analysis', () => {
  const makeDesc = (len) => 'x'.repeat(len);

  test('description length 29', () => {
    const p = { ...mockSearchResults[0], description: makeDesc(29), _id: 'd29' };
    mockSearchValues = { keyword: 'b', results: [p] };
    render(<BrowserRouter><Search /></BrowserRouter>);
    expect(screen.getByText(`${p.description.substring(0, 30)}...`)).toBeInTheDocument();
  });

  test('description length 31', () => {
    const p = { ...mockSearchResults[0], description: makeDesc(31), _id: 'd31' };
    mockSearchValues = { keyword: 'b', results: [p] };
    render(<BrowserRouter><Search /></BrowserRouter>);
    expect(screen.getByText(`${p.description.substring(0, 30)}...`)).toBeInTheDocument();
  });

  test('price zero', () => {
    const p = { ...mockSearchResults[0], price: 0, _id: 'zero' };
    mockSearchValues = { keyword: 'zero', results: [p] };
    render(<BrowserRouter><Search /></BrowserRouter>);
    expect(screen.getByText('$ 0')).toBeInTheDocument();
  });
});