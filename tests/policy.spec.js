import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000');
});

test.describe("Policy page UI tests", () => {
  test("Should be reachable from homepage and render key policy details", async ({ page }) => {
    // gohome
    await page.goto("http://localhost:3000");
    
    const footer = page.locator('.footer');
    await footer.getByRole("link", { name: /Privacy Policy/ }).click();
    await expect(page).toHaveURL(/\/policy/);
    const policy = page.locator('.contactus');
    await expect(policy.getByText(/privacy policy/i).first()).toBeVisible();
    // image visible
    await expect(policy.getByAltText("contactus")).toBeVisible();
  });
});