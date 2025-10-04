import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Layout from './Layout';

// AI attribution: Some test cases are produced with the help of OpenAI ChatGPT(GPT-5) via cursor.

// Mock Header and Footer components
jest.mock('./Header', () => {
  return function MockHeader() {
    return <div data-testid="header">Header Component</div>;
  };
});

jest.mock('./Footer', () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer Component</div>;
  };
});

// Enhanced Mock react-helmet to capture props
let capturedHelmetProps = {};
jest.mock('react-helmet', () => ({
  Helmet: ({ children }) => {
    // The Helmet component receives children (JSX elements) not individual props
    // Layout.js passes JSX elements as children to Helmet
    return (
      <div data-testid="helmet">
        {children}
      </div>
    );
  }
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>
}));

const MockLayout = ({ children, title, description, keywords, author }) => (
  <BrowserRouter>
    <Layout 
      title={title} 
      description={description} 
      keywords={keywords} 
      author={author}
    >
      {children}
    </Layout>
  </BrowserRouter>
);

describe('Layout Component', () => {
  beforeEach(() => {
    // Reset captured props before each test
    capturedHelmetProps = {};
  });

  test('renders header and footer', () => {
    render(
      <MockLayout>
        <div>Test Content</div>
      </MockLayout>
    );
    
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  test('renders children content', () => {
    render(
      <MockLayout>
        <div data-testid="main-content">Main Content</div>
      </MockLayout>
    );
    
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });

  test('renders toaster component', () => {
    render(
      <MockLayout>
        <div>Test Content</div>
      </MockLayout>
    );
    
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  test('renders helmet with meta tags', () => {
    render(
      <MockLayout 
        title="Test Title"
        description="Test Description"
        keywords="test, keywords"
        author="Test Author"
      >
        <div>Test Content</div>
      </MockLayout>
    );
    
    const helmet = screen.getByTestId('helmet');
    expect(helmet).toBeInTheDocument();
    
    // Verify title and meta tags with correct content
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(helmet.querySelector('meta[name="description"]')).toHaveAttribute('content', 'Test Description');
    expect(helmet.querySelector('meta[name="keywords"]')).toHaveAttribute('content', 'test, keywords');
    expect(helmet.querySelector('meta[name="author"]')).toHaveAttribute('content', 'Test Author');
  });

  test('uses default props when not provided', () => {
    render(
      <MockLayout>
        <div>Test Content</div>
      </MockLayout>
    );
    
    // default Helmet values should be present
    const helmet = screen.getByTestId('helmet');
    expect(helmet).toBeInTheDocument();
    
    // Verify default title and meta tags with correct content
    expect(screen.getByText('Ecommerce app - shop now')).toBeInTheDocument();
    expect(helmet.querySelector('meta[name="description"]')).toHaveAttribute('content', 'mern stack project');
    expect(helmet.querySelector('meta[name="keywords"]')).toHaveAttribute('content', 'mern,react,node,mongodb');
    expect(helmet.querySelector('meta[name="author"]')).toHaveAttribute('content', 'Techinfoyt');
  });

  test('main content has correct styling', () => {
    render(
      <MockLayout>
        <div>Test Content</div>
      </MockLayout>
    );
    
    const main = screen.getByText('Test Content').closest('main');
    expect(main).toHaveStyle({ minHeight: '70vh' });
  });

  test('renders with custom title', () => {
    render(
      <MockLayout title="Custom Title">
        <div>Test Content</div>
      </MockLayout>
    );
    
    expect(screen.getByTestId('helmet')).toBeInTheDocument();
  });

  // Detailed SEO props verification
  describe('SEO and Meta Data - Enhanced', () => {
    test('passes all SEO props to Helmet correctly', () => {
      const customProps = {
        title: "Custom Page Title",
        description: "Custom page description for SEO",
        keywords: "custom, seo, keywords, testing",
        author: "Custom Author Name"
      };
      
      render(
        <MockLayout {...customProps}>
          <div>Test Content</div>
        </MockLayout>
      );
      
      // Verify title appears in the DOM
      expect(screen.getByText(customProps.title)).toBeInTheDocument();
      
      // Verify meta tags with correct content
      const helmet = screen.getByTestId('helmet');
      expect(helmet.querySelector('meta[name="description"]')).toHaveAttribute('content', customProps.description);
      expect(helmet.querySelector('meta[name="keywords"]')).toHaveAttribute('content', customProps.keywords);
      expect(helmet.querySelector('meta[name="author"]')).toHaveAttribute('content', customProps.author);
    });

    test('handles partial SEO props correctly', () => {
      render(
        <MockLayout title="Only Title" description="Only Description">
          <div>Test Content</div>
        </MockLayout>
      );
      
      // Verify provided props appear in DOM
      expect(screen.getByText("Only Title")).toBeInTheDocument();
      
      // Verify provided meta tags and default values
      const helmet = screen.getByTestId('helmet');
      expect(helmet.querySelector('meta[name="description"]')).toHaveAttribute('content', "Only Description");
      expect(helmet.querySelector('meta[name="keywords"]')).toHaveAttribute('content', "mern,react,node,mongodb");
      expect(helmet.querySelector('meta[name="author"]')).toHaveAttribute('content', "Techinfoyt");
    });
  });

  // Error boundary testing
  describe('Error Handling', () => {
    test('renders successfully with null children', () => {
      render(
        <MockLayout>
          {null}
        </MockLayout>
      );
      
      // Layout should handle null children gracefully
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    test('renders successfully with undefined children', () => {
      render(
        <MockLayout>
          {undefined}
        </MockLayout>
      );
      
      // Layout should handle undefined children gracefully
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    test('renders successfully with empty children', () => {
      render(
        <MockLayout>
          {[]}
        </MockLayout>
      );
      
      // Layout should handle empty array children gracefully
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  // Complete default props validation
  describe('Default Props Validation', () => {
    test('uses all default props correctly when none provided', () => {
      render(
        <MockLayout>
          <div>Test Content</div>
        </MockLayout>
      );
      
      // Verify default title appears in DOM
      expect(screen.getByText('Ecommerce app - shop now')).toBeInTheDocument();
      
      // Verify default meta tags with correct content
      const helmet = screen.getByTestId('helmet');
      expect(helmet.querySelector('meta[name="description"]')).toHaveAttribute('content', 'mern stack project');
      expect(helmet.querySelector('meta[name="keywords"]')).toHaveAttribute('content', 'mern,react,node,mongodb');
      expect(helmet.querySelector('meta[name="author"]')).toHaveAttribute('content', 'Techinfoyt');
    });

    test('default props match expected values', () => {
      // This test ensures our test defaults match the actual component defaults
      const expectedDefaults = {
        title: "Ecommerce app - shop now",
        description: "mern stack project", 
        keywords: "mern,react,node,mongodb",
        author: "Techinfoyt"
      };
      
      render(
        <MockLayout>
          <div>Test Content</div>
        </MockLayout>
      );
      
      // Verify default title appears in the DOM
      expect(screen.getByText(expectedDefaults.title)).toBeInTheDocument();
      
      // Verify all default meta tags with correct content
      const helmet = screen.getByTestId('helmet');
      expect(helmet.querySelector('meta[name="description"]')).toHaveAttribute('content', expectedDefaults.description);
      expect(helmet.querySelector('meta[name="keywords"]')).toHaveAttribute('content', expectedDefaults.keywords);
      expect(helmet.querySelector('meta[name="author"]')).toHaveAttribute('content', expectedDefaults.author);
    });
  });
});
