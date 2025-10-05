import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Login from './Login';

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

// shared mock for setAuth so tests can assert it was called
const mockSetAuth = jest.fn();
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, mockSetAuth])
}));

// mock useNavigate so we can assert navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useNavigate: () => mockNavigate,
  };
});

  jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
  }));
    
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
  }));  

  Object.defineProperty(window, 'localStorage', {
    value: {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
  });

window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
  };  

describe('Login Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders login form', () => {
        const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </MemoryRouter>
        );
    
        expect(getByText('LOGIN FORM')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
      });
      it('inputs should be initially empty', () => {
        const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </MemoryRouter>
        );
    
        expect(getByText('LOGIN FORM')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Email').value).toBe('');
        expect(getByPlaceholderText('Enter Your Password').value).toBe('');
      });
    
      it('should allow typing email and password', () => {
        const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </MemoryRouter>
        );
        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        expect(getByPlaceholderText('Enter Your Email').value).toBe('test@example.com');
        expect(getByPlaceholderText('Enter Your Password').value).toBe('password123');
      });
      
    it('should login the user successfully', async () => {
        axios.post.mockResolvedValueOnce({
            data: {
                success: true,
                user: { id: 1, name: 'John Doe', email: 'test@example.com' },
                token: 'mockToken'
            }
        });

        const { getByPlaceholderText, getByText } = render(
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        fireEvent.click(getByText('LOGIN'));

        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(toast.success).toHaveBeenCalledWith(undefined, {
            duration: 5000,
            icon: '🙏',
            style: {
                background: 'green',
                color: 'white'
            }
        });
    });

    it('should display error message on failed login', async () => {
        axios.post.mockRejectedValueOnce({ message: 'Invalid credentials' });

        const { getByPlaceholderText, getByText } = render(
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        fireEvent.click(getByText('LOGIN'));

        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });

  it('sends correct payload to /api/v1/auth/login', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true, user: { id: 2 }, token: 't' } });

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'pw' } });
    fireEvent.click(getByText('LOGIN'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/login', { email: 'a@b.com', password: 'pw' });
  });

  it('calls setAuth and localStorage on successful login', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true, user: { id: 3 }, token: 'tok' } });

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'x@y.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'pw' } });
    fireEvent.click(getByText('LOGIN'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(mockSetAuth).toHaveBeenCalled();
    expect(window.localStorage.setItem).toHaveBeenCalledWith('auth', JSON.stringify({ success: true, user: { id: 3 }, token: 'tok' }));
  });

  it('navigates to provided location.state after login if present', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true, user: { id: 4 }, token: 'tok2' } });

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={[{ pathname: '/login', state: '/checkout' }] }>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'p@q.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'pw' } });
    fireEvent.click(getByText('LOGIN'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });

  it('shows server message when login returns success:false', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: false, message: 'No account' } });

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'no@one.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'pw' } });
    fireEvent.click(getByText('LOGIN'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('No account');
  });
});
