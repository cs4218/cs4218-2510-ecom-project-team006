import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/');
});

test.describe('Add product to cart', () => {
  test('should let guest filter by "Clothing" category, then add selected product to cart', async ({ page }) => {
    // Filter by category "Clothing"
    await page.getByRole('main').getByText('Clothing').click();

    // Wait until expected product image appears (ensures filter finished rendering)
    await expect(page.getByRole('img', { name: 'NUS T-shirt' })).toBeVisible({ timeout: 10000 });

    // Open product details for the Clothing item
    await page
      .locator('.card', { hasText: 'NUS T-shirt' })
      .getByRole('button', { name: 'More Details' })
      .click();

    // Verify product category is "Clothing"
    await expect(page.getByRole('main')).toContainText('Category : Clothing');

    // Save product name and price
    const nameText = await page.getByRole('heading', { name: /Name :/ }).textContent();
    const productName = nameText.replace('Name :', '').trim();
    const priceText = await page.locator('h6', { hasText: 'Price :' }).textContent();
    const productPrice = priceText.match(/\$[\d.]+/)[0]; 

    // Add to cart and navigate to cart page
    await page.getByRole('button', { name: 'ADD TO CART' }).click();
    await page.getByRole('link', { name: 'Cart' }).click();

    // Verify the cart summary shows exactly 1 item
    await expect(page.locator('h1')).toContainText(
      'You have 1 items in your cart Please login to checkout!'
    );

    // Verify product is in cart
    await expect(page.getByRole('main')).toContainText(productName);

    // Compare total price in cart page with product price
    const totalText = await page.getByTestId('total-price').textContent();
    const totalPrice = totalText.match(/\$[\d.]+/)[0];
    expect(totalPrice).toBe(productPrice);

    // Verify we are guest mode
    await expect(page.getByRole('main')).toContainText('Please Login to checkout');

    // Click on login button → verify login form appears
    await page.getByRole('button', { name: 'Please Login to checkout' }).click();
    await expect(page.getByRole('heading', { name: 'LOGIN FORM' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Forgot Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'LOGIN' })).toBeVisible();
  });

  test('should let guest filter by "Book" category and price, then add selected product to cart', async ({ page }) => {
    // Filter by category "Book"
    await page.getByRole('main').getByText('Book', { exact: true }).click();

    // Apply price filter
    await page.getByText('$0 to').click();

    // Wait until expected product image appears (ensures filter finished rendering)
    await expect(page.getByRole('img', { name: 'Novel' })).toBeVisible({ timeout: 10000 });

    // Open product details for the Book item
    await page
      .locator('.card', { hasText: 'Novel' })
      .getByRole('button', { name: 'More Details' })
      .click();

    // Verify product details page content
    await expect(page.getByRole('main')).toContainText('Name : Novel');
    await expect(page.getByRole('main')).toContainText('Price :$14.99');
    await expect(page.getByRole('main')).toContainText('Category : Book');

    // Save product name and price
    const nameText = await page.locator('h6', { hasText: 'Name :' }).textContent();
    const productName = nameText.replace('Name :', '').trim();
    const priceText = await page.locator('h6', { hasText: 'Price :' }).textContent();
    const productPrice = priceText.match(/\$[\d.]+/)[0];

    // Add product to cart
    await page.getByRole('button', { name: 'ADD TO CART' }).first().click();

    // Navigate to cart page
    await page.getByRole('link', { name: 'Cart' }).click();

    // Verify the cart contains the added product
    await expect(page.getByRole('main')).toContainText(productName);

    // Verify total price in cart matches product price
    const totalText = await page.getByTestId('total-price').textContent();
    const totalPrice = totalText.match(/\$[\d.]+/)[0];
    expect(totalPrice).toBe(productPrice);

    // Verify cart summary shows exactly 1 item and guest mode
    await expect(page.locator('h1')).toContainText(
      'You have 1 items in your cart Please login to checkout!'
    );

    // Verify checkout button asks guest to log in
    await expect(page.getByRole('button', { name: 'Please Login to checkout' })).toBeVisible();

    // Click login button → verify login form appears
    await page.getByRole('button', { name: 'Please Login to checkout' }).click();
    await expect(page.getByRole('heading', { name: 'LOGIN FORM' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Forgot Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'LOGIN' })).toBeVisible();
  });
});

test.describe('Search and add multiple products to cart', () => {
  test('should let guest search "book", verify 2 results, add both to cart, and validate total', async ({ page }) => {
    // Verify search bar visible and perform search
    await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible();
    await page.getByRole('searchbox', { name: 'Search' }).click();
    await page.getByRole('searchbox', { name: 'Search' }).fill('book');
    await page.getByRole('button', { name: 'Search' }).click();

    // Wait until search results appear
    await expect(page.locator('h6')).toContainText('Found 2');
    await expect(page.getByRole('img', { name: 'Textbook' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'The Law of Contract in Singapore' })).toBeVisible();

    // Record both product names and prices
    const products = [];

    // First product: Textbook
    const firstCard = page.locator('.card', { hasText: 'Textbook' });
    await expect(firstCard).toBeVisible();
    const firstPriceText = await firstCard.locator('p', { hasText: '$' }).first().textContent();
    const firstPrice = firstPriceText.match(/\$\s*[\d.]+/)[0]; 
    const firstName = 'Textbook';
    products.push({ name: firstName, price: parseFloat(firstPrice.replace('$', '')) });

    // Second product: The Law of Contract in Singapore
    const secondCard = page.locator('.card', { hasText: 'The Law of Contract in Singapore' });
    const secondPriceText = await secondCard.locator('p', { hasText: '$' }).first().textContent();
    const secondPrice = secondPriceText.match(/\$\s*[\d.]+/)[0]; 
    const secondName = 'The Law of Contract in Singapore';
    products.push({ name: secondName, price: parseFloat(secondPrice.replace('$', '')) });

    // Add both items to cart
    await firstCard.getByRole('button', { name: 'ADD TO CART' }).click();
    await secondCard.getByRole('button', { name: 'ADD TO CART' }).click();

    // Navigate to cart page
    await page.getByRole('link', { name: 'Cart' }).click();

    // Verify both product names appear in the cart
    for (const product of products) {
      await expect(page.getByRole('main')).toContainText(product.name);
    }

    // Verify total price equals sum of individual prices
    const expectedTotal = products.reduce((sum, p) => sum + p.price, 0).toFixed(2);
    const totalText = await page.getByTestId('total-price').textContent();
    const totalPrice = totalText.match(/\$[\d.]+/)[0].replace('$', '');
    expect(totalPrice).toBe(expectedTotal);

    // Verify guest mode (no user logged in)
    await expect(page.getByRole('main')).toContainText('Please Login to checkout');

    // Verify cart summary shows exactly 2 items
    await expect(page.locator('h1')).toContainText(
      'You have 2 items in your cart Please login to checkout!'
    );
  });
});

test.describe('Search and remove product from cart', () => {
  test('should update total price correctly when one product is removed', async ({ page }) => {
    // Navigate to homepage and search for "book"
    await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible();
    await page.getByRole('searchbox', { name: 'Search' }).fill('book');
    await page.getByRole('button', { name: 'Search' }).click();

    // Wait until both search results appear
    await expect(page.getByRole('img', { name: 'Textbook' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'The Law of Contract in Singapore' })).toBeVisible();

    // Record both prices dynamically
    const firstCard = page.locator('.card', { hasText: 'Textbook' });
    const secondCard = page.locator('.card', { hasText: 'The Law of Contract in Singapore' });

    const firstPriceText = await firstCard.locator('p', { hasText: '$' }).first().textContent();
    const secondPriceText = await secondCard.locator('p', { hasText: '$' }).first().textContent();

    const firstPrice = parseFloat(firstPriceText.match(/\$\s*([\d.]+)/)[1]);
    const secondPrice = parseFloat(secondPriceText.match(/\$\s*([\d.]+)/)[1]);

    const expectedTotal = (firstPrice + secondPrice).toFixed(2);

    // Add both items to cart
    await firstCard.getByRole('button', { name: 'ADD TO CART' }).click();
    await secondCard.getByRole('button', { name: 'ADD TO CART' }).click();

    // Navigate to cart page
    await page.getByRole('link', { name: 'Cart' }).click();

    // Verify both products and total
    await expect(page.getByRole('main')).toContainText('Textbook');
    await expect(page.getByRole('main')).toContainText('The Law of Contract in Singapore');
    await expect(page.getByTestId('total-price')).toContainText(`Total : $${expectedTotal}`);

    // Remove the first product
    await page.getByRole('button', { name: 'Remove' }).first().click();

    // Compute new expected total (only second product left)
    const remainingTotal = secondPrice.toFixed(2);

    // Wait until total updates correctly
    await expect(page.getByTestId('total-price')).toContainText(`Total : $${remainingTotal}`);

    // Verify only one product remains
    await expect(page.getByRole('main')).toContainText('The Law of Contract in Singapore');
    await expect(page.getByRole('main')).not.toContainText('Textbook');

    // Confirm guest mode and item count message
    await expect(page.locator('h1')).toContainText('You have 1 items in your cart Please login to checkout!');
  });
});