import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Profile from './Profile';

// AI attribution: Some test cases are produced with the help of OpenAI ChatGPT(GPT-5) via cursor.

// Mock dependencies
jest.mock('axios');
jest.mock('react-hot-toast');
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

const MockProfile = () => (
  <BrowserRouter>
    <Profile />
  </BrowserRouter>
);

describe('Profile Page - Essential Tests', () => {
  const mockAuth = {
    token: 'mock-token',
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      address: '123 Main St'
    }
  };

  const mockSetAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    require('../../context/auth').useAuth.mockReturnValue([mockAuth, mockSetAuth]);
    localStorage.setItem('auth', JSON.stringify({ user: mockAuth.user, token: 'mock-token' }));
  });

  describe('Core Functionality Tests', () => {
    test('displays user information in form fields', () => {
      render(<MockProfile />);

      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
    });

    test('submits form with updated data', async () => {
      const mockResponse = {
        data: {
          updatedUser: {
            name: 'John Updated',
            email: 'john@example.com',
            phone: '9876543210',
            address: '456 New St'
          }
        }
      };
      axios.put.mockResolvedValueOnce(mockResponse);

      render(<MockProfile />);

      // Update name field
      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'John Updated' } });

      // Submit form
      const submitButton = screen.getByText('UPDATE');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith('/api/v1/auth/profile', {
          name: 'John Updated',
          email: 'john@example.com',
          password: '',
          phone: '1234567890',
          address: '123 Main St'
        });
      });
    });

    test('updates auth context and localStorage on successful submission', async () => {
      const mockResponse = {
        data: {
          updatedUser: {
            name: 'John Updated',
            email: 'john@example.com',
            phone: '9876543210',
            address: '456 New St'
          }
        }
      };
      axios.put.mockResolvedValueOnce(mockResponse);

      render(<MockProfile />);

      const submitButton = screen.getByText('UPDATE');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSetAuth).toHaveBeenCalledWith({
          ...mockAuth,
          user: mockResponse.data.updatedUser
        });
        expect(toast.success).toHaveBeenCalledWith('Profile Updated Successfully');
      });
    });

    test('handles API errors gracefully', async () => {
      axios.put.mockRejectedValueOnce(new Error('API Error'));

      render(<MockProfile />);

      const submitButton = screen.getByText('UPDATE');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');
      });
    });
  });

  describe('Form Interaction Tests', () => {
    test('allows user to edit form fields', () => {
      render(<MockProfile />);

      const nameInput = screen.getByDisplayValue('John Doe');
      const phoneInput = screen.getByDisplayValue('1234567890');
      const addressInput = screen.getByDisplayValue('123 Main St');

      fireEvent.change(nameInput, { target: { value: 'New Name' } });
      fireEvent.change(phoneInput, { target: { value: '9999999999' } });
      fireEvent.change(addressInput, { target: { value: 'New Address' } });

      expect(nameInput.value).toBe('New Name');
      expect(phoneInput.value).toBe('9999999999');
      expect(addressInput.value).toBe('New Address');
    });

    test('email field is disabled', () => {
      render(<MockProfile />);

      const emailInput = screen.getByDisplayValue('john@example.com');
      expect(emailInput).toBeDisabled();
    });

    test('form has correct input IDs', () => {
      render(<MockProfile />);

      expect(screen.getByDisplayValue('John Doe')).toHaveAttribute('id', 'name-input');
      expect(screen.getByDisplayValue('john@example.com')).toHaveAttribute('id', 'email-input');
      expect(screen.getByDisplayValue('1234567890')).toHaveAttribute('id', 'phone-input');
      expect(screen.getByDisplayValue('123 Main St')).toHaveAttribute('id', 'address-input');
    });
  });

  describe('Component Integration Tests', () => {
    test('renders Layout component with correct title', () => {
      render(<MockProfile />);

      expect(screen.getByTestId('layout')).toBeInTheDocument();
      expect(screen.getByTestId('layout-title')).toHaveTextContent('Your Profile');
    });

    test('renders UserMenu component', () => {
      render(<MockProfile />);

      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    test('renders form with correct structure', () => {
      render(<MockProfile />);

      expect(screen.getByText('USER PROFILE')).toBeInTheDocument();
      expect(screen.getByText('UPDATE')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'UPDATE' })).toBeInTheDocument();
    });
  });

  describe('Error Handling Tests', () => {
    test('handles server error response', async () => {
      const mockErrorResponse = {
        data: {
          error: 'Server error occurred'
        }
      };
      axios.put.mockResolvedValueOnce(mockErrorResponse);

      render(<MockProfile />);

      const submitButton = screen.getByText('UPDATE');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Server error occurred');
      });
    });

    test('handles missing user data gracefully', () => {
      const mockAuthWithoutUser = {
        token: 'mock-token',
        user: {
          name: '',
          email: '',
          phone: '',
          address: ''
        }
      };
      require('../../context/auth').useAuth.mockReturnValue([mockAuthWithoutUser, mockSetAuth]);

      render(<MockProfile />);

      // Should not crash and form should still render
      expect(screen.getByText('USER PROFILE')).toBeInTheDocument();
    });
  });
});
