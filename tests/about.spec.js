import { test, expect } from '@playwright/test';

// AI attribution: OpenAI ChatGPT(GPT-4) via Cursor was used to help generate Playwright test cases and assertions for the About page.

test.describe.configure({ mode: 'parallel' });

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/about');
});

test.describe('About Page', () => {

  test('should display main heading "About Us"', async ({ page }) => {
    // Verify main heading
    const heading = page.getByRole('heading', { name: 'About Us', level: 1 });
    await expect(heading).toBeVisible();
  });

  test('should display about us image', async ({ page }) => {
    // Verify image is present and visible
    const image = page.getByRole('img', { name: 'About us' });
    await expect(image).toBeVisible();
    
    // Verify image source
    await expect(image).toHaveAttribute('src', '/images/about.jpeg');
  });

  test('should display "Our Story" section', async ({ page }) => {
    // Verify "Our Story" heading
    await expect(page.getByRole('heading', { name: 'Our Story' })).toBeVisible();
    
  });

  test('should display "Our Mission" section', async ({ page }) => {
    // Verify "Our Mission" heading
    await expect(page.getByRole('heading', { name: 'Our Mission' })).toBeVisible();
    
  });

  test('should have header and footer components', async ({ page }) => {
    // Verify header is present
    await expect(page.locator('.navbar')).toBeVisible();
    
    // Verify footer is present
    await expect(page.locator('.footer')).toBeVisible();
    await expect(page.locator('.footer')).toContainText('All rights reserved. © TestingComp');
  });

  test('should have proper page layout structure', async ({ page }) => {
    // Verify the about section exists
    const aboutSection = page.locator('.about-section');
    await expect(aboutSection).toBeVisible();
    
    // Verify it has the row layout
    const row = aboutSection.locator('.row.about-us');
    await expect(row).toBeVisible();
    
    // Verify two column layout
    const columns = row.locator('[class*="col-md"]');
    await expect(columns).toHaveCount(2);
  });

  test('should be able to navigate to About page from home', async ({ page }) => {
    // Start from home page
    await page.goto('http://localhost:3000/');
    
    // Click About link in footer
    await page.locator('.footer').getByRole('link', { name: 'About' }).click();
    
    // Verify navigation to About page
    await expect(page).toHaveURL(/.*\/about/);
    await expect(page.getByRole('heading', { name: 'About Us' })).toBeVisible();
  });

  test('should have working navigation links in header', async ({ page }) => {
    // Verify navigation links are present
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Categories/i })).toBeVisible();
    
    // Test navigation to home
    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page).toHaveURL('http://localhost:3000/');
  });
});

