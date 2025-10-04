import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom';
import Footer from './Footer';

// AI attribution: Some test cases are produced with the help of OpenAI ChatGPT(GPT-5) via cursor.
describe('Footer Component', () => {
  // Setup and Cleanup following Jest best practices
  beforeEach(() => {
    // Clean up any previous renders
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Restore all mocks after each test
    jest.restoreAllMocks();
  });

  describe('Rendering Tests', () => {
    test('renders copyright text with correct content', () => {
      // Given: Expected copyright text
      const expectedCopyrightText = 'All rights reserved. © TestingComp';
      
      // When: Footer component is rendered
      render(
        <Router>
          <Footer />
        </Router>
      );
      
      // Then: Copyright text should be present in the document
      const copyrightElement = screen.getByText(expectedCopyrightText);
      expect(copyrightElement).toBeInTheDocument();
      expect(copyrightElement).toHaveClass('text-center');
    });

    test('renders footer container with correct CSS class', () => {
      // Given: Expected CSS class
      const expectedClassName = 'footer';
      
      // When: Footer component is rendered
      const { container } = render(
        <Router>
          <Footer />
        </Router>
      );
      
      // Then: Container should have correct CSS class
      const footerContainer = container.querySelector('.footer');
      expect(footerContainer).toBeInTheDocument();
      expect(footerContainer).toHaveClass(expectedClassName);
    });
  });

  describe('Navigation Links Tests', () => {
    test('renders all navigation links with correct text', () => {
      // Given: Expected navigation link texts
      const expectedLinks = ['About', 'Contact', 'Privacy Policy'];
      
      // When: Footer component is rendered
      render(
        <Router>
          <Footer />
        </Router>
      );
      
      // Then: All navigation links should be present
      expectedLinks.forEach(linkText => {
        const linkElement = screen.getByRole('link', { name: linkText });
        expect(linkElement).toBeInTheDocument();
      });
    });

    test('navigation links have correct href attributes', () => {
      // Given: Expected link paths
      const expectedPaths = {
        'About': '/about',
        'Contact': '/contact',
        'Privacy Policy': '/policy'
      };
      
      // When: Footer component is rendered
      render(
        <Router>
          <Footer />
        </Router>
      );
      
      // Then: Each link should have correct href attribute
      Object.entries(expectedPaths).forEach(([linkText, expectedPath]) => {
        const linkElement = screen.getByRole('link', { name: linkText });
        expect(linkElement).toHaveAttribute('href', expectedPath);
      });
    });

    test('navigation links are properly separated with pipe characters', () => {
      // Given: Footer component with navigation links
      
      // When: Footer component is rendered
      render(
        <Router>
          <Footer />
        </Router>
      );
      
      // Then: Links should be separated by pipe characters
      const aboutLink = screen.getByRole('link', { name: /About/i });
      const contactLink = screen.getByRole('link', { name: /Contact/i });
      const policyLink = screen.getByRole('link', { name: /Privacy Policy/i });
      
      // Verify all links exist
      expect(aboutLink).toBeInTheDocument();
      expect(contactLink).toBeInTheDocument();
      expect(policyLink).toBeInTheDocument();
      
      // Verify links are in the same paragraph (separated by |)
      const paragraph = aboutLink.closest('p');
      expect(paragraph).toContainElement(contactLink);
      expect(paragraph).toContainElement(policyLink);
    });
  });

  describe('CSS Classes and Styling Tests', () => {
    test('applies correct CSS classes to elements', () => {
      // Given: Expected CSS classes
      const expectedClasses = {
        container: 'footer',
        title: 'text-center',
        paragraph: 'text-center mt-3'
      };
      
      // When: Footer component is rendered
      const { container } = render(
        <Router>
          <Footer />
        </Router>
      );
      
      // Then: Elements should have correct CSS classes
      const footerContainer = container.querySelector('.footer');
      const titleElement = screen.getByText(/All Rights Reserved/i);
      const paragraphElement = titleElement.nextElementSibling;
      
      expect(footerContainer).toHaveClass(expectedClasses.container);
      expect(titleElement).toHaveClass(expectedClasses.title);
      expect(paragraphElement).toHaveClass(expectedClasses.paragraph);
    });
  });

  describe('Component Structure Tests', () => {
    test('has correct HTML structure with proper nesting', () => {
      // Given: Expected HTML structure
      
      // When: Footer component is rendered
      const { container } = render(
        <Router>
          <Footer />
        </Router>
      );
      
      // Then: HTML structure should be correct
      const footerContainer = container.querySelector('.footer');
      const titleElement = footerContainer.querySelector('h4');
      const paragraphElement = footerContainer.querySelector('p');
      const links = paragraphElement.querySelectorAll('a');
      
      expect(footerContainer).toBeInTheDocument();
      expect(titleElement).toBeInTheDocument();
      expect(paragraphElement).toBeInTheDocument();
      expect(links).toHaveLength(3);
    });

    test('renders without crashing and produces valid JSX', () => {
      // Given: Footer component
      
      // When: Component is rendered
      const { container } = render(
        <Router>
          <Footer />
        </Router>
      );
      
      // Then: Component should render without errors
      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('footer');
    });
  });
});