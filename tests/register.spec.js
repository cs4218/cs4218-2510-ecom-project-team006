import { test, expect } from '@playwright/test';

// AI Attribution: This test was generated with the assistance of GitHub Copilot (AI).

test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/register');
  });

  test('should render all registration form fields', async ({ page }) => {
    await expect(page.getByPlaceholder('Enter Your Name')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Password')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Phone')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Address')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your DOB')).toBeVisible();
    await expect(page.getByPlaceholder('What is Your Favorite Color?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'REGISTER' })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: 'REGISTER' }).click();
    // Should remain on the same page due to required fields
    await expect(page).toHaveURL('http://localhost:3000/register');
  });

  test('should show error for non-numeric phone', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Name').fill('Test User');
    await page.getByPlaceholder('Enter Your Email').fill('testuser@example.com');
    await page.getByPlaceholder('Enter Your Password').fill('testpassword');
    await page.getByPlaceholder('Enter Your Phone').fill('notanumber');
    await page.getByPlaceholder('Enter Your Address').fill('123 Test St');
    await page.getByPlaceholder('Enter Your DOB').fill('2000-01-01');
    await page.getByPlaceholder('What is Your Favorite Color?').fill('blue');
    await page.getByRole('button', { name: 'REGISTER' }).click();
    await expect(page.getByText('Phone must contain only numbers').first()).toBeVisible();
  });

  test('should register successfully with valid data', async ({ page }) => {
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    await page.getByPlaceholder('Enter Your Name').fill('Test User');
    await page.getByPlaceholder('Enter Your Email').fill(uniqueEmail);
    await page.getByPlaceholder('Enter Your Password').fill('testpassword');
    await page.getByPlaceholder('Enter Your Phone').fill('1234567890');
    await page.getByPlaceholder('Enter Your Address').fill('123 Test St');
    await page.getByPlaceholder('Enter Your DOB').fill('2000-01-01');
    await page.getByPlaceholder('What is Your Favorite Color?').fill('blue');
    await page.getByRole('button', { name: 'REGISTER' }).click();
    // Should see success toast and be redirected to login
    await expect(page).toHaveURL('http://localhost:3000/login');
    await expect(page.getByText('Register Successfully, please login').first()).toBeVisible();
  });

  test('should show error for duplicate email registration', async ({ page }) => {
    // First, register a new user
    const duplicateEmail = `dupeuser_${Date.now()}@example.com`;
    await page.getByPlaceholder('Enter Your Name').fill('Dupe User');
    await page.getByPlaceholder('Enter Your Email').fill(duplicateEmail);
    await page.getByPlaceholder('Enter Your Password').fill('testpassword');
    await page.getByPlaceholder('Enter Your Phone').fill('1234567890');
    await page.getByPlaceholder('Enter Your Address').fill('123 Test St');
    await page.getByPlaceholder('Enter Your DOB').fill('2000-01-01');
    await page.getByPlaceholder('What is Your Favorite Color?').fill('blue');
    await page.getByRole('button', { name: 'REGISTER' }).click();
    await expect(page).toHaveURL('http://localhost:3000/login');
    // Go back to register page
    await page.goto('http://localhost:3000/register');
    // Try to register again with the same email
    await page.getByPlaceholder('Enter Your Name').fill('Dupe User 2');
    await page.getByPlaceholder('Enter Your Email').fill(duplicateEmail);
    await page.getByPlaceholder('Enter Your Password').fill('testpassword');
    await page.getByPlaceholder('Enter Your Phone').fill('1234567890');
    await page.getByPlaceholder('Enter Your Address').fill('456 Test Ave');
    await page.getByPlaceholder('Enter Your DOB').fill('2000-01-01');
    await page.getByPlaceholder('What is Your Favorite Color?').fill('red');
    await page.getByRole('button', { name: 'REGISTER' }).click();
    // Should see error toast for duplicate email
    await expect(page.getByText('Already Register please login').first()).toBeVisible();
  });
});
