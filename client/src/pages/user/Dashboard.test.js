import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, screen } from '@testing-library/react';

// Mock Layout and UserMenu to keep tests focused and avoid extra dependency rendering
jest.mock('../../components/Layout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../components/UserMenu', () => ({
  __esModule: true,
  default: () => <div>MockUserMenu</div>,
}));

// Mock useAuth from context
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = require('../../context/auth');
const Dashboard = require('./Dashboard').default;

describe('Dashboard component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders user name, email and address when auth.user has string address', () => {
    useAuth.mockReturnValue([{ user: { name: 'Alice', email: 'alice@example.com', address: '123 Street' } }]);

    render(<Dashboard />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('123 Street')).toBeInTheDocument();
  });
});

