import { test, expect } from '@playwright/test';
test.describe.configure({ mode: 'serial' });

// AI Attribution: The following test code was generated with the assistance of AI (ChatGPT).

// Note: Tests are run in serial as some later tests may have dependencies on earlier tests. 
// As such, some workflows in later tests can be seen as extensions to earlier tests.

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/');

  // login as admin account
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@example.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('abcd');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.getByRole('link', { name: 'Admin' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
});

test.describe('Admin Dashboard', () => {
  test('rendering of Admin Dashboard', async ({ page }) => {
    // check admin panel labels
    await expect(page.getByRole('heading', { name: 'Admin Panel' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Admin Name : Admin' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Admin Email : admin@example.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Admin Contact :' })).toBeVisible();

    // check admin sidebar links
    await expect(page.getByRole('link', { name: 'Create Category' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create Product' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();

    // check navigation of each link 
    await page.getByRole('link', { name: 'Create Category' }).click();
    await expect(page.getByRole('heading', { name: 'Manage Category' })).toBeVisible();

    await page.getByRole('link', { name: 'Create Product' }).click();
    await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();

    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page.getByRole('heading', { name: 'All Products List' })).toBeVisible();

    await page.getByRole('link', { name: 'Orders' }).click();
    await expect(page.getByRole('heading', { name: 'All Orders' })).toBeVisible();

    await page.getByRole('link', { name: 'Users' }).click();
    await expect(page.getByRole('heading', { name: 'All Users' })).toBeVisible();
  });

  test('rendering of header, search bar and footer', async ({ page }) => {
    // check header and search bar
    await expect(page.getByRole('link', { name: '🛒 Virtual Vault' })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Categories' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cart' })).toBeVisible();

    // check footer
    await expect(page.getByRole('heading', { name: 'All rights reserved. ©' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
  })
})

test.describe('Category Management', () => {
  test('rendering of Create Category page', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/admin/create-category')

    // check existing 3 categories are present
    await expect(page.getByRole('cell', { name: 'Electronics' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Book' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Clothing' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' }).nth(1)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' }).nth(2)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' }).nth(1)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' }).nth(2)).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter new category' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
  })

  test('successful create, update and delete of category', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/admin/create-category')

    // create new category
    await page.getByRole('textbox', { name: 'Enter new category' }).fill('New Category');
    await page.getByRole('button', { name: 'Submit' }).click();

    // new category appears on page
    await expect(page.getByRole('cell', { name: 'New Category' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' }).nth(3)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' }).nth(3)).toBeVisible();

    // new category appears on home page
    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page.locator('label').filter({ hasText: 'New Category' })).toBeVisible();

    // new category appears in header
    await page.getByRole('link', { name: 'Categories' }).click();
    await expect(page.getByRole('link', { name: 'New Category' })).toBeVisible();

    await page.goto('http://localhost:3000/dashboard/admin/create-category')

    // update category 
    await page.getByRole('button', { name: 'Edit' }).nth(3).click();
    await expect(page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' })).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Submit' })).toBeVisible();
    await page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).fill('Updated Category');
    await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();

    // updated category appears on page
    await expect(page.getByRole('cell', { name: 'Updated Category' })).toBeVisible();

    // updatd category appears on home page
    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page.getByRole('main').getByText('Updated Category')).toBeVisible();

    // updated category appears in header
    await page.getByRole('link', { name: 'Categories' }).click();
    await expect(page.getByRole('link', { name: 'Updated Category' })).toBeVisible();

    await page.goto('http://localhost:3000/dashboard/admin/create-category')
    
    // delete category
    await page.getByRole('link', { name: 'Create Category' }).click();
    await page.getByRole('button', { name: 'Delete' }).nth(3).click();

    // deleted category does not appear on page
    await expect(page.getByRole('cell', { name: 'Updated Category' })).not.toBeVisible();

    // deleted category does not appear on home page
    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page.getByRole('main').getByText('Updated Category')).not.toBeVisible();

    // deleted category does not appear in header
    await page.getByRole('link', { name: 'Categories' }).click();
    await expect(page.getByRole('link', { name: 'Updated Category' })).not.toBeVisible();
  })

  test('invalid create and update of category', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/admin/create-category')

    // create empty category fails
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('button', { name: 'Edit' }).nth(3)).not.toBeVisible();

    // create duplicate category fails
    await page.getByRole('textbox', { name: 'Enter new category' }).fill('Electronics');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('button', { name: 'Edit' }).nth(3)).not.toBeVisible();

    await page.getByRole('button', { name: 'Edit' }).first().click();
    
    // update to empty category fails
    await page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).fill('');
    await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('dialog').locator('div').filter({ hasText: 'Submit' }).nth(1)).toBeVisible();
    
    // update to existing category fails
    await page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).fill('Book');
    await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('dialog').locator('div').filter({ hasText: 'Submit' }).nth(1)).toBeVisible();
  })

  test('closing of update dialog', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/admin/create-category');

    // closing by clicking outside
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.locator('.ant-modal-wrap').click();
    await expect(page.getByRole('dialog').locator('div').filter({ hasText: 'Submit' }).nth(1)).not.toBeVisible();
    
    // closing by clicking x button
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('dialog').locator('div').filter({ hasText: 'Submit' }).nth(1)).not.toBeVisible();
    
    // closing on update
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('dialog').locator('div').filter({ hasText: 'Submit' }).nth(1)).not.toBeVisible();
  })

  test('successful update and delete of existing category', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/admin/create-category')

    // update electronics category
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).fill('Updated Electronics');
    await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();

    // updated category appears on page
    await expect(page.getByRole('cell', { name: 'Updated Electronics' })).toBeVisible();

    // updated category appears on home page
    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page.getByRole('main').getByText('Updated Electronics')).toBeVisible();

    // filtering by updated category shows original electronics products
    await page.getByRole('checkbox', { name: 'Updated Electronics' }).check();
    await expect(page.getByRole('img', { name: 'Laptop' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Smartphone' })).toBeVisible();

    // updated category appears in header
    await page.getByRole('link', { name: 'Categories' }).click();
    await expect(page.getByRole('link', { name: 'Updated Electronics' })).toBeVisible();

    // updated category page shows original electronics products
    await page.getByRole('link', { name: 'Updated Electronics' }).click();
    await expect(page.getByRole('img', { name: 'Laptop' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Smartphone' })).toBeVisible();

    // product pages show updated category
    await page.getByRole('button', { name: 'More Details' }).first().click();
    await expect(page.getByRole('heading', { name: 'Category : Updated Electronics' })).toBeVisible();
    await page.goBack();
    await page.getByRole('button', { name: 'More Details' }).nth(1).click();
    await expect(page.getByRole('heading', { name: 'Category : Updated Electronics' })).toBeVisible();
    
    await page.goto('http://localhost:3000/dashboard/admin/create-category')

    // delete electronics category
    await page.getByRole('button', { name: 'Delete' }).first().click();

    // deleted category does not appear on page
    await expect(page.getByRole('cell', { name: 'Updated Electronics' })).not.toBeVisible();

    // deleted category does not appear on home page
    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page.getByRole('main').getByText('Updated Electronics')).not.toBeVisible();

    // deleted category does not appear in header
    await page.getByRole('link', { name: 'Categories' }).click();
    await expect(page.getByRole('link', { name: 'Updated Electronics' })).not.toBeVisible();
    
    // product pages show deleted category
    await page.locator('div:nth-child(4) > .card-body > div:nth-child(3) > button').first().click();
    await expect(page.getByRole('heading', { name: 'Category :' })).toBeVisible();
    await page.goBack()
    await page.locator('div:nth-child(5) > .card-body > div:nth-child(3) > button').first().click();
    await expect(page.getByRole('heading', { name: 'Category :' })).toBeVisible();
  })
});

test.describe('Product Management', () => {
  test('rendering of Products page', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/admin/products')

    await expect(page.getByRole('link', { name: 'Novel Novel A bestselling' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'The Law of Contract in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'NUS T-shirt NUS T-shirt Plain' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Smartphone Smartphone A high-' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Laptop Laptop A powerful' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Textbook Textbook A' })).toBeVisible();
  })

  test('rendering of Create Product page', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/admin/create-product')

    await expect(page.locator('div').filter({ hasText: /^Select a category$/ }).first()).toBeVisible();
    await page.locator('div').filter({ hasText: /^Select a category$/ }).first().click();
    await expect(page.getByText('Upload Photo')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Write a name' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Write a description' })).toBeVisible();
    await expect(page.getByPlaceholder('Write a price')).toBeVisible();
    await expect(page.getByPlaceholder('Write a quantity')).toBeVisible();
    await expect(page.locator('div').filter({ hasText: /^No$/ }).nth(1)).toBeVisible();
    await expect(page.getByRole('button', { name: 'CREATE PRODUCT' })).toBeVisible();
  })

  test('successful create, update and delete of product', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/admin/create-product');

    // create new product
    await page.locator('div').filter({ hasText: /^Select a category$/ }).first().click();
    await page.getByTitle('Book').locator('div').click();
    await page.getByText('Upload Photo').click();
    await page.locator('input[type="file"]').setInputFiles('./tests/images/journal.jpg');
    await page.getByRole('textbox', { name: 'Write a name' }).fill('Journal');
    await page.getByRole('textbox', { name: 'Write a description' }).fill('A simple journal');
    await page.getByPlaceholder('Write a price').fill('10');
    await page.getByPlaceholder('Write a quantity').fill('100');
    await page.locator('div').filter({ hasText: /^No$/ }).nth(1).click();
    await page.getByText('Yes').click();
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();

    // new product appears on admin product page
    await expect(page.getByRole('link', { name: 'Journal Journal A simple' })).toBeVisible();

    // new product appears on home page with correct details
    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page.getByRole('img', { name: 'Journal' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Journal' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '$10.00' })).toBeVisible();
    await expect(page.getByText('A simple journal...')).toBeVisible();

    // new product appears when filtering by category
    await page.getByRole('checkbox', { name: 'Book' }).check();
    await expect(page.getByRole('img', { name: 'Journal' })).toBeVisible();

    // new product appears on category page
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.getByRole('link', { name: 'Book' }).click();
    await expect(page.getByRole('img', { name: 'Journal' })).toBeVisible();

    // new product page has correct details
    await page.getByRole('button', { name: 'More Details' }).nth(3).click();
    await expect(page.getByRole('img', { name: 'Journal' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Name : Journal' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Description : A simple journal' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Price :$10.00' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Category : Book' })).toBeVisible();

    await page.goto('http://localhost:3000/dashboard/admin/products');
    await page.getByRole('link', { name: 'Journal Journal A simple' }).click();

    // update product page has correct details
    await expect(page.getByRole('main')).toContainText('Book');
    await expect(page.getByRole('img', { name: 'original_product_photo' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Write a name' })).toHaveValue('Journal');
    await expect(page.getByPlaceholder('Write a description')).toContainText('A simple journal');
    await expect(page.getByPlaceholder('Write a price')).toHaveValue('10');
    await expect(page.getByPlaceholder('Write a quantity')).toHaveValue('100');
    await expect(page.getByText('Yes')).toBeVisible();

    // update product
    await page.locator('div').filter({ hasText: /^Book$/ }).first().click();
    await page.getByTitle('Clothing').locator('div').click();
    await page.getByText('Upload Photo').click();
    await page.locator('input[type="file"]').setInputFiles('./tests/images/journal.jpg');
    await page.getByRole('textbox', { name: 'Write a name' }).fill('Updated Journal');
    await page.getByRole('textbox', { name: 'Write a description' }).fill('An updated journal');
    await page.getByPlaceholder('Write a price').fill('1000');
    await page.getByPlaceholder('Write a quantity').fill('10000');
    await page.locator('div').filter({ hasText: /^Yes$/ }).nth(1).click();
    await page.getByText('No').click();
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();

    // updated product appears on admin product page
    await expect(page.getByRole('link', { name: 'Updated Journal Updated' })).toBeVisible();

    // updated product appears on home page with correct details
    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page.getByRole('img', { name: 'Updated Journal' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Updated Journal' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '$1,000.00' })).toBeVisible();
    await expect(page.getByText('An updated journal...')).toBeVisible();

     // updated product appears when filtering by updated category
    await page.getByRole('checkbox', { name: 'Clothing' }).check();
    await expect(page.getByRole('img', { name: 'Updated Journal' })).toBeVisible();

    // updated product appears on category page
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.getByRole('link', { name: 'Clothing' }).click();
    await expect(page.getByRole('img', { name: 'Updated Journal' })).toBeVisible();

    // updated product page has correct details
    await page.getByRole('button', { name: 'More Details' }).nth(1).click();
    await expect(page.getByRole('img', { name: 'Updated Journal' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Name : Updated Journal' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Description : An updated journal' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Price :$1,000.00' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Category : Clothing' })).toBeVisible();

    await page.goto('http://localhost:3000/dashboard/admin/products');
    await page.getByRole('link', { name: 'Updated Journal Updated' }).click();

    // update product page has updated details
    await expect(page.getByRole('main')).toContainText('Clothing');
    await expect(page.getByRole('img', { name: 'original_product_photo' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Write a name' })).toHaveValue('Updated Journal');
    await expect(page.getByPlaceholder('Write a description')).toContainText('An updated journal');
    await expect(page.getByPlaceholder('Write a price')).toHaveValue('1000');
    await expect(page.getByPlaceholder('Write a quantity')).toHaveValue('10000');
    await expect(page.getByText('No')).toBeVisible();

    // delete product
    page.once('dialog', dialog => {
      dialog.accept().catch(() => {});
    });
    await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();
    await page.goto('http://localhost:3000/dashboard/admin/products');
    await page.getByRole('link', { name: 'Home' }).click();

    // deleted product does not appear on admin product page
    await expect(page.getByRole('link', { name: 'Updated Journal Updated' })).not.toBeVisible();

    // deleted product does not appear on home page
    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page.getByRole('img', { name: 'Updated Journal' })).not.toBeVisible();
  })

  test('successful create of category and product using new category', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/admin/create-category');

    // create new category
    await page.getByRole('textbox', { name: 'Enter new category' }).fill('Fruit');
    await page.getByRole('button', { name: 'Submit' }).click();

    // create new product with new category
    await page.getByRole('link', { name: 'Create Product' }).click();
    await page.locator('div').filter({ hasText: /^Select a category$/ }).first().click();
    await page.getByTitle('Fruit').locator('div').click();
    await page.getByText('Upload Photo').click();
    await page.locator('input[type="file"]').setInputFiles('./tests/images/fruit.jpg');
    await page.getByRole('textbox', { name: 'Write a name' }).fill('Assorted fruit');
    await page.getByRole('textbox', { name: 'Write a description' }).fill('A lot of fruit');
    await page.getByPlaceholder('Write a price').fill('20');
    await page.getByPlaceholder('Write a quantity').fill('100');
    await page.locator('div').filter({ hasText: /^No$/ }).nth(1).click();
    await page.getByText('Yes').click();
    await page.getByText('Create ProductFruitfruit.').click();
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();

    // new product appears on admin product page
    await expect(page.getByRole('link', { name: 'Assorted fruit Assorted fruit' })).toBeVisible();

    // new product appears on home page
    await page.getByRole('link', { name: 'Home' }).click();

    // new product appears when filtering by category
    await page.locator('label').filter({ hasText: 'Fruit' }).click();
    await expect(page.getByRole('img', { name: 'Assorted fruit' })).toBeVisible();

    // new product appears on category page
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.getByRole('link', { name: 'Fruit' }).click();
    await expect(page.getByRole('img', { name: 'Assorted fruit' })).toBeVisible();
  })

  test('uploading and clearing of photo during product create and update', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/admin/create-product');

    // uploads photo when creating product
    await page.getByText('Upload Photo').click();
    await page.locator('input[type="file"]').setInputFiles('./tests/images/journal.jpg');
    await expect(page.getByRole('img', { name: 'product_photo' })).toBeVisible();
    await expect(page.getByText('journal.jpg')).toBeVisible();

    // clears photo when creating product
    await expect(page.getByRole('button', { name: 'Clear Photo' })).toBeVisible();
    await page.getByRole('button', { name: 'Clear Photo' }).click();
    await expect(page.getByText('Upload Photo')).toBeVisible();


    await page.getByRole('link', { name: 'Products' }).click();
    await page.getByRole('link', { name: 'Novel Novel A bestselling' }).click();

    // uploads photo when updating product
    await page.getByText('Upload Photo').click();
    await page.locator('input[type="file"]').setInputFiles('./tests/images/journal.jpg');
    await expect(page.getByRole('img', { name: 'product_photo' })).toBeVisible();
    await expect(page.getByText('journal.jpg')).toBeVisible();

    // clears photo when updating product
    await expect(page.getByRole('button', { name: 'Clear Photo' })).toBeVisible();
    await page.getByRole('button', { name: 'Clear Photo' }).click();
    await expect(page.getByRole('img', { name: 'original_product_photo' })).toBeVisible();
    await expect(page.getByText('Upload Photo')).toBeVisible();
  })

  test('updating of products with deleted category', async({ page }) => {
    await page.goto('http://localhost:3000/dashboard/admin/products');

    // updating of laptop and smartphone fails as electronics category is deleted
    await page.getByRole('link', { name: 'Laptop Laptop A powerful' }).click();
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
    await expect(page.getByRole('heading', { name: 'Update Product' })).toBeVisible();
    await page.getByRole('link', { name: 'Products' }).click();
    await page.getByRole('link', { name: 'Smartphone Smartphone A high-' }).click();
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
    await expect(page.getByRole('heading', { name: 'Update Product' })).toBeVisible();

    // recreate electronics category
    await page.getByRole('link', { name: 'Create Category' }).click();
    await page.getByRole('textbox', { name: 'Enter new category' }).fill('Electronics');
    await page.getByRole('button', { name: 'Submit' }).click();

    await page.getByRole('link', { name: 'Products' }).click();

    // updates products category successfully
    await page.getByRole('link', { name: 'Laptop Laptop A powerful' }).click();
    await page.locator('.ant-select').first().click();
    await page.getByTitle('Electronics').locator('div').click();
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
    await page.getByRole('link', { name: 'Smartphone Smartphone A high-' }).click();
    await page.locator('.ant-select').first().click();
    await page.getByTitle('Electronics').locator('div').click();
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();

    await page.waitForTimeout(100)
    // updated products appear under category filter in home page
    await page.getByRole('link', { name: 'Home' }).click();
    await page.getByRole('main').getByText('Electronics').click();
    await expect(page.getByRole('img', { name: 'Laptop' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Smartphone' })).toBeVisible();

    // updated products appear under category page
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.getByRole('link', { name: 'Electronics' }).click();
    await expect(page.getByRole('img', { name: 'Laptop' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Smartphone' })).toBeVisible();

    // updated products page have correct category information
    await page.getByRole('button', { name: 'More Details' }).first().click();
    await expect(page.getByRole('heading', { name: 'Category : Electronics' })).toBeVisible();
    await page.goBack()
    await page.getByRole('button', { name: 'More Details' }).nth(1).click();
    await expect(page.getByRole('heading', { name: 'Category : Electronics' })).toBeVisible();
  })

  test('invalid create of product', async({ page }) => {
    await page.goto('http://localhost:3000/dashboard/admin/create-product');
    
    // fill up all fields first
    await page.locator('div').filter({ hasText: /^Select a category$/ }).first().click();
    await page.getByTitle('Book').click();
    await page.getByRole('textbox', { name: 'Write a name' }).fill('Storybook');
    await page.getByRole('textbox', { name: 'Write a description' }).fill('A normal storybook');
    await page.getByPlaceholder('Write a price').fill('20');
    await page.getByPlaceholder('Write a quantity').fill('10');

    // clear category
    await page.locator('div').filter({ hasText: /^Book$/ }).first().click();
    await page.locator('.ant-select-item-option-content').first().click();
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();

    await page.locator('.ant-select').first().click();
    await page.getByTitle('Book').locator('div').click();

    // clear name
    await page.getByRole('textbox', { name: 'Write a name' }).fill('');
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();
    
    await page.getByRole('textbox', { name: 'Write a name' }).fill('Storybook');

    // use existing product name
    await page.getByRole('textbox', { name: 'Write a name' }).fill('textbook');
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();
    
    await page.getByRole('textbox', { name: 'Write a name' }).fill('Storybook');

    // clear description
    await page.getByRole('textbox', { name: 'Write a description' }).fill('');
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();

    await page.getByRole('textbox', { name: 'Write a description' }).fill('A normal storybook');

    // clear price
    await page.getByPlaceholder('Write a price').fill('');
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();

    await page.getByPlaceholder('Write a price').fill('20');

    // clear quantity
    await page.getByPlaceholder('Write a quantity').fill('');
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();

    await page.getByPlaceholder('Write a quantity').fill('10');

    // upload large photo
    await page.getByText('Upload Photo').click();
    await page.locator('input[type="file"]').setInputFiles('./tests/images/large_photo.jpg');
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();
  })

  test('invalid update of product', async({ page }) => {
    await page.goto('http://localhost:3000/dashboard/admin/products');
    await page.getByRole('link', { name: 'Novel Novel A bestselling' }).click()

    // clear name
    await page.getByRole('textbox', { name: 'Write a name' }).fill('');
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
    await expect(page.getByRole('heading', { name: 'Update Product' })).toBeVisible();
    
    await page.getByRole('textbox', { name: 'Write a name' }).fill('Novel');

    // use existing product name
    await page.getByRole('textbox', { name: 'Write a name' }).fill('textbook');
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
    await expect(page.getByRole('heading', { name: 'Update Product' })).toBeVisible();
    
    await page.getByRole('textbox', { name: 'Write a name' }).fill('Novel');

    // clear description
    await page.getByRole('textbox', { name: 'Write a description' }).fill('');
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
    await expect(page.getByRole('heading', { name: 'Update Product' })).toBeVisible();

    await page.getByRole('textbox', { name: 'Write a description' }).fill('A bestselling novel');

    // clear price
    await page.getByPlaceholder('Write a price').fill('');
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
    await expect(page.getByRole('heading', { name: 'Update Product' })).toBeVisible();

    await page.getByPlaceholder('Write a price').fill('14.99');

    // clear quantity
    await page.getByPlaceholder('Write a quantity').fill('');
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
    await expect(page.getByRole('heading', { name: 'Update Product' })).toBeVisible();

    await page.getByPlaceholder('Write a quantity').fill('200');

    // upload large photo
    await page.getByText('Upload Photo').click();
    await page.locator('input[type="file"]').setInputFiles('./tests/images/large_photo.jpg');
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
    await expect(page.getByRole('heading', { name: 'Update Product' })).toBeVisible();
  })
})

test.describe('User Management', () => {
  test('rendering of Users page', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/admin/users');

    // column headers
    await expect(page.getByRole('columnheader', { name: '#' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Phone' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Address' })).toBeVisible();

    // admin user information
    await expect(page.getByRole('cell', { name: 'Admin', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'admin@example.com' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '12345678' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Admin Address' })).toBeVisible();

    // 12 total rows in table
    await expect(page.getByRole('rowheader', { name: '12' })).toBeVisible();
    await expect(page.getByRole('rowheader', { name: '13' })).not.toBeVisible();
  })

  test('Users page reflects newly registered user', async ({ page }) => {
    // logout of admin account
    await page.getByRole('link', { name: 'Admin' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();

    // register new user account
    await page.getByRole('link', { name: 'Register' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('New User');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('newuser@example.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('newuser');
    await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('99998888');
    await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('New User Address');
    await page.getByPlaceholder('Enter Your DOB').fill('2000-01-01');
    await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).fill('Sport');
    await page.getByRole('button', { name: 'REGISTER' }).click();

    // log back into admin account
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@example.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('abcd');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    await page.getByRole('link', { name: 'Admin' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Users' }).click();
    
    // new user information is shown on admin users page
    await expect(page.getByRole('cell', { name: 'New User', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'newuser@example.com' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '99998888' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'New User Address' })).toBeVisible();

    // 13 total rows
    await expect(page.getByRole('rowheader', { name: '13' })).toBeVisible();
    await expect(page.getByRole('rowheader', { name: '14' })).not.toBeVisible();
  })

  test('Users page reflects updated user information', async ({ page }) => {
    // logout of admin account
    await page.getByRole('link', { name: 'Admin' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();

    // login to user account
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('newuser@example.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('newuser');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // update user information
    await page.getByRole('link', { name: 'New User' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Profile' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('Updated User');
    await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('99887766');
    await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('Updated User Address');
    await page.getByRole('button', { name: 'UPDATE' }).click();

    // logout of user account
    await page.getByRole('link', { name: 'Updated User' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();

    // log back into admin account
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@example.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('abcd');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    await page.getByRole('link', { name: 'Admin' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Users' }).click();

    // updated user information is shown on admin page
    await expect(page.getByRole('cell', { name: 'Updated User', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: '99887766' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Updated User Address' })).toBeVisible();
  })
})

test.describe('Order Management', () => {
  test('rendering of Orders page', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/admin/orders');
    
    // column headers
    await expect(page.getByRole('columnheader', { name: '#' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Buyer' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Date' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Payment' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Quantity' })).toBeVisible();
    
    // order information
    await expect(page.getByRole('cell', { name: '1', exact: true })).toBeVisible();
    await expect(page.getByText('Not Processed')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'CS 4218 Test Account' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'months ago' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Failed' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '3' })).toBeVisible();

    // first product in order
    await expect(page.locator('div').filter({ hasText: /^NUS T-shirtPlain NUS T-shirt for salePrice : 4\.99$/ }).first()).toBeVisible();
    await expect(page.getByRole('img', { name: 'NUS T-shirt' })).toBeVisible();
    await expect(page.getByText('NUS T-shirt', { exact: true })).toBeVisible();
    await expect(page.getByText('Plain NUS T-shirt for sale')).toBeVisible();
    await expect(page.getByText('Price : 4.99')).toBeVisible();

    // second product in order
    await expect(page.locator('div').filter({ hasText: /^LaptopA powerful laptopPrice : 1499\.99$/ }).first()).toBeVisible();
    await expect(page.getByRole('img', { name: 'Laptop' }).first()).toBeVisible();
    await expect(page.getByText('Laptop').first()).toBeVisible();
    await expect(page.getByText('A powerful laptop').first()).toBeVisible();
    await expect(page.getByText('Price : 1499.99').nth(1)).toBeVisible();
    
    await expect(page.locator('div').filter({ hasText: /^LaptopA powerful laptopPrice : 1499\.99$/ }).nth(2)).toBeVisible();
    await expect(page.getByRole('img', { name: 'Laptop' }).nth(1)).toBeVisible();
    await expect(page.getByText('Laptop').nth(2)).toBeVisible();
    await expect(page.getByText('A powerful laptop').nth(1)).toBeVisible();
    await expect(page.getByText('Price :').nth(2)).toBeVisible();
  })

  test('Orders page reflects updated product information', async({ page }) => {
    await page.goto('http://localhost:3000/dashboard/admin/products');

    // update NUS T-shirt information
    await page.getByRole('link', { name: 'NUS T-shirt NUS T-shirt Plain' }).click();
    await page.getByRole('textbox', { name: 'Write a name' }).fill('Updated NUS T-shirt');
    await page.getByRole('textbox', { name: 'Write a description' }).click();
    await page.getByRole('textbox', { name: 'Write a description' }).fill('An updated NUS T-shirt');
    await page.getByPlaceholder('Write a price').fill('15.99');
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();

    await page.getByRole('link', { name: 'Orders' }).click();
    await expect(page.locator('div').filter({ hasText: /^Updated NUS T-shirtAn updated NUS T-shirtPrice : 15\.99$/ }).first()).toBeVisible();
    await expect(page.getByRole('img', { name: 'Updated NUS T-shirt' })).toBeVisible();
    await expect(page.getByText('Updated NUS T-shirt', { exact: true })).toBeVisible();
    await expect(page.getByText('An updated NUS T-shirt')).toBeVisible();
    await expect(page.getByText('Price : 15.99')).toBeVisible();
  })

  test('Orders page reflects new order', async({ page }) => {
    // logout of admin account
    await page.getByRole('link', { name: 'Admin' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();

    // login to user account
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('newuser@example.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('newuser');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // add products to cart
    await page.locator('.card-name-price > button:nth-child(2)').first().click();
    await page.locator('.card-name-price > button:nth-child(2)').first().click();
    await page.locator('div:nth-child(2) > .card-body > div:nth-child(3) > button:nth-child(2)').click();
    await page.locator('div:nth-child(2) > .card-body > div:nth-child(3) > button:nth-child(2)').click();

    // checkout products
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.getByRole('button', { name: 'Paying with Card' }).click();
    await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole('textbox', { name: 'Credit Card Number' }).fill('3782 822463 10005');
    await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole('textbox', { name: 'Expiration Date' }).fill('1226');
    await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole('textbox', { name: 'CVV' }).fill('1234');
    await page.getByRole('button', { name: 'Make Payment' }).click();
    await page.waitForTimeout(1000);

    // logout of user account
    await page.getByRole('link', { name: 'Updated User' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();

    // log back into admin account
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@example.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('abcd');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    await page.getByRole('link', { name: 'Admin' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Orders' }).click();

    // new order information is shown on admin orders page
    await expect(page.getByRole('cell', { name: 'Updated User' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'seconds ago' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '4', exact: true })).toBeVisible();
    
    // first product
    await expect(page.locator('div').filter({ hasText: /^Assorted fruitA lot of fruitPrice : 20$/ }).first()).toBeVisible();
    await expect(page.getByRole('img', { name: 'Assorted fruit' }).first()).toBeVisible();
    await expect(page.getByText('Assorted fruit').first()).toBeVisible();
    await expect(page.getByText('A lot of fruit').first()).toBeVisible();
    await expect(page.getByText('Price : 20').first()).toBeVisible();

    // second product
    await expect(page.locator('div').filter({ hasText: /^Assorted fruitA lot of fruitPrice : 20$/ }).nth(2)).toBeVisible();
    await expect(page.getByRole('img', { name: 'Assorted fruit' }).nth(1)).toBeVisible();
    await expect(page.getByText('Assorted fruit').nth(1)).toBeVisible();
    await expect(page.getByText('A lot of fruit').nth(1)).toBeVisible();
    await expect(page.getByText('Price : 20').nth(1)).toBeVisible();

    // third product
    await expect(page.locator('div').filter({ hasText: /^The Law of Contract in SingaporeA bestselling book in SingaporPrice : 54\.99$/ }).first()).toBeVisible();
    await expect(page.getByRole('img', { name: 'The Law of Contract in' }).first()).toBeVisible();
    await expect(page.getByText('The Law of Contract in').first()).toBeVisible();
    await expect(page.getByText('The Law of Contract in SingaporeA bestselling book in SingaporPrice :').first()).toBeVisible();
    await expect(page.getByText('A bestselling book in Singapor').first()).toBeVisible();
    await expect(page.getByText('Price : 54.99').first()).toBeVisible();

    // fourth product
    await expect(page.locator('div').filter({ hasText: /^The Law of Contract in SingaporeA bestselling book in SingaporPrice : 54\.99$/ }).nth(2)).toBeVisible();
    await expect(page.getByRole('img', { name: 'The Law of Contract in' }).nth(1)).toBeVisible();
    await expect(page.getByText('The Law of Contract in').nth(1)).toBeVisible();
    await expect(page.getByText('A bestselling book in Singapor').nth(1)).toBeVisible();
    await expect(page.getByText('Price : 54.99').nth(1)).toBeVisible();
  })

  test('Updates on order page are reflected in user orders', async({ page }) => {
    await page.goto('http://localhost:3000/dashboard/admin/orders');

    // update order status
    await page.getByText('Not Processed').first().click();
    await page.getByTitle('Shipped').locator('div').click();
    await expect(page.locator('#root').getByText('Shipped').nth(1)).toBeVisible();

    // logout of admin account
    await page.getByRole('link', { name: 'Admin' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();

    // login to user acccount
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('newuser@example.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('newuser');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // user order shows updated status
    await page.getByRole('link', { name: 'Updated User' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Orders' }).click();
    await expect(page.getByRole('cell', { name: 'Shipped' })).toBeVisible();
  })
})