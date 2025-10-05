import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import UserMenu from './UserMenu';

describe('UserMenu component', () => {
  test('renders Dashboard header and Profile/Orders links', () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
  });

  test('links have correct href attributes', () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    const profileLink = screen.getByText('Profile').closest('a');
    const ordersLink = screen.getByText('Orders').closest('a');

    expect(profileLink).toHaveAttribute('href', '/dashboard/user/profile');
    expect(ordersLink).toHaveAttribute('href', '/dashboard/user/orders');
  });

  test('navigates to the Profile page when Profile link is clicked', () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<UserMenu />} />
          <Route path="/dashboard/user/profile" element={<div>Profile Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Click Profile
    fireEvent.click(screen.getByText('Profile'));
    expect(screen.getByText('Profile Page')).toBeInTheDocument();
  });

  test('navigates to the Orders page when Orders link is clicked', () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<UserMenu />} />
          <Route path="/dashboard/user/orders" element={<div>Orders Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Click Orders
    fireEvent.click(screen.getByText('Orders'));
    expect(screen.getByText('Orders Page')).toBeInTheDocument();
  });
});
