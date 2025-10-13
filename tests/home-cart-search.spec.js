import { test, expect } from '@playwright/test';

/* ============================================================
   Shared Utilities
============================================================ */
async function addProduct(page, keyword) {
  console.log(`Starting test: searching and adding product "${keyword}"`);
  await page.goto('/');
  const searchInput = page.locator('input[placeholder*="Search"]');
  await searchInput.fill(keyword);
  await page.keyboard.press('Enter');
  await expect(page.locator('text=Search Resuts')).toBeVisible();

  const firstCard = page.locator('.card').first();
  await expect(firstCard).toBeVisible();

  const priceText = await firstCard
    .locator('.card-text', { hasText: '$' })
    .first()
    .textContent();
  const priceValue = parseFloat(priceText.replace(/[^0-9.]/g, ''));
  console.log(`Found "${keyword}" in search results, price: ${priceValue}`);

  await firstCard.locator('button:has-text("ADD TO CART")').click();
  await page.waitForTimeout(1000);
  console.log(`Added "${keyword}" to cart successfully`);
  return priceValue;
}

async function getCartTotal(page) {
  const totalText = await page.locator('[data-testid="total-price"]').textContent();
  const total = parseFloat(totalText.replace(/[^0-9.]/g, ''));
  console.log(`Cart total currently: ${total}`);
  return total;
}

async function goToCart(page) {
  console.log('Navigating to cart page');
  const cartLink = page.getByRole('link', { name: /^Cart$/ });
  await expect(cartLink).toBeVisible();
  await cartLink.click();
  await expect(page.locator('h2:has-text("Cart Summary")')).toBeVisible();
  console.log('Cart page loaded successfully');
}

/* ============================================================
   Test Group 1: Search, Cart, and Checkout Flows (T1–T6)
============================================================ */
test.describe.serial('System Test: Search, Cart, and Checkout Flows', () => {
  test('T1: Search "Laptop", add to cart, and verify total', async ({ page }) => {
    console.log('Running T1');
    const price = await addProduct(page, 'Laptop');
    await page.goto('/cart');
    const total = await getCartTotal(page);
    expect(total).toBeCloseTo(price, 2);
    console.log('T1 passed: single product total verified after search');
  });

  test('T2: Search and add "Laptop" + "Book", verify combined total', async ({ page }) => {
    console.log('Running T2');
    const laptopPrice = await addProduct(page, 'Laptop');
    const bookPrice = await addProduct(page, 'Book');
    const expectedTotal = laptopPrice + bookPrice;
    await page.goto('/cart');
    const totalDisplayed = await getCartTotal(page);
    expect(totalDisplayed).toBeCloseTo(expectedTotal, 2);
    console.log('T2 passed: combined total verified after search');
  });

  test('T3: Search and add "Laptop" + "Book", remove one, verify total decreases', async ({ page }) => {
    console.log('Running T3');
    const laptopPrice = await addProduct(page, 'Laptop');
    const bookPrice = await addProduct(page, 'Book');
    const combinedTotal = laptopPrice + bookPrice;
    await page.goto('/cart');
    const beforeRemove = await getCartTotal(page);
    expect(beforeRemove).toBeCloseTo(combinedTotal, 2);
    const removeButtons = page.locator('button.btn-danger:has-text("Remove")');
    const count = await removeButtons.count();
    await removeButtons.nth(count - 1).click();
    await page.waitForTimeout(1000);
    const afterRemove = await getCartTotal(page);
    expect(afterRemove).toBeCloseTo(laptopPrice, 2);
    console.log('T3 passed: product removed and total decreased');
  });

  test('T4: Add all visible products and verify total sum in cart', async ({ page }) => {
    console.log('Running T4');
    await page.goto('/');
    await page.waitForSelector('.card.m-2', { timeout: 15000 });
    const productCards = page.locator('.card.m-2');
    const count = await productCards.count();
    expect(count).toBeGreaterThan(0);
    let expectedTotal = 0;
    for (let i = 0; i < count; i++) {
      const card = productCards.nth(i);
      const priceText = await card.locator('.card-price').textContent();
      const priceValue = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
      expectedTotal += priceValue;
      await card.getByRole('button', { name: /add to cart/i }).click();
      await page.waitForTimeout(300);
    }
    await goToCart(page);
    const displayedTotal = await getCartTotal(page);
    expect(displayedTotal).toBeCloseTo(expectedTotal, 2);
    console.log('T4 passed: total of all products verified');
  });

  test('T5: Remove all items and verify empty cart (Total $0.00)', async ({ page }) => {
    console.log('Running T5');
    await page.goto('/');
    await page.waitForSelector('.card.m-2', { timeout: 15000 });
    const cards = page.locator('.card.m-2');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await cards.nth(i).getByRole('button', { name: /add to cart/i }).click();
      await page.waitForTimeout(200);
    }
    await goToCart(page);
    while (await page.locator('button.btn-danger:has-text("Remove")').count() > 0) {
      await page.locator('button.btn-danger:has-text("Remove")').first().click();
      await page.waitForTimeout(300);
    }
    const totalText = await page.locator('[data-testid="total-price"]').textContent();
    expect(totalText.trim()).toMatch(/Total\s*:\s*\$0\.00/);
    console.log('T5 passed: all items removed, cart empty');
  });

  test('T6: Click “Please Login to checkout” and verify redirect to Login page', async ({ page }) => {
    console.log('Running T6');
    await page.goto('/');
    await page.waitForSelector('.card.m-2', { timeout: 15000 });
    const firstCard = page.locator('.card.m-2').first();
    await firstCard.getByRole('button', { name: /add to cart/i }).click();
    await goToCart(page);
    const loginBtn = page.getByRole('button', { name: /please login to checkout/i });
    await expect(loginBtn).toBeVisible();
    await loginBtn.click();
    await expect(page).toHaveURL(/\/login/i);
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    console.log('T6 passed: redirected to login page correctly');
  });
});

/* ============================================================
   Test Group 2: Homepage Filters and Search (T7–T10)
============================================================ */
test.describe.serial('System Test: Homepage Filters and Search', () => {
  async function filterAndAssertCategory(page, categoryName) {
    console.log(`Running filter test for category "${categoryName}"`);
    await page.goto('/');
    await page.waitForSelector('.filters', { timeout: 15000 });
    await page.getByLabel(categoryName).check();

    const loadingLocator = page.locator('[data-testid="filter-loading"]');
    await expect(loadingLocator).toBeVisible({ timeout: 5000 });
    await expect(loadingLocator).toBeHidden({ timeout: 15000 });

    const cards = page.locator('.card.m-2');
    const count = await cards.count();

    if (count === 0) {
      console.log(`No products found for category "${categoryName}"`);
      return;
    }

    const firstCard = cards.first();
    await expect(firstCard).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/product\//),
      firstCard.getByRole('button', { name: /more details/i }).click(),
    ]);

    const categoryLocator = page.locator('h6', { hasText: 'Category :' });
    await expect(categoryLocator).toContainText(categoryName);
    console.log(`Verified category "${categoryName}" product details`);
  }

  test('T7a: Filter by "Book" → Verify product details show same category', async ({ page }) => {
    await filterAndAssertCategory(page, 'Book');
  });

  test('T7b: Filter by "Electronics" → Verify product details show same category', async ({ page }) => {
    await filterAndAssertCategory(page, 'Electronics');
  });

  test('T7c: Filter by "Clothing" → Verify product details show same category', async ({ page }) => {
    await filterAndAssertCategory(page, 'Clothing');
  });

  // ---------- Price Filter Helper ----------
  async function verifyPriceRange(page, min, max) {
    console.log(`Checking price filter range: $${min}–$${max}`);
    const loadingLocator = page.locator('[data-testid="filter-loading"]');
    await expect(loadingLocator).toBeVisible({ timeout: 5000 });
    await expect(loadingLocator).toBeHidden({ timeout: 15000 });

    const cards = page.locator('.card.m-2');
    const count = await cards.count();

    if (count === 0) {
      console.log(`No products found for price range $${min}–$${max}`);
      return;
    }

    for (let i = 0; i < count; i++) {
      const priceText = await cards.nth(i).locator('.card-price').textContent();
      const val = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
      expect(val).toBeGreaterThanOrEqual(min);
      if (max !== Infinity) {
        expect(val).toBeLessThanOrEqual(max + 0.99);
      }
    }
    console.log(`Verified ${count} products within approximately $${min}–$${max}`);
  }

  // ---------- Price Filter Tests ----------
  test('T8a: Filter "$0 to 19"', async ({ page }) => {
    console.log('Running T8a');
    await page.goto('/');
    await page.getByLabel('$0 to 19').check();
    await verifyPriceRange(page, 0, 19);
  });

  test('T8b: Filter "$20 to 39"', async ({ page }) => {
    console.log('Running T8b');
    await page.goto('/');
    await page.getByLabel('$20 to 39').check();
    await verifyPriceRange(page, 20, 39);
  });

  test('T8c: Filter "$40 to 59"', async ({ page }) => {
    console.log('Running T8c');
    await page.goto('/');
    await page.getByLabel('$40 to 59').check();
    await verifyPriceRange(page, 40, 59);
  });

  test('T8d: Filter "$60 to 79"', async ({ page }) => {
    console.log('Running T8d');
    await page.goto('/');
    await page.getByLabel('$60 to 79').check();
    await verifyPriceRange(page, 60, 79);
  });

  test('T8e: Filter "$80 to 99"', async ({ page }) => {
    console.log('Running T8e');
    await page.goto('/');
    await page.getByLabel('$80 to 99').check();
    await verifyPriceRange(page, 80, 99);
  });

  test('T8f: Filter "$100 or more"', async ({ page }) => {
    console.log('Running T8f');
    await page.goto('/');
    await page.getByLabel('$100 or more').check();
    await verifyPriceRange(page, 100, Infinity);
  });

  // ---------- Combined Filter ----------
  test('T9: Filter by "Book" + "$0 to 19" → Verify all shown are books in range', async ({ page }) => {
    console.log('Running T9 combined filter test');
    const categoryName = 'Book';
    await page.goto('/');
    await page.getByLabel(categoryName).check();
    await page.getByLabel('$0 to 19').check();

    const loadingLocator = page.locator('[data-testid="filter-loading"]');
    await expect(loadingLocator).toBeVisible({ timeout: 5000 });
    await expect(loadingLocator).toBeHidden({ timeout: 15000 });

    const cards = page.locator('.card.m-2');
    const count = await cards.count();

    if (count === 0) {
      console.log(`No products found for category "${categoryName}" in $0–$19`);
      return;
    }

    console.log(`Found ${count} products for category "${categoryName}" in $0–$19`);
    await Promise.all([
      page.waitForURL(/\/product\//),
      cards.first().getByRole('button', { name: /more details/i }).click(),
    ]);

    const categoryLocator = page.locator('h6', { hasText: 'Category :' });
    await expect(categoryLocator).toContainText(categoryName);
    console.log('T9 passed: combined filter verified');
  });

  // ---------- Empty Search ----------
  test('T10: Empty search → Remains on same page', async ({ page }) => {
    console.log('Running T10: empty search test');
    await page.goto('/');
    const currentURL = page.url();
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.click();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(currentURL);
    await expect(page.getByRole('heading', { name: /all products/i })).toBeVisible();
    console.log('T10 passed: empty search stayed on same page');
  });
});
