import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth';
import axios from 'axios';

// small test consumer to read and update auth
function TestConsumer() {
  const [auth, setAuth] = useAuth();

  return (
    <div>
      <div data-testid="user">{auth?.user?.name ?? ''}</div>
      <div data-testid="token">{auth?.token ?? ''}</div>
      <button
        onClick={() =>
          setAuth({
            user: { name: 'Bob' },
            token: 'new-token',
          })
        }
      >
        Change
      </button>
    </div>
  );
}

describe('Auth context', () => {
  const ORIGINAL = { ...axios.defaults.headers.common };

  afterEach(() => {
    // restore axios defaults and localStorage
    axios.defaults.headers.common = { ...ORIGINAL };
    localStorage.removeItem('auth');
  });

  it('hydrates state from localStorage and sets axios Authorization header', async () => {
    localStorage.setItem(
      'auth',
      JSON.stringify({ user: { name: 'Alice' }, token: 'my-token' })
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // wait for effect to run and UI to update
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Alice'));
    expect(screen.getByTestId('token').textContent).toBe('my-token');

    // axios header should be set to token
    expect(axios.defaults.headers.common['Authorization']).toBe('my-token');
  });

  it('updates state and axios header when setAuth is called', async () => {
    // start with empty storage
    localStorage.removeItem('auth');

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // initial values should be empty
    expect(screen.getByTestId('user').textContent).toBe('');
    expect(screen.getByTestId('token').textContent).toBe('');

    // click button to change auth
    fireEvent.click(screen.getByText('Change'));

    // UI and axios header should update
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Bob'));
    expect(screen.getByTestId('token').textContent).toBe('new-token');
    expect(axios.defaults.headers.common['Authorization']).toBe('new-token');
  });
});
