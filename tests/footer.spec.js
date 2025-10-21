import { test, expect } from '@playwright/test';
// AI attribution: Test cases are produced with the help of OpenAI ChatGPT(GPT-5) via cursor.

test.describe.configure({ mode: 'parallel' });

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/');
});

test.describe('Footer Component', () => {
  test('should display footer with copyright information on home page', async ({ page }) => {
    // Verify footer is visible
    const footer = page.locator('.footer');
    await expect(footer).toBeVisible();

    // Verify copyright text
    await expect(footer).toContainText('All rights reserved. © TestingComp');
  });

  test('should contain all navigation links (About, Contact, Privacy Policy)', async ({ page }) => {
    const footer = page.locator('.footer');

    // Verify all links are present and visible
    await expect(footer.getByRole('link', { name: 'About' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Contact' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
  });

  test('should navigate to About page when clicking About link', async ({ page }) => {
    // Click About link in footer
    await page.locator('.footer').getByRole('link', { name: 'About' }).click();

    // Verify navigation to About page
    await expect(page).toHaveURL(/.*\/about/);
    await expect(page.getByRole('heading', { name: 'About Us' })).toBeVisible();
  });

  test('should navigate to Contact page when clicking Contact link', async ({ page }) => {
    // Click Contact link in footer
    await page.locator('.footer').getByRole('link', { name: 'Contact' }).click();

    // Verify navigation to Contact page
    await expect(page).toHaveURL(/.*\/contact/);
  });

  test('should navigate to Privacy Policy page when clicking Privacy Policy link', async ({ page }) => {
    // Click Privacy Policy link in footer
    await page.locator('.footer').getByRole('link', { name: 'Privacy Policy' }).click();

    // Verify navigation to Policy page
    await expect(page).toHaveURL(/.*\/policy/);
  });

  test('should display footer on all major pages', async ({ page }) => {
    const pagesToTest = [
      { path: '/', name: 'Home' },
      { path: '/about', name: 'About' },
      { path: '/contact', name: 'Contact' },
      { path: '/policy', name: 'Policy' },
      { path: '/categories', name: 'Categories' }
    ];

    for (const pageInfo of pagesToTest) {
      await page.goto(`http://localhost:3000${pageInfo.path}`);
      const footer = page.locator('.footer');
      await expect(footer).toBeVisible({ timeout: 5000 });
      await expect(footer).toContainText('All rights reserved. © TestingComp');
    }
  });

  test('should have proper link separators', async ({ page }) => {
    const footer = page.locator('.footer');
    
    // Verify the separator '|' between links
    const footerText = await footer.locator('p').textContent();
    expect(footerText).toContain('|');
    
    // Verify links are properly formatted
    const links = footer.locator('p a');
    await expect(links).toHaveCount(3);
  });
});

