import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchInput from './SearchInput';
import axios from 'axios';

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn()
}));

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock search context
const mockSetValues = jest.fn();
let mockValues = { keyword: '', results: [] };
jest.mock('../../context/search', () => ({
  useSearch: () => [mockValues, mockSetValues]
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockNavigate.mockClear();
  mockSetValues.mockClear();
  mockValues = { keyword: '', results: [] };
});

function renderComp() {
  return render(<SearchInput />);
}

describe('SearchInput base behavior', () => {
  test('typing updates keyword in context via setValues', () => {
    renderComp();
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'laptop' } });
    expect(mockSetValues).toHaveBeenCalledWith({ ...mockValues, keyword: 'laptop' });
  });

  test('submit calls axios with keyword, updates results, then navigates', async () => {
    mockValues = { keyword: 'laptop', results: [] };
    const mockData = [{ _id: '1', name: 'X' }];
    axios.get.mockResolvedValueOnce({ data: mockData });

    renderComp();
    fireEvent.submit(screen.getByRole('search')); // the <form> has role="search"

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/search/laptop');
      expect(mockSetValues).toHaveBeenCalledWith({ ...mockValues, results: mockData });
      expect(mockNavigate).toHaveBeenCalledWith('/search');
    });
  });

  test('submit logs error and does not navigate on failure', async () => {
    mockValues = { keyword: 'phone', results: [] };
    const err = new Error('network');
    axios.get.mockRejectedValueOnce(err);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    renderComp();
    fireEvent.submit(screen.getByRole('search'));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/search/phone');
      expect(logSpy).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
      // We also do not expect a successful setValues for results here
    });

    logSpy.mockRestore();
  });
});

//
// Equivalence Partitioning
//
describe('Equivalence Partitioning', () => {
  test('partition: empty keyword still submits to empty-suffix route per current logic', async () => {
    mockValues = { keyword: '', results: [] };
    axios.get.mockResolvedValueOnce({ data: [] });

    renderComp();
    fireEvent.submit(screen.getByRole('search'));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/search/');
      expect(mockNavigate).toHaveBeenCalledWith('/search');
    });
  });

  test('partition: simple keyword', async () => {
    mockValues = { keyword: 'mouse', results: [] };
    axios.get.mockResolvedValueOnce({ data: [{ _id: 'm' }] });

    renderComp();
    fireEvent.submit(screen.getByRole('search'));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/search/mouse');
      expect(mockNavigate).toHaveBeenCalledWith('/search');
    });
  });

  test('partition: mixed case keyword', async () => {
    mockValues = { keyword: 'AuRoRa', results: [] };
    axios.get.mockResolvedValueOnce({ data: [{ _id: 'a' }] });

    renderComp();
    fireEvent.submit(screen.getByRole('search'));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/search/AuRoRa');
      expect(mockNavigate).toHaveBeenCalledWith('/search');
    });
  });
});

//
// Boundary Value Analysis
//
describe('Boundary Value Analysis', () => {
  test('boundary: single char keyword', async () => {
    mockValues = { keyword: 'a', results: [] };
    axios.get.mockResolvedValueOnce({ data: [] });

    renderComp();
    fireEvent.submit(screen.getByRole('search'));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/search/a');
      expect(mockNavigate).toHaveBeenCalledWith('/search');
    });
  });

  test('boundary: long keyword (100 chars)', async () => {
    const longK = 'x'.repeat(100);
    mockValues = { keyword: longK, results: [] };
    axios.get.mockResolvedValueOnce({ data: [] });

    renderComp();
    fireEvent.submit(screen.getByRole('search'));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(`/api/v1/product/search/${longK}`);
      expect(mockNavigate).toHaveBeenCalledWith('/search');
    });
  });

  test('boundary: keyword with spaces is passed literally (no encoding in current code)', async () => {
    const spaced = ' gaming mouse ';
    mockValues = { keyword: spaced, results: [] };
    axios.get.mockResolvedValueOnce({ data: [] });

    renderComp();
    fireEvent.submit(screen.getByRole('search'));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(`/api/v1/product/search/${spaced}`);
      expect(mockNavigate).toHaveBeenCalledWith('/search');
    });
  });

  test('boundary: keyword with slash reveals lack of encodeURIComponent (documentation test)', async () => {
    const tricky = 'usb/typec';
    mockValues = { keyword: tricky, results: [] };
    axios.get.mockResolvedValueOnce({ data: [] });

    renderComp();
    fireEvent.submit(screen.getByRole('search'));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/search/usb/typec');
      expect(mockNavigate).toHaveBeenCalledWith('/search');
    });
  });
});