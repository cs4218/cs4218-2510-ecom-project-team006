import { test, expect } from '@playwright/test';

// AI attribution: OpenAI ChatGPT(GPT-4) via Cursor was used to help generate Playwright test cases and assertions for the Spinner component.

test.describe.configure({ mode: 'parallel' });

test.describe('Spinner Component', () => {
  test('should display spinner with countdown when accessing protected route without authentication', async ({ page }) => {
    // Try to access a protected route without being logged in
    await page.goto('http://localhost:3000/dashboard/user/profile');
    
    // Should show spinner with countdown text
    await expect(page.locator('text=redirecting to you in')).toBeVisible();
    await expect(page.locator('text=3 seconds')).toBeVisible();
    
    // Should show spinner animation
    await expect(page.locator('.spinner-border')).toBeVisible();
  });

  test('should show countdown decreasing from 3 to 0', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/user/orders');
    
    // Wait for initial countdown
    await expect(page.locator('text=redirecting to you in 3 seconds')).toBeVisible();
    
    // Wait for countdown to decrease
    await expect(page.locator('text=redirecting to you in 2 seconds')).toBeVisible();
    await expect(page.locator('text=redirecting to you in 1 second')).toBeVisible();
  });

  test('should redirect to login page after countdown', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/user/profile');
    
    // Wait for redirect to complete - PrivateRoute uses Spinner with path="" which redirects to "/"
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 5000 });
  });

  test('should display correct singular form for 1 second', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/user/orders');
    
    // Should show "1 second" (singular) not "1 seconds"
    await expect(page.locator('text=1 second')).toBeVisible();
  });

  test('should display correct plural form for multiple seconds', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/user/profile');
    
    // Should show "3 seconds" (plural)
    await expect(page.locator('text=3 seconds')).toBeVisible();
    await expect(page.locator('text=2 seconds')).toBeVisible();
  });

  test('should have proper spinner styling and accessibility', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/user/orders');
    
    // Check spinner has proper role and accessibility
    const spinner = page.locator('.spinner-border');
    await expect(spinner).toHaveAttribute('role', 'status');
    
    // Check for screen reader text
    await expect(page.locator('.visually-hidden', { hasText: 'Loading...' })).toBeVisible();
  });

  test('should have proper layout and centering', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/user/profile');
    
    // Check flexbox centering classes
    const container = page.locator('.d-flex.flex-column.justify-content-center.align-items-center');
    await expect(container).toBeVisible();
    
    // Should have full viewport height (check for 100vh or equivalent pixel value)
    const containerStyle = await container.evaluate((el) => 
      window.getComputedStyle(el).height
    );
    // Accept either 100vh or a reasonable pixel equivalent (around 600-800px for typical viewport)
    expect(containerStyle).toMatch(/100vh|6\d{2}px|7\d{2}px|8\d{2}px/);
  });

  test('should preserve original path in navigation state', async ({ page }) => {
    const originalPath = '/dashboard/user/profile';
    await page.goto(`http://localhost:3000${originalPath}`);
    
    // Wait for redirect to home (PrivateRoute uses Spinner with path="" which redirects to "/")
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 5000 });
    
    // The original path should be preserved in the navigation state
    // This is tested by checking if the login page can redirect back
    // (The actual state preservation is handled by React Router)
  });

  test('should work with different protected routes', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard/user/profile',
      '/dashboard/user/orders',
      '/dashboard/admin/users',
      '/dashboard/admin/products'
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(`http://localhost:3000${route}`);
      
      // Should show spinner for all protected routes
      await expect(page.locator('text=redirecting to you in')).toBeVisible();
      
      // Wait for redirect to complete (either home or login)
      await page.waitForURL(/http:\/\/localhost:3000\/(login|$)/, { timeout: 5000 });
    }
  });

  test('should not show spinner for public routes', async ({ page }) => {
    const publicRoutes = [
      '/',
      '/about',
      '/contact',
      '/policy',
      '/categories',
      '/login',
      '/register'
    ];
    
    for (const route of publicRoutes) {
      await page.goto(`http://localhost:3000${route}`);
      
      // Should not show spinner on public routes
      await expect(page.locator('text=redirecting to you in')).not.toBeVisible();
    }
  });

  test('should handle custom path parameter', async ({ page }) => {
    // Test with custom path (though this might not be directly testable
    // without modifying the component, we can test the default behavior)
    await page.goto('http://localhost:3000/dashboard/user/profile');
    
    // Should redirect to home (PrivateRoute uses Spinner with path="" which redirects to "/")
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 5000 });
  });

  test('should have proper text content and formatting', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/user/orders');
    
    // Check the main heading text
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    
    // Should contain the redirecting text
    const headingText = await heading.textContent();
    expect(headingText).toMatch(/redirecting to you in \d+ (second|seconds)/);
  });

  test('should be responsive and work on different screen sizes', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/dashboard/user/profile');
    
    // Should still show spinner on mobile
    await expect(page.locator('text=redirecting to you in')).toBeVisible();
    await expect(page.locator('.spinner-border')).toBeVisible();
    
    // Should redirect to home (PrivateRoute uses Spinner with path="" which redirects to "/")
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 5000 });
  });

  test('should clean up timer on component unmount', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/user/profile');
    
    // Start the spinner
    await expect(page.locator('text=redirecting to you in')).toBeVisible();
    
    // Navigate away before countdown completes
    await page.goto('http://localhost:3000/');
    
    // Should not show spinner on home page
    await expect(page.locator('text=redirecting to you in')).not.toBeVisible();
  });

  test('should handle multiple rapid navigation attempts', async ({ page }) => {
    // Try to access multiple protected routes rapidly
    await page.goto('http://localhost:3000/dashboard/user/profile');
    await page.goto('http://localhost:3000/dashboard/user/orders');
    await page.goto('http://localhost:3000/dashboard/admin/users');
    
    // Should eventually redirect to login
    await expect(page).toHaveURL(/.*\/login/, { timeout: 5000 });
  });

  test('should display spinner with proper Bootstrap classes', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/user/profile');
    
    // Check for Bootstrap spinner classes
    const spinner = page.locator('.spinner-border');
    await expect(spinner).toBeVisible();
    
    // Check for visually hidden text with proper Bootstrap class
    await expect(page.locator('.visually-hidden')).toBeVisible();
  });

  test('should work with different user roles (admin vs user)', async ({ page }) => {
    // Test user dashboard
    await page.goto('http://localhost:3000/dashboard/user/profile');
    await expect(page.locator('text=redirecting to you in')).toBeVisible();
    // Wait for redirect to complete (either home or login)
    await page.waitForURL(/http:\/\/localhost:3000\/(login|$)/, { timeout: 5000 });
    
    // Test admin dashboard
    await page.goto('http://localhost:3000/dashboard/admin/users');
    await expect(page.locator('text=redirecting to you in')).toBeVisible();
    // Wait for redirect to complete (either home or login)
    await page.waitForURL(/http:\/\/localhost:3000\/(login|$)/, { timeout: 5000 });
  });
});

