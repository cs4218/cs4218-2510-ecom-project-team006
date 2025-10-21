import { test, expect } from '@playwright/test';

test.describe('Forgot Password Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login');
  });

  test('should navigate to forgot password page when clicking Forgot Password button', async ({ page }) => {
    // Click the Forgot Password button
    await page.getByRole('button', { name: 'Forgot Password' }).click();
    
    // Verify we're on the forgot password page
    await expect(page).toHaveURL('http://localhost:3000/forgot-password');
    
    // Verify the page title is present
    await expect(page.getByRole('heading', { name: 'RESET PASSWORD' })).toBeVisible();
    
    // Verify all form fields are present
    await expect(page.getByPlaceholder('Enter Your Email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Favorite Color')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your New Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'RESET PASSWORD' })).toBeVisible();
  });

  test('should show validation errors when submitting empty form', async ({ page }) => {
    // Navigate to forgot password page
    await page.goto('http://localhost:3000/forgot-password');
    
    // Try to submit without filling any fields
    await page.getByRole('button', { name: 'RESET PASSWORD' }).click();
    
    // The browser's built-in validation should prevent submission
    // Check that we're still on the same page (no navigation occurred)
    await expect(page).toHaveURL('http://localhost:3000/forgot-password');
  });

  test('should show error for non-existent user', async ({ page }) => {
    // Navigate to forgot password page
    await page.goto('http://localhost:3000/forgot-password');
    
    // Fill in form with non-existent user
    await page.getByPlaceholder('Enter Your Email').fill('nonexistent@example.com');
    await page.getByPlaceholder('Enter Your Favorite Color').fill('red');
    await page.getByPlaceholder('Enter Your New Password').fill('newpassword123');
    
    // Submit the form
    await page.getByRole('button', { name: 'RESET PASSWORD' }).click();
    
    // Wait for error toast to appear
    await expect(page.getByText(/Wrong Email Or Answer/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should successfully reset password for existing user with correct answer', async ({ page }) => {
    // First, register a new user with known credentials
    await page.goto('http://localhost:3000/register');
    
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    const testAnswer = 'blue';
    const originalPassword = 'password123';
    const newPassword = 'newpassword456';
    
    // Fill registration form
    await page.getByPlaceholder('Enter Your Name').fill('Test User');
    await page.getByPlaceholder('Enter Your Email').fill(testEmail);
    await page.getByPlaceholder('Enter Your Password').fill(originalPassword);
    await page.getByPlaceholder('Enter Your Phone Number').fill('1234567890');
    await page.getByPlaceholder('Enter Your Address').fill('123 Test St');
    await page.getByPlaceholder('Enter Your DOB').fill('1990-01-01');
    await page.getByPlaceholder('What is Your Favorite Color?').fill(testAnswer);
    
    // Submit registration
    await page.getByRole('button', { name: 'REGISTER' }).click();
    
    // Wait for success toast and redirect to login
    await expect(page.getByText(/Register Successfully/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL('http://localhost:3000/login', { timeout: 5000 });
    
    // Now go to forgot password page
    await page.getByRole('button', { name: 'Forgot Password' }).click();
    await expect(page).toHaveURL('http://localhost:3000/forgot-password');
    
    // Fill in forgot password form
    await page.getByPlaceholder('Enter Your Email').fill(testEmail);
    await page.getByPlaceholder('Enter Your Favorite Color').fill(testAnswer);
    await page.getByPlaceholder('Enter Your New Password').fill(newPassword);
    
    // Submit the form
    await page.getByRole('button', { name: 'RESET PASSWORD' }).click();
    
    // Wait for success message
    await expect(page.getByText(/Password Reset Successfully/i).first()).toBeVisible({ timeout: 5000 });
    
    // Should redirect back to login page
    await expect(page).toHaveURL('http://localhost:3000/login', { timeout: 5000 });
    
    // Now try logging in with the NEW password
    await page.getByPlaceholder('Enter Your Email').fill(testEmail);
    await page.getByPlaceholder('Enter Your Password').fill(newPassword);
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    // Wait for successful login
    await expect(page.getByText(/Login Successfully/i).first()).toBeVisible({ timeout: 5000 });
    
    // Should be redirected to home page
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 5000 });
    
    // Verify user is logged in by checking for user menu or dashboard link
    await expect(page.getByText('Test User')).toBeVisible({ timeout: 5000 });
  });

  test('should fail to login with old password after reset', async ({ page }) => {
    // First, register a new user
    await page.goto('http://localhost:3000/register');
    
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    const testAnswer = 'green';
    const originalPassword = 'oldpass123';
    const newPassword = 'newpass456';
    
    // Fill registration form
    await page.getByPlaceholder('Enter Your Name').fill('Test User 2');
    await page.getByPlaceholder('Enter Your Email').fill(testEmail);
    await page.getByPlaceholder('Enter Your Password').fill(originalPassword);
    await page.getByPlaceholder('Enter Your Phone').fill('9876543210');
    await page.getByPlaceholder('Enter Your Address').fill('456 Test Ave');
    await page.getByPlaceholder('Enter Your DOB').fill('1995-06-15');
    await page.getByPlaceholder('What is Your Favorite Color?').fill(testAnswer);
    
    // Submit registration
    await page.getByRole('button', { name: 'REGISTER' }).click();
    await expect(page).toHaveURL('http://localhost:3000/login', { timeout: 5000 });
    
    // Reset password
    await page.getByRole('button', { name: 'Forgot Password' }).click();
    await page.getByPlaceholder('Enter Your Email').fill(testEmail);
    await page.getByPlaceholder('Enter Your Favorite Color').fill(testAnswer);
    await page.getByPlaceholder('Enter Your New Password').fill(newPassword);
    await page.getByRole('button', { name: 'RESET PASSWORD' }).click();
    
    // Wait for success and redirect
    await expect(page).toHaveURL('http://localhost:3000/login', { timeout: 5000 });
    
    // Try logging in with OLD password (should fail)
    await page.getByPlaceholder('Enter Your Email').fill(testEmail);
    await page.getByPlaceholder('Enter Your Password').fill(originalPassword);
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    // Should show error message
    await expect(page.getByText(/Invalid password/i).first()).toBeVisible({ timeout: 5000 });
    
    // Should still be on login page
    await expect(page).toHaveURL('http://localhost:3000/login');
  });
});
