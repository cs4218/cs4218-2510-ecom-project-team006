import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';

// Mocks
jest.mock('axios');
jest.mock('../../context/auth', () => ({ useAuth: jest.fn() }));
jest.mock('react-router-dom', () => ({ Outlet: () => <div>OUTLET</div> }));
jest.mock('../Spinner', () => () => <div>SPINNER</div>);

const { useAuth } = require('../../context/auth');

import PrivateRoute from './Private';

describe('PrivateRoute', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders Outlet when token present and server returns ok=true', async () => {
    useAuth.mockReturnValue([{ token: 'abc' }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { ok: true } });

    render(<PrivateRoute />);

  await waitFor(() => expect(screen.getByText('OUTLET')).toBeTruthy());
    expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/user-auth');
  });

  it('renders Spinner when token present but server returns ok=false', async () => {
    useAuth.mockReturnValue([{ token: 'abc' }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { ok: false } });

    render(<PrivateRoute />);

  await waitFor(() => expect(screen.getByText('SPINNER')).toBeTruthy());
  });

  it('does not call axios and renders Spinner when no token present', async () => {
    useAuth.mockReturnValue([null, jest.fn()]);

    render(<PrivateRoute />);

  await waitFor(() => expect(screen.getByText('SPINNER')).toBeTruthy());
    expect(axios.get).not.toHaveBeenCalled();
  });
});
