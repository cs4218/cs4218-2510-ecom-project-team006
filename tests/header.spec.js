import { test, expect } from '@playwright/test';

// AI attribution: OpenAI ChatGPT(GPT-4) via Cursor was used to help generate Playwright test cases and assertions for the Header component.

test.describe.configure({ mode: 'parallel' });

const TEST_USER = {
  email: 'cs4218@test.com',
  password: 'cs4218@test.com',
  name: 'CS 4218 Test Account'
};

test.describe('Header Component - Guest User', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
  });

  test('should display brand logo and name', async ({ page }) => {
    const brandLogo = page.locator('.navbar-brand');
    await expect(brandLogo).toBeVisible();
    await expect(brandLogo).toContainText('Virtual Vault');
  });

  test('should display main navigation links', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Categories/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cart' })).toBeVisible();
  });

  test('should display Register and Login links for guest users', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  });

  test('should display search input', async ({ page }) => {
    await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible();
  });

  test('should display cart badge with count', async ({ page }) => {
    const cartBadge = page.locator('.ant-badge');
    await expect(cartBadge).toBeVisible();
  });

  test('should navigate to home when clicking brand logo', async ({ page }) => {
    await page.goto('http://localhost:3000/about');
    await page.locator('.navbar-brand').click();
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('should navigate to register page when clicking Register', async ({ page }) => {
    await page.getByRole('link', { name: 'Register' }).click();
    await expect(page).toHaveURL(/.*\/register/);
  });

  test('should navigate to login page when clicking Login', async ({ page }) => {
    await page.getByRole('link', { name: 'Login' }).click();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should navigate to cart page when clicking Cart', async ({ page }) => {
    await page.getByRole('link', { name: 'Cart' }).click();
    await expect(page).toHaveURL(/.*\/cart/);
  });

  test('should display categories dropdown', async ({ page }) => {
    const categoriesLink = page.locator('text=Categories').first();
    await expect(categoriesLink).toBeVisible();
  });

  test('should show categories dropdown on click', async ({ page }) => {
    // Click categories dropdown
    await page.locator('.dropdown-toggle', { hasText: 'Categories' }).click();
    
    // Verify "All Categories" link appears
    await expect(page.locator('.dropdown-menu').getByText('All Categories')).toBeVisible();
  });

  test('should navigate to all categories page', async ({ page }) => {
    await page.locator('.dropdown-toggle', { hasText: 'Categories' }).click();
    await page.locator('.dropdown-menu').getByText('All Categories').click();
    await expect(page).toHaveURL(/.*\/categories/);
  });
});

test.describe('Header Component - Logged In User', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.getByPlaceholder('Enter Your Email').fill(TEST_USER.email);
    await page.getByPlaceholder('Enter Your Password').fill(TEST_USER.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();
    // App behavior: after successful login, it redirects to home ('/') by default
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 10000 });
    await page.goto('http://localhost:3000/');
  });

  test('should display user name instead of Register/Login', async ({ page }) => {
    await expect(page.locator(`text=${TEST_USER.name}`)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).not.toBeVisible();
  });

  test('should display user dropdown menu', async ({ page }) => {
    const userDropdown = page.locator('.dropdown-toggle', { hasText: TEST_USER.name });
    await expect(userDropdown).toBeVisible();
  });

  test('should show Dashboard and Logout in user dropdown', async ({ page }) => {
    await page.locator(`text=${TEST_USER.name}`).click();
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
  });

  test('should navigate to user dashboard when clicking Dashboard', async ({ page }) => {
    await page.locator(`text=${TEST_USER.name}`).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/.*\/dashboard\/user/);
  });

  test('should logout successfully when clicking Logout', async ({ page }) => {
    await page.locator(`text=${TEST_USER.name}`).click();
    await page.getByRole('link', { name: 'Logout' }).click();
    
    // Verify redirect to login page
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should show Register and Login after logout', async ({ page }) => {
    // Logout
    await page.locator(`text=${TEST_USER.name}`).click();
    await page.getByRole('link', { name: 'Logout' }).click();
    
    // Go to home
    await page.goto('http://localhost:3000/');
    
    // Verify guest links are back
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  });
});

test.describe('Header Component - Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
  });

  test('should have search input with placeholder', async ({ page }) => {
    const searchInput = page.getByRole('searchbox', { name: 'Search' });
    await expect(searchInput).toHaveAttribute('placeholder', 'Search');
  });

  test('should have search button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
  });

  test('should perform search when clicking search button', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Search' }).fill('book');
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Should navigate to search results
    await expect(page).toHaveURL(/.*\/search/);
  });
});

test.describe('Header Component - Responsive', () => {
  test('should display mobile toggle button on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/');
    
    const toggleButton = page.locator('.navbar-toggler');
    await expect(toggleButton).toBeVisible();
  });

  test('should expand menu when clicking toggle on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/');
    
    // Click toggle button
    await page.locator('.navbar-toggler').click();
    
    // Menu should be visible
    const navbar = page.locator('#navbarTogglerDemo01');
    await expect(navbar).toBeVisible();
  });
});

test.describe('Header Component - Cart Badge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
  });

  test('should show cart count as 0 initially', async ({ page }) => {
    const badge = page.locator('.ant-badge-count');
    await expect(badge).toContainText('0');
  });

  test('should update cart count when adding product', async ({ page }) => {
    // Add a product to cart (if products exist on home page)
    const addToCartButton = page.getByRole('button', { name: 'ADD TO CART' }).first();
    const isVisible = await addToCartButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await addToCartButton.click();
      
      // Cart count should increase
      const badge = page.locator('.ant-badge-count');
      await expect(badge).toContainText('1');
    }
  });
});

test.describe('Header Component - Categories Dropdown', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
  });

  test('should highlight categories when on category page', async ({ page }) => {
    await page.goto('http://localhost:3000/categories');
    
    const categoriesLink = page.locator('.nav-link.dropdown-toggle', { hasText: 'Categories' });
    await expect(categoriesLink).toHaveClass(/active/);
  });

  test('should highlight categories when on specific category page', async ({ page }) => {
    // Click on a category
    await page.locator('.dropdown-toggle', { hasText: 'Categories' }).click();
    
    // Get category links from dropdown
    const categoryLinks = page.locator('.dropdown-menu .dropdown-item');
    const count = await categoryLinks.count();
    
    if (count > 1) {
      // Click second link (first is "All Categories")
      await categoryLinks.nth(1).click();
      
      // Categories should be highlighted
      const categoriesLink = page.locator('.nav-link.dropdown-toggle', { hasText: 'Categories' });
      await expect(categoriesLink).toHaveClass(/active/);
    }
  });
});
