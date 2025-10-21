import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/category/book');
});

test.describe("ProductCategory Page UI tests", () => {
  test("should display all products in the category", async ({ page }) => {
    await expect(page.getByText(/Category - Book/i)).toBeVisible();
    await expect(page.getByText(/3 result found/i)).toBeVisible();
    const productNames = page.locator('[data-testid="product-name"]');
    const names = await productNames.allInnerTexts();
    // products are in random order
    const expected = ['Textbook', 'Novel', 'The Law of Contract in Singapore'];
    expect(names).toEqual(expect.arrayContaining(expected));
  });

  test("should be reachable from homepage", async ({ page }) => {
    // go home
    await page.goto('http://localhost:3000');
    await page.getByRole('link', { name: /Categories/i }).click();
    await page.getByRole('link', { name: /All Categories/i }).click();
    await page.getByRole('link', { name: /Electronics/i }).click();

    await expect(page).toHaveURL(/\/category\/electronics/);
    // should display electronics category
    await expect(page.getByText(/Category - Electronics/i)).toBeVisible();
    await expect(page.getByText(/2 result found/i)).toBeVisible();
  });

  test("'Add to Cart' button should add product to cart", async ({ page }) => {
    // click add to cart on first product
    const firstProductCard = page.getByTestId('product-card').first();
    const firstProductName = await firstProductCard.getByTestId('product-name').innerText();
    await firstProductCard.getByRole("button", { name: /ADD TO CART/i }).click();

    // validate toast appears
    await expect(page.getByText("Item Added to cart").first()).toBeVisible();

    // navigate to cart page
    await page.getByRole('link', { name: /cart/i }).click();

    // expect 1 product to be in the cart
    await expect(page.getByText(firstProductName, { exact: true })).toBeVisible();
    await expect(page.getByText(/You have 1 items in your cart/i)).toBeVisible();

    await checkSizeOfCartInLocalStorage(page, 1);
  });

  test("'More Details' button should show product details for product", async ({ page }) => {
    // click more details on first similar product
    const firstProductCard = page.getByTestId('product-card').first();
    const firstProductName = await firstProductCard.getByTestId('product-name').innerText();
    await firstProductCard.getByRole("button", { name: /More Details/i }).click();

    // should have navigated to more details page
    await expect(page).toHaveURL(/\/product\//);
    // expect product detail to be of similar product
    await expect(page.getByText(/Product Details/i)).toBeVisible();
    await expect(page.getByText(`Name : ${firstProductName}`)).toBeVisible();
  });
});

async function checkSizeOfCartInLocalStorage(page, expected) {
  return await page.waitForFunction(e => {
    return JSON.parse(localStorage['cart']).length === e;
  }, expected);
}