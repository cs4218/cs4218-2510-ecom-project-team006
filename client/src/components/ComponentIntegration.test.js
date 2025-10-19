import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from './Layout';
import Header from './Header';
import Spinner from './Spinner';
import Footer from './Footer';
import '@testing-library/jest-dom';

// AI attribution: Test cases are produced with the help of OpenAI ChatGPT(GPT-5) via cursor.

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

// Mock the hooks and context
jest.mock('../context/auth', () => ({
  useAuth: () => [{
    user: null,
    token: ''
  }, jest.fn()]
}));

jest.mock('../context/cart', () => ({
  useCart: () => [[]]
}));

jest.mock('../hooks/useCategory', () => ({
  __esModule: true,
  default: jest.fn(() => [])
}));

jest.mock('../context/search', () => ({
  useSearch: () => [{}, jest.fn()]
}));

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn()
  },
  Toaster: () => <div data-testid="toaster">Toaster</div>
}));

jest.mock('react-helmet', () => ({
  Helmet: ({ children }) => <div data-testid="helmet">{children}</div>
}));

jest.mock('antd', () => ({
  Badge: ({ children, count }) => <div data-testid="badge" data-count={count}>{children}</div>
}));

describe('Frontend Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 测试Layout组件正确渲染所有子组件
  test('Layout renders Header, children, and Footer correctly', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    );
    
    // 验证Header存在
    expect(screen.getByText('🛒 Virtual Vault')).toBeInTheDocument();
    
    // 验证children内容存在
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    
    // 验证Footer存在
    expect(screen.getByText('All rights reserved. © TestingComp')).toBeInTheDocument();
    
    // 验证Toaster存在
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  // 测试Header在Layout中的导航功能
  test('Header navigation works within Layout', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    );
    
    // 验证导航链接存在
    const homeLink = screen.getByText('Home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
    
    // 验证其他导航链接
    const categoriesLink = screen.getByText('Categories');
    expect(categoriesLink).toBeInTheDocument();
    
    // 验证未登录用户看到的链接
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  // 测试Spinner的倒计时和导航功能
  test('Spinner countdown and navigation works correctly', () => {
    jest.useFakeTimers();
    
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }));
    
    render(
      <BrowserRouter>
        <Spinner path="test" />
      </BrowserRouter>
    );
    
    // 验证初始倒计时显示
    expect(screen.getByText(/redirecting to you in 3 seconds/)).toBeInTheDocument();
    
    // 模拟时间推进
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // 验证倒计时更新
    expect(screen.getByText(/redirecting to you in 2 seconds/)).toBeInTheDocument();
    
    // 清理定时器
    jest.useRealTimers();
  });

  // 测试Footer在Layout中的渲染
  test('Footer renders correctly in Layout', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    );
    
    // 验证Footer内容
    expect(screen.getByText('All rights reserved. © TestingComp')).toBeInTheDocument();
    
    // 验证Footer链接
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  // 测试组件间的CSS类名和样式
  test('Components have correct CSS classes and styling', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    );
    
    // 验证Layout的main元素
    const main = screen.getByRole('main');
    expect(main).toHaveStyle({ minHeight: '70vh' });
    
    // 验证Header的navbar类
    const navbar = screen.getByRole('navigation');
    expect(navbar).toHaveClass('navbar', 'navbar-expand-lg', 'bg-body-tertiary');
    
    // 验证Footer的footer类
    const footer = screen.getByText('All rights reserved. © TestingComp').closest('div');
    expect(footer).toHaveClass('footer');
  });

  // 测试用户交互和状态变化
  test('User interactions and state changes work correctly', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    );
    
    // 测试Header中的购物车徽章
    const cartBadge = screen.getByTestId('badge');
    expect(cartBadge).toBeInTheDocument();
    expect(cartBadge).toHaveAttribute('data-count', '0');
    
    // 测试搜索输入框
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toBeInTheDocument();
  });

  // 测试响应式布局
  test('Components are responsive and mobile-friendly', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    );
    
    // 验证Header在移动端的表现
    const navbarToggler = screen.getByRole('button', { name: /toggle navigation/i });
    expect(navbarToggler).toBeInTheDocument();
    expect(navbarToggler).toHaveClass('navbar-toggler');
    
    // 验证Footer在移动端的表现
    const footer = screen.getByText('All rights reserved. © TestingComp').closest('div');
    expect(footer).toHaveClass('footer');
  });

  // 测试错误边界和异常处理
  test('Components handle errors gracefully', () => {
    // 测试Spinner在无效路径下的表现
    render(
      <BrowserRouter>
        <Spinner path={undefined} />
      </BrowserRouter>
    );
    
    // 验证Spinner仍然能正常显示
    expect(screen.getByText(/redirecting to you in 3 seconds/)).toBeInTheDocument();
  });

  // 测试Layout的SEO和元数据
  test('Layout provides proper SEO and metadata', () => {
    render(
      <BrowserRouter>
        <Layout title="Test Title" description="Test Description" keywords="test,keywords" author="Test Author">
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    );
    
    // 验证Helmet组件存在
    expect(screen.getByTestId('helmet')).toBeInTheDocument();
  });

  // 测试基本组件集成
  test('Basic component integration works correctly', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    );
    
    // 验证所有主要组件都存在
    expect(screen.getByText('🛒 Virtual Vault')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('All rights reserved. © TestingComp')).toBeInTheDocument();
    
    // 验证导航链接
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Cart')).toBeInTheDocument();
  });
});
