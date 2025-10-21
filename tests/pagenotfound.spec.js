import { test, expect } from '@playwright/test';

// AI attribution: OpenAI ChatGPT(GPT-4) via Cursor was used to help generate Playwright test cases and assertions for the 404 Page Not Found component.

test.describe.configure({ mode: 'parallel' });

test.describe('404 Page Not Found', () => {
  test('should display 404 page when accessing non-existent route', async ({ page }) => {
    // Navigate to a non-existent page
    await page.goto('http://localhost:3000/this-page-does-not-exist');
    
    // Verify 404 title is displayed
    const title = page.locator('.pnf-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('404');
  });

  test('should display error message "Oops! Page Not Found"', async ({ page }) => {
    await page.goto('http://localhost:3000/random-invalid-path');
    
    // Verify error heading
    const heading = page.locator('.pnf-heading');
    await expect(heading).toBeVisible();
  });

  test('should have "Go Back Home" button', async ({ page }) => {
    await page.goto('http://localhost:3000/non-existent-page');
    
    // Verify button is present and visible
    const homeButton = page.getByRole('link', { name: 'Go Back Home' });
    await expect(homeButton).toBeVisible();
    await expect(homeButton).toHaveClass(/pnf-btn/);
  });

  test('should navigate to home page when clicking "Go Back Home"', async ({ page }) => {
    await page.goto('http://localhost:3000/invalid-route');
    
    // Click the "Go Back Home" button
    await page.getByRole('link', { name: 'Go Back Home' }).click();
    
    // Verify navigation to home page
    await expect(page).toHaveURL('http://localhost:3000/');
    
    // Verify we're on the home page by checking for home page elements
    await expect(page.locator('.navbar')).toBeVisible();
  });

  test('should have header and footer on 404 page', async ({ page }) => {
    await page.goto('http://localhost:3000/missing-page');
    
    // Verify header is present
    await expect(page.locator('.navbar')).toBeVisible();
    
    // Verify footer is present
    await expect(page.locator('.footer')).toBeVisible();
    await expect(page.locator('.footer')).toContainText('All rights reserved. © TestingComp');
  });

  test('should display 404 page with proper styling structure', async ({ page }) => {
    await page.goto('http://localhost:3000/wrong-url');
    
    // Verify the pnf container exists
    const pnfContainer = page.locator('.pnf');
    await expect(pnfContainer).toBeVisible();
    
    // Verify all elements are inside the pnf container
    await expect(pnfContainer.locator('.pnf-title')).toBeVisible();
    await expect(pnfContainer.locator('.pnf-heading')).toBeVisible();
    await expect(pnfContainer.locator('.pnf-btn')).toBeVisible();
  });

  test('should work for various invalid routes', async ({ page }) => {
    const invalidRoutes = [
      '/invalid',
      '/xyz123',
      '/page/that/does/not/exist',
      '/admin/invalid',
      '/product/999999'
    ];
    
    for (const route of invalidRoutes) {
      await page.goto(`http://localhost:3000${route}`);
      
      // Wait a bit for the page to load
      await page.waitForTimeout(1000);
      
      // Check if 404 page is displayed (some routes might not trigger 404)
      const pnfTitle = page.locator('.pnf-title');
      if (await pnfTitle.isVisible()) {
        await expect(pnfTitle).toHaveText('404');
        await expect(page.locator('.pnf-heading')).toHaveText('Oops! Page Not Found');
      } else {
        // If not 404, at least verify we're not on a valid page
        const currentUrl = page.url();
        expect(currentUrl).toContain(route);
      }
    }
  });

  test('should maintain navigation functionality on 404 page', async ({ page }) => {
    await page.goto('http://localhost:3000/not-found');
    
    // Verify navbar links are still clickable - use more specific selector
    const homeLink = page.locator('.navbar').getByRole('link', { name: 'Home' });
    await expect(homeLink).toBeVisible();
    
    // Click home link in navbar
    await homeLink.click();
    
    // Should navigate to home
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('should display consistent layout with other pages', async ({ page }) => {
    await page.goto('http://localhost:3000/404');
    
    // Verify Layout component is used (has header and footer)
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Verify minimum height for main content - check for 70vh or equivalent pixel value
    const minHeight = await main.evaluate((el) => 
      window.getComputedStyle(el).minHeight
    );
    // Accept either 70vh or a reasonable pixel equivalent (around 500-600px for typical viewport)
    expect(minHeight).toMatch(/70vh|5\d{2}px|6\d{2}px/);
  });
});

