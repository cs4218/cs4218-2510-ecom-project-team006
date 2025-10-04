import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Pagenotfound from './Pagenotfound';

// AI attribution: Some test cases are produced with the help of OpenAI ChatGPT(GPT-5) via cursor.

// Mock Layout component
jest.mock('../components/Layout', () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout">
        <div data-testid="layout-title">{title}</div>
        {children}
      </div>
    );
  };
});

const MockPagenotfound = () => (
  <BrowserRouter>
    <Pagenotfound />
  </BrowserRouter>
);

describe('Pagenotfound Page - Comprehensive Tests', () => {
  describe('Core Functionality Tests', () => {
    test('displays 404 error information correctly', () => {
      render(<MockPagenotfound />);
      
      // Verify 404 error code is displayed
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('404')).toHaveClass('pnf-title');
      
      // Verify error message is displayed
      expect(screen.getByText('Oops ! Page Not Found')).toBeInTheDocument();
      expect(screen.getByText('Oops ! Page Not Found')).toHaveClass('pnf-heading');
    });

    test('navigation link functions correctly', () => {
      render(<MockPagenotfound />);
      
      // Verify Go Back link exists and has correct attributes
      const goBackLink = screen.getByText('Go Back');
      expect(goBackLink).toBeInTheDocument();
      expect(goBackLink).toHaveAttribute('href', '/');
      expect(goBackLink).toHaveClass('pnf-btn');
      expect(goBackLink.tagName).toBe('A');
    });

    test('integrates correctly with Layout component', () => {
      render(<MockPagenotfound />);
      
      // Verify Layout component is rendered
      expect(screen.getByTestId('layout')).toBeInTheDocument();
      
      // Verify Layout receives correct title
      expect(screen.getByTestId('layout-title')).toHaveTextContent('go back- page not found');
    });
  });

  describe('Content Validation Tests', () => {
    test('all text content displays correctly', () => {
      render(<MockPagenotfound />);
      
      // Verify all text content is present
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Oops ! Page Not Found')).toBeInTheDocument();
      expect(screen.getByText('Go Back')).toBeInTheDocument();
    });

    test('heading structure is correct', () => {
      render(<MockPagenotfound />);
      
      // Verify heading hierarchy
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      
      expect(h1).toHaveTextContent('404');
      expect(h2).toHaveTextContent('Oops ! Page Not Found');
      
      // Verify heading classes
      expect(h1).toHaveClass('pnf-title');
      expect(h2).toHaveClass('pnf-heading');
    });

    test('link text and attributes are correct', () => {
      render(<MockPagenotfound />);
      
      const goBackLink = screen.getByText('Go Back');
      
      // Verify link text
      expect(goBackLink).toHaveTextContent('Go Back');
      
      // Verify link attributes
      expect(goBackLink).toHaveAttribute('href', '/');
      expect(goBackLink).toHaveClass('pnf-btn');
      
      // Verify it's a proper link element
      expect(goBackLink.tagName).toBe('A');
    });
  });
});
