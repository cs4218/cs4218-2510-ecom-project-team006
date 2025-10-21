import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000');
});

test.describe("Contact page UI tests", () => {
  test("Should be reachable from homepage and render key contact details", async ({ page }) => {
    // gohome
    await page.goto("http://localhost:3000");
    
    const footer = page.locator('.footer');
    await footer.getByRole("link", { name: /Contact/ }).click();
    await expect(page).toHaveURL(/\/contact/);
    const contact = page.locator('.contactus');
    await expect(contact.getByText(/www.help@ecommerceapp.com/i).first()).toBeVisible();
    await expect(contact.getByText(/012-3456789/i).first()).toBeVisible();
    await expect(contact.getByText(/1800-0000-0000/i).first()).toBeVisible();
    // image visible
    await expect(contact.getByAltText("contactus")).toBeVisible();
  });
});