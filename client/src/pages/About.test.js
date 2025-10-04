import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import About from './About';

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

const MockAbout = () => (
  <BrowserRouter>
    <About />
  </BrowserRouter>
);

describe('About Page - Comprehensive Tests', () => {
  describe('Content Completeness Tests', () => {
    test('image displays correctly', () => {
      render(<MockAbout />);
      
      const image = screen.getByAltText('About us');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/images/about.jpeg');
      expect(image).toHaveStyle({ width: '100%' });
    });
  });

  describe('Style and Layout Tests', () => {
    test('Bootstrap classes are applied correctly', () => {
      render(<MockAbout />);
      
      // Verify main container classes
      const section = document.querySelector('section.about-section');
      expect(section).toHaveClass('about-section');
      
      const row = section.querySelector('.row');
      expect(row).toHaveClass('about-us');
      
      // Verify column classes
      const columns = row.querySelectorAll('.col-md-6');
      expect(columns).toHaveLength(2);
      columns.forEach(column => {
        expect(column).toHaveClass('col-md-6');
      });
      
      // Verify heading classes
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveClass('text-center', 'mb-4');
      
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveClass('mb-3');
      
      const h3Elements = screen.getAllByRole('heading', { level: 3 });
      h3Elements.forEach(h3 => {
        expect(h3).toHaveClass('mt-4', 'mb-3');
      });
      
      // Verify list classes
      const list = screen.getByRole('list');
      expect(list).toHaveClass('list-unstyled');
      
      // Verify paragraph classes
      const paragraphs = screen.getAllByText(/Welcome to Virtual Vault|Our mission is to make quality products accessible/);
      paragraphs.forEach(p => {
        expect(p).toHaveClass('text-justify');
      });
    });

    test('responsive layout structure is correct', () => {
      render(<MockAbout />);
      
      // Verify Bootstrap grid structure
      const row = document.querySelector('.row.about-us');
      expect(row).toBeInTheDocument();
      
      const columns = row.querySelectorAll('.col-md-6');
      expect(columns).toHaveLength(2);
      
      // Verify each column has correct Bootstrap classes
      columns.forEach(column => {
        expect(column).toHaveClass('col-md-6');
      });
      
      // Verify image is in first column
      const imageColumn = columns[0];
      const image = imageColumn.querySelector('img');
      expect(image).toBeInTheDocument();
      
      // Verify content is in second column
      const contentColumn = columns[1];
      const h1 = contentColumn.querySelector('h1');
      expect(h1).toBeInTheDocument();
    });

    test('semantic CSS class names are correct', () => {
      render(<MockAbout />);
      
      // Verify semantic class names
      const section = document.querySelector('section.about-section');
      expect(section).toHaveClass('about-section');
      expect(section).not.toHaveClass('contactus');
      
      const row = section.querySelector('.row');
      expect(row).toHaveClass('about-us');
      expect(row).not.toHaveClass('contactus');
      
      // Verify image alt attribute is correct
      const image = screen.getByAltText('About us');
      expect(image).toHaveAttribute('alt', 'About us');
      expect(image).not.toHaveAttribute('alt', 'contactus');
    });
  });

  describe('Accessibility Tests', () => {
    test('images have correct alt attributes', () => {
      render(<MockAbout />);
      
      const image = screen.getByAltText('About us');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('alt', 'About us');
      expect(image).toHaveAttribute('src', '/images/about.jpeg');
    });

    test('uses proper semantic HTML structure', () => {
      render(<MockAbout />);
      
      // Verify semantic section tag
      const section = document.querySelector('section.about-section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveClass('about-section');
      
      // Verify proper heading hierarchy
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('About Us');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Our Story');
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
      
      // Verify list structure
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      expect(list).toHaveClass('list-unstyled');
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(5);
    });

    test('heading structure is accessible', () => {
      render(<MockAbout />);
      
      // Verify heading hierarchy is correct
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      const h3Elements = screen.getAllByRole('heading', { level: 3 });
      
      expect(h1).toBeInTheDocument();
      expect(h2).toBeInTheDocument();
      expect(h3Elements).toHaveLength(2);
      
      // Verify heading content and accessibility
      expect(h1).toHaveTextContent('About Us');
      expect(h2).toHaveTextContent('Our Story');
      expect(h3Elements[0]).toHaveTextContent('Our Mission');
      expect(h3Elements[1]).toHaveTextContent('Why Choose Us?');
      
      // Verify heading classes for styling
      expect(h1).toHaveClass('text-center', 'mb-4');
      expect(h2).toHaveClass('mb-3');
      h3Elements.forEach(h3 => {
        expect(h3).toHaveClass('mt-4', 'mb-3');
      });
    });
  });
});
