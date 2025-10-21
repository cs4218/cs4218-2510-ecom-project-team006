import { test, expect } from '@playwright/test';

// AI Attribution: This test was generated with the assistance of GitHub Copilot (AI).

test.describe('User Login Flow', () => {
  const testUser = {
    name: 'Login Test User',
    email: `logintestuser_${Date.now()}@example.com`,
    password: 'testpassword',
    phone: '1234567890',
    address: '123 Login St',
    DOB: '2000-01-01',
    answer: 'blue',
  };

  test.beforeAll(async ({ request }) => {
    // Register the user via API for login tests
    await request.post('http://localhost:3000/api/v1/auth/register', {
      data: testUser,
    });
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
  });

  test('should render login form fields', async ({ page }) => {
    await expect(page.getByPlaceholder('Enter Your Email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'LOGIN' })).toBeVisible();
  });

  test('should show error for missing fields', async ({ page }) => {
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page).toHaveURL('http://localhost:3000/login');
  });

  test('should show error for wrong password', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill(testUser.email);
    await page.getByPlaceholder('Enter Your Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page.getByText('Invalid Password').first()).toBeVisible();
  });

  test('should show error for non-existent user', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill('notarealuser@example.com');
    await page.getByPlaceholder('Enter Your Password').fill('irrelevant');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page.getByText('Email is not registered').first()).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill(testUser.email);
    await page.getByPlaceholder('Enter Your Password').fill(testUser.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();
    // Should redirect to home or dashboard and show success toast
    await expect(page).not.toHaveURL('http://localhost:3000/login');
    await expect(page.getByText('login successfully').first()).toBeVisible();
    // Check that user's name appears in the header (dropdown)
    await expect(page.getByRole('link', { name: testUser.name })).toBeVisible();
  });

  test('should persist session after reload', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill(testUser.email);
    await page.getByPlaceholder('Enter Your Password').fill(testUser.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page.getByRole('link', { name: testUser.name })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('link', { name: testUser.name })).toBeVisible();
  });

  test('should logout and clear session', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill(testUser.email);
    await page.getByPlaceholder('Enter Your Password').fill(testUser.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page.getByRole('link', { name: testUser.name })).toBeVisible();
    // Open user dropdown and click logout
    await page.getByRole('link', { name: testUser.name }).click();
    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
  });

  test('should redirect guest from protected route to login', async ({ page }) => {
    // Try to visit user dashboard as guest
    await page.goto('http://localhost:3000/dashboard/user');
    await expect(page).toHaveURL('http://localhost:3000/');
  });
});
