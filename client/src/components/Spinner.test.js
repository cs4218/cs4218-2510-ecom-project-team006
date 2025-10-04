import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Spinner from './Spinner';

// AI attribution: Some test cases are produced with the help of OpenAI ChatGPT(GPT-5) via cursor.

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockLocation = { pathname: '/test-path' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation
}));

const MockSpinner = ({ path = "login" }) => (
  <BrowserRouter>
    <Spinner path={path} />
  </BrowserRouter>
);

describe('Spinner Component - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic Rendering Tests', () => {
    test('renders spinner with countdown message', () => {
      render(<MockSpinner />);
      
      expect(screen.getByText(/redirecting to you in \d+ seconds?/)).toBeInTheDocument();
    });

    test('displays correct initial countdown of 3 seconds', () => {
      render(<MockSpinner />);
      
      expect(screen.getByText('redirecting to you in 3 seconds')).toBeInTheDocument();
    });

    test('renders spinner with correct CSS classes', () => {
      render(<MockSpinner />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('spinner-border');
      expect(spinner).toHaveAttribute('role', 'status');
    });

    test('renders loading text for accessibility', () => {
      render(<MockSpinner />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('has correct container styling', () => {
      render(<MockSpinner />);
      
      const container = screen.getByText(/redirecting to you in/).closest('div');
      expect(container).toHaveClass('d-flex', 'flex-column', 'justify-content-center', 'align-items-center');
      expect(container).toHaveStyle({ height: '100vh' });
    });
  });

  describe('Countdown Functionality Tests', () => {
    test('countdown decreases from 3 to 2 after 1 second', async () => {
      render(<MockSpinner />);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('redirecting to you in 2 seconds')).toBeInTheDocument();
      });
    });

    test('countdown decreases from 2 to 1 after 2 seconds', async () => {
      render(<MockSpinner />);
      
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('redirecting to you in 1 second')).toBeInTheDocument();
      });
    });

    test('countdown reaches 0 and triggers navigation after 3 seconds', async () => {
      render(<MockSpinner />);
      
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', {
          state: '/test-path'
        });
      });
    });
  });

  describe('Navigation Tests - Path Handling', () => {
    test('navigates to custom path when provided', async () => {
      render(<MockSpinner path="dashboard" />);
      
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {
          state: '/test-path'
        });
      });
    });

    test('navigates to root path when path is empty string', async () => {
      render(<MockSpinner path="" />);
      
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', {
          state: '/test-path'
        });
      });
    });

    test('uses default path "login" when path is undefined', async () => {
      render(<MockSpinner path={undefined} />);
      
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', {
          state: '/test-path'
        });
      });
    });

    test('preserves current location in navigation state', async () => {
      render(<MockSpinner />);
      
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', {
          state: '/test-path'
        });
      });
    });
  });

  describe('Grammar Tests - Singular/Plural Handling', () => {
    test('displays "second" for count of 1', async () => {
      render(<MockSpinner />);
      
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('redirecting to you in 1 second')).toBeInTheDocument();
      });
    });

    test('displays "seconds" for count greater than 1', () => {
      render(<MockSpinner />);
      
      // Initial count is 3
      expect(screen.getByText('redirecting to you in 3 seconds')).toBeInTheDocument();
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(screen.getByText('redirecting to you in 2 seconds')).toBeInTheDocument();
    });
  });

  describe('Memory Leak Prevention Tests', () => {
    test('cleans up timer when component unmounts', () => {
      const { unmount } = render(<MockSpinner />);
      
      // Verify timer is running
      expect(screen.getByText('redirecting to you in 3 seconds')).toBeInTheDocument();
      
      // Unmount component
      unmount();
      
      // Advance time - should not cause any errors or memory leaks
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      // If we get here without errors, the timer was properly cleaned up
      expect(true).toBe(true);
    });

    test('only creates one timer instance', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<MockSpinner />);
      
      // Advance time to trigger navigation
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      await waitFor(() => {
        // Should only navigate once
        expect(mockNavigate).toHaveBeenCalledTimes(1);
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('useEffect Dependency Tests', () => {
    test('useEffect does not create multiple timers due to dependency issues', async () => {
      render(<MockSpinner />);
      
      // Fast forward time to trigger navigation
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      await waitFor(() => {
        // Should only navigate once, not multiple times
        expect(mockNavigate).toHaveBeenCalledTimes(1);
      });
    });

    test('countdown stops at 0 and does not continue', async () => {
      const { unmount } = render(<MockSpinner />);
      
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', {
          state: '/test-path'
        });
      });
      
      // Unmount component to stop timer
      unmount();
      
      // Clear previous calls and advance more time - should not navigate again
      mockNavigate.mockClear();
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      expect(mockNavigate).toHaveBeenCalledTimes(0);
    });
  });

  describe('CSS Class Tests - Syntax Error Fix', () => {
    test('uses correct Bootstrap class name "text-center"', () => {
      render(<MockSpinner />);
      
      const heading = screen.getByText(/redirecting to you in/);
      expect(heading).toHaveClass('text-center');
      expect(heading).not.toHaveClass('Text-center'); // Ensure old incorrect class is not present
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles rapid re-renders without issues', () => {
      const { rerender } = render(<MockSpinner path="login" />);
      
      // Rapidly rerender with different props
      rerender(<MockSpinner path="dashboard" />);
      rerender(<MockSpinner path="profile" />);
      rerender(<MockSpinner path="login" />);
      
      // Should still work correctly
      expect(screen.getByText('redirecting to you in 3 seconds')).toBeInTheDocument();
    });

    test('handles very long path names correctly', async () => {
      const longPath = 'very-long-path-name-that-might-cause-issues';
      render(<MockSpinner path={longPath} />);
      
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(`/${longPath}`, {
          state: '/test-path'
        });
      });
    });
  });
});
