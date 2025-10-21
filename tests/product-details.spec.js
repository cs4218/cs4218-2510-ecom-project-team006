import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/product/textbook');
});

test.describe("Product Details page UI tests", () => {
  test("should be reachable from homepage", async ({ page }) => {
    // goto homepage
    await page.goto("http://localhost:3000");
    await page.getByRole("button", { name: /More Details/i }).first().click();
    
    await expect(page).toHaveURL(/\/product\//);
    await expect(page.getByText(/Product Details/i)).toBeVisible();
  });

  test("should render key product details and image", async ({ page }) => {
    const productDetails = page.locator('.product-details');
    // ensure name, description and price is visible
    await expect(productDetails.getByRole('heading', { name: 'Name : Textbook' })).toBeVisible();
    await expect(productDetails.getByText(/79.99/i)).toBeVisible();
    await expect(productDetails.getByText(/A comprehensive textbook/i)).toBeVisible();
    // image visible
    await expect(productDetails.getByAltText("Textbook")).toBeVisible();
  });

    test("should add main product to cart", async ({ page }) => {
    // click add to cart on main product
    const productDetails = page.locator('.product-details-info');
    await productDetails.getByRole("button", { name: "ADD TO CART" }).click();

    // validate toast appears
    await expect(page.getByText("Item Added to cart").first()).toBeVisible();

    // navigate to cart page
    await page.getByRole('link', { name: /cart/i }).click();

    // expect 1 textbook to be in the cart
    await expect(page.getByText('Textbook', { exact: true })).toBeVisible();
    await expect(page.getByText(/You have 1 items in your cart/i)).toBeVisible();

    await checkSizeOfCartInLocalStorage(page, 1);
  });

  test("should add similar product to cart", async ({ page }) => {
    // click add to cart on first similar product
    const similarProducts = page.locator('.similar-products');
    const firstProductCard = similarProducts.getByTestId('similar-product').first();
    const firstProductName = await firstProductCard.getByTestId('product-name').innerText();
    await firstProductCard.getByRole("button", { name: "ADD TO CART" }).click();

    // validate toast appears
    await expect(page.getByText("Item Added to cart").first()).toBeVisible();

    // navigate to cart page
    await page.getByRole('link', { name: /cart/i }).click();

    // expect similar product to be in the cart
    await expect(page.getByText(firstProductName, { exact: true })).toBeVisible();
    await expect(page.getByText(/You have 1 items in your cart/i)).toBeVisible();

    await checkSizeOfCartInLocalStorage(page, 1);
  });

  test("should navigate to product details for similar product", async ({ page }) => {
    // click more details on first similar product
    const similarProducts = page.locator('.similar-products');
    const firstProductCard = similarProducts.getByTestId('similar-product').first();
    const firstProductName = await firstProductCard.getByTestId('product-name').innerText();
    await firstProductCard.getByRole("button", { name: /More Details/i }).click();

    // expect product detail to be of similar product
    await expect(page).toHaveURL(/\/product\//);
    const productDetails = page.locator('.product-details-info');
    await expect(productDetails.getByText(/Product Details/i)).toBeVisible();
    await expect(productDetails.getByText(`Name : ${firstProductName}`)).toBeVisible();
  });
});

async function checkSizeOfCartInLocalStorage(page, expected) {
  return await page.waitForFunction(e => {
    return JSON.parse(localStorage['cart']).length === e;
  }, expected);
}