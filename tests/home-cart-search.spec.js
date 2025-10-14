import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" }); 

test.describe("End-to-End UI Purchase Flow", () => {
  const BASE_URL = "http://localhost:3000";

  /* ============================================================
     TEST 1 — Guest adds products to cart → sees login prompt
  ============================================================ */
  test("Guest can add products to cart and sees login prompt", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector(".card");

    const addButtons = page.locator(".btn.btn-dark", { hasText: "ADD TO CART" });
    const count = await addButtons.count();
    expect(count).toBeGreaterThan(0);

    // Add first two items if possible
    await addButtons.first().click();
    if (count > 1) await addButtons.nth(1).click();

    // Navigate to cart
    await page.getByRole("link", { name: /cart/i }).click();
    await expect(page.locator("h1")).toContainText("You have");
    await expect(page.locator("text=Cart Summary")).toBeVisible();
    await expect(page.locator("text=Please login to checkout!")).toBeVisible();
  });

  /* ============================================================
     TEST 2 — Category filter behavior
  ============================================================ */
  test("User can filter products by category", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector(".filters input[type=checkbox]");

    const beforeCount = await page.locator(".card").count();

    // Apply first available category
    const categoryBox = page.locator(".filters input[type=checkbox]").first();
    await categoryBox.check();

    // Wait for API response to complete
    await page.waitForResponse((res) =>
      res.url().includes("/api/v1/product/product-filters") && res.status() === 200
    );

    // Verify product list updated
    const afterCount = await page.locator(".card").count();
    expect(afterCount).toBeLessThanOrEqual(beforeCount);
    await expect(page.locator(".card").first()).toBeVisible();
  });

  /* ============================================================
     TEST 3 — Load More pagination
  ============================================================ */
  test("User clicks Load More to reveal additional products", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector(".card");

    const loadBtn = page.locator('button:has-text("Loadmore")');
    if (!(await loadBtn.isVisible())) {
      console.warn("Loadmore button not shown — backend may not paginate products.");
      return;
    }

    const initialCount = await page.locator(".card").count();
    await loadBtn.click();

    // Wait until product count increases
    await page.waitForFunction(
      (initial) => document.querySelectorAll(".card").length > initial,
      initialCount
    );

    const newCount = await page.locator(".card").count();
    console.log(`Products before: ${initialCount}, after load: ${newCount}`);
    expect(newCount).toBeGreaterThan(initialCount);
  });

  /* ============================================================
     TEST 4 — Search and product details flow
  ============================================================ */
  test("User searches a product, views its details, and adds it to cart", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector("input[placeholder*='Search']");

    // Perform search
    await page.locator("input[placeholder*='Search']").fill("Book");
    await page.keyboard.press("Enter");

    await expect(page.getByRole("heading", { name: /Search Results/i })).toBeVisible();
    const results = page.locator(".card");
    await expect(results.first()).toBeVisible();

    // View product details
    await results.first().locator("button:has-text('More Details')").click();
    await expect(page).toHaveURL(/\/product\//);
    await expect(page.getByText("Product Details")).toBeVisible();

    // Add product to cart from details page
    const addBtn = page.getByRole("button", { name: /add to cart/i });
    if (await addBtn.isVisible()) await addBtn.click();

    // Verify in cart
    await page.getByRole("link", { name: /cart/i }).click();
    await expect(page.locator("text=Cart Summary")).toBeVisible();
  });

  /* ============================================================
     TEST 5 — Remove product(s) from cart
  ============================================================ */
  test("User can remove product(s) from the cart", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector(".card");

    // Add product
    const addBtn = page.locator(".btn.btn-dark", { hasText: "ADD TO CART" }).first();
    await addBtn.click();

    // Go to cart
    await page.getByRole("link", { name: /cart/i }).click();
    const items = page.locator(".row.card.flex-row");
    const countBefore = await items.count();

    // Remove first product
    await page.locator(".btn.btn-danger", { hasText: "Remove" }).first().click();
    await page.waitForTimeout(1000);

    // Validate
    const countAfter = await items.count();
    if (countBefore > 1) {
      expect(countAfter).toBeLessThan(countBefore);
    } else {
      await expect(page.locator("text=Your cart is empty")).toBeVisible();
    }
  });

  /* ============================================================
     TEST 6 — Logged-in user flow (with checkout buttons)
  ============================================================ */
  test("Logged-in user sees Make Payment and Update Address buttons", async ({ page }) => {
    // Simulate logged-in session (using auth in localStorage)
    await page.addInitScript(() => {
      localStorage.setItem(
        "auth",
        JSON.stringify({
          user: { name: "PlaywrightUser", address: "123 Test Street" },
          token: "test-token",
        })
      );
    });

    await page.goto(BASE_URL);
    await page.waitForSelector(".card");

    // Add an item
    const addBtn = page.locator(".btn.btn-dark", { hasText: "ADD TO CART" }).first();
    await addBtn.click();

    await page.goto(`${BASE_URL}/cart`);
    await expect(page.locator("text=Cart Summary")).toBeVisible();

    // Verify buttons for logged-in users
    await expect(page.locator('button:has-text("Make Payment")')).toBeVisible();
    await expect(page.locator('button:has-text("Update Address")')).toBeVisible();
  });

  /* ============================================================
     TEST 7 — Reset filters restores full product list
  ============================================================ */
  test("User applies filters then resets to restore full product list", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole("checkbox").first().check();
    await page.getByText("$0 to").click();
    await page.waitForTimeout(1000);

    // Reset filters
    await page.getByRole("button", { name: "RESET FILTERS" }).click();
    await page.waitForTimeout(2000);

    const count = await page.locator(".card").count();
    console.log("Total products after reset:", count);
    expect(count).toBeGreaterThan(3);
  });
});
