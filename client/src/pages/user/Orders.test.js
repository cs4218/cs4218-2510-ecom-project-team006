import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import axios from 'axios';
import moment from 'moment';
import Orders from './Orders';

// AI attribution: Some test cases are produced with the help of OpenAI ChatGPT(GPT-5) via cursor.

// Mock dependencies
jest.mock('axios');
jest.mock('moment');
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn()
}));
jest.mock('../../components/Layout', () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout">
        <div data-testid="layout-title">{title}</div>
        {children}
      </div>
    );
  };
});
jest.mock('../../components/UserMenu', () => {
  return function MockUserMenu() {
    return <div data-testid="user-menu">User Menu</div>;
  };
});

const MockOrders = () => (
  <BrowserRouter>
    <Orders />
  </BrowserRouter>
);

describe('Orders Page - Comprehensive Tests', () => {
  const mockAuth = {
    token: 'mock-token',
    user: { name: 'Test User' }
  };

  const mockOrders = [
    {
      _id: 'order1',
      status: 'Processing',
      buyer: { name: 'John Doe' },
      createAt: '2023-01-01T00:00:00Z',
      payment: { success: true },
      products: [
        {
          _id: 'product1',
          name: 'Test Product 1',
          description: 'This is a test product description',
          price: 100
        }
      ]
    },
    {
      _id: 'order2',
      status: 'Delivered',
      buyer: { name: 'Jane Smith' },
      createAt: '2023-01-02T00:00:00Z',
      payment: { success: false },
      products: [
        {
          _id: 'product2',
          name: 'Test Product 2',
          description: 'Another test product',
          price: 200
        }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    require('../../context/auth').useAuth.mockReturnValue([mockAuth, jest.fn()]);
    moment.mockImplementation((date) => ({
      fromNow: () => '2 days ago'
    }));
  });

  describe('Core Functionality Tests', () => {
    test('fetches orders when user is authenticated', async () => {
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      render(<MockOrders />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/orders');
      });
    });

    test('displays orders table with correct headers', async () => {
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      render(<MockOrders />);

      await waitFor(() => {
        expect(screen.getByText('#')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Buyer')).toBeInTheDocument();
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Payment')).toBeInTheDocument();
        expect(screen.getByText('Quantity')).toBeInTheDocument();
      });
    });

    test('displays order data correctly in table', async () => {
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      render(<MockOrders />);

      await waitFor(() => {
        expect(screen.getByText('Processing')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Success')).toBeInTheDocument();
        expect(screen.getAllByText('1')).toHaveLength(3); // 1 in table + 1 in order #1 + 1 in quantity
      });
    });

    test('handles API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      axios.get.mockRejectedValueOnce(new Error('API Error'));

      render(<MockOrders />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Data Display Tests', () => {
    test('displays order information correctly', async () => {
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      render(<MockOrders />);

      await waitFor(() => {
        expect(screen.getByText('Processing')).toBeInTheDocument();
        expect(screen.getByText('Delivered')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    test('displays product information correctly', async () => {
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      render(<MockOrders />);

      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
        expect(screen.getByText('Test Product 2')).toBeInTheDocument();
        expect(screen.getByText(/This is a test product descrip/)).toBeInTheDocument();
        expect(screen.getByText('Price : 100')).toBeInTheDocument();
        expect(screen.getByText('Price : 200')).toBeInTheDocument();
      });
    });

    test('formats dates correctly using moment', async () => {
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      render(<MockOrders />);

      await waitFor(() => {
        expect(moment).toHaveBeenCalledWith('2023-01-01T00:00:00Z');
        expect(moment).toHaveBeenCalledWith('2023-01-02T00:00:00Z');
      });
    });

    test('displays payment status correctly', async () => {
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      render(<MockOrders />);

      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
        expect(screen.getByText('Failed')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State Tests', () => {
    test('displays no orders message when orders array is empty', async () => {
      axios.get.mockResolvedValueOnce({ data: [] });

      render(<MockOrders />);

      await waitFor(() => {
        expect(screen.getByText('No orders found')).toBeInTheDocument();
      });
    });

    test('does not display table when no orders', async () => {
      axios.get.mockResolvedValueOnce({ data: [] });

      render(<MockOrders />);

      await waitFor(() => {
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
      });
    });
  });

  describe('Component Integration Tests', () => {
    test('renders Layout component with correct title', async () => {
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      render(<MockOrders />);

      await waitFor(() => {
        expect(screen.getByTestId('layout')).toBeInTheDocument();
        expect(screen.getByTestId('layout-title')).toHaveTextContent('Your Orders');
      });
    });

    test('renders UserMenu component', async () => {
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      render(<MockOrders />);

      await waitFor(() => {
        expect(screen.getByTestId('user-menu')).toBeInTheDocument();
      });
    });

    test('renders page without errors', async () => {
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      render(<MockOrders />);

      await waitFor(() => {
        expect(screen.getByText('All Orders')).toBeInTheDocument();
        expect(screen.getByTestId('layout')).toBeInTheDocument();
        expect(screen.getByTestId('user-menu')).toBeInTheDocument();
      });
    });
  });

  describe('Data Validation Tests', () => {
    test('handles missing product description gracefully', async () => {
      const ordersWithMissingDescription = [
        {
          _id: 'order1',
          status: 'Processing',
          buyer: { name: 'John Doe' },
          createAt: '2023-01-01T00:00:00Z',
          payment: { success: true },
          products: [
            {
              _id: 'product1',
              name: 'Test Product 1',
              description: null,
              price: 100
            }
          ]
        }
      ];

      axios.get.mockResolvedValueOnce({ data: ordersWithMissingDescription });

      render(<MockOrders />);

      await waitFor(() => {
        expect(screen.getByText('No description')).toBeInTheDocument();
      });
    });

    test('handles missing buyer information', async () => {
      const ordersWithMissingBuyer = [
        {
          _id: 'order1',
          status: 'Processing',
          buyer: null,
          createAt: '2023-01-01T00:00:00Z',
          payment: { success: true },
          products: []
        }
      ];

      axios.get.mockResolvedValueOnce({ data: ordersWithMissingBuyer });

      render(<MockOrders />);

      await waitFor(() => {
        expect(screen.getByText('Processing')).toBeInTheDocument();
      });
    });

    test('handles missing payment information', async () => {
      const ordersWithMissingPayment = [
        {
          _id: 'order1',
          status: 'Processing',
          buyer: { name: 'John Doe' },
          createAt: '2023-01-01T00:00:00Z',
          payment: null,
          products: []
        }
      ];

      axios.get.mockResolvedValueOnce({ data: ordersWithMissingPayment });

      render(<MockOrders />);

      await waitFor(() => {
        expect(screen.getByText('Failed')).toBeInTheDocument();
      });
    });
  });

  describe('Authentication Tests', () => {
    test('does not fetch orders when user is not authenticated', () => {
      require('../../context/auth').useAuth.mockReturnValue([null, jest.fn()]);

      render(<MockOrders />);

      expect(axios.get).not.toHaveBeenCalled();
    });

    test('fetches orders when token is available', async () => {
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      render(<MockOrders />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/orders');
      });
    });
  });

  describe('Table Structure Tests', () => {
    test('displays single table for all orders', async () => {
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      render(<MockOrders />);

      await waitFor(() => {
        const tables = screen.getAllByRole('table');
        expect(tables).toHaveLength(1);
      });
    });

    test('displays correct number of rows in table', async () => {
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      render(<MockOrders />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows).toHaveLength(3); // 1 header + 2 data rows
      });
    });

    test('displays product details for each order', async () => {
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      render(<MockOrders />);

      await waitFor(() => {
        expect(screen.getByText('Order #1 Products')).toBeInTheDocument();
        expect(screen.getByText('Order #2 Products')).toBeInTheDocument();
      });
    });
  });
});
