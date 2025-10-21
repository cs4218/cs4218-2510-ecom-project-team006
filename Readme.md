# CS4218 Project - Virtual Vault
## Continuous Integration (CI)
- [View MS1 GitHub Actions Workflow](https://github.com/cs4218/cs4218-2510-ecom-project-team006/actions/runs/18257169259/job/51980118837)

## Workload Distribution (MS1)

| Assignee | Features | Frontend Files | Backend Files / Controllers |
|---|-----------------|----------------|----------------------------|
| Low Zheng Hui | Protected Routes + Registration + Login + General | `context/auth.js`<br>`pages/Auth/Register.js`<br>`pages/Auth/Login.js`<br>`components/Routes/Private.js`<br>`components/UserMenu.js`<br>`pages/user/Dashboard.js` | `helpers/authHelper.js`<br>`middlewares/authMiddleware.js`<br>`controllers/authController.js`<br> - `registerController`<br> - `loginController`<br> - `forgotPasswordController`<br> - `testController`<br>`models/userModel.js` |
| Wong Swee Chong, Dave | Admin Dashboard + Admin Actions + Admin View Orders + Admin View Products + Admin View Users | `components/AdminMenu.js`<br>`pages/admin/AdminDashboard.js`<br>`components/Form/CategoryForm.js`<br>`pages/admin/CreateCategory.js`<br>`pages/admin/CreateProduct.js`<br>`pages/admin/UpdateProduct.js`<br>`pages/admin/AdminOrders.js`<br>`pages/admin/Products.js`<br>`pages/admin/Users.js` | `controllers/categoryController.js`<br> - `createCategoryController`<br> - `updateCategoryController`<br> - `deleteCategoryController`<br>`controllers/productController.js`<br> - `createProductController`<br> - `deleteProductController`<br> - `updateProductController` |
| Liu Yifan（username: nusliuyifan; Lord Snow) | General + Orders + Profile | `components/Footer.js`<br>`components/Header.js`<br>`components/Layout.js`<br>`components/Spinner.js`<br>`pages/About.js`<br>`pages/Pagenotfound.js`<br>`pages/user/Orders.js`<br>`pages/user/Profile.js` | `config/db.js`<br>`controllers/authController.js`<br> - `updateProfileController`<br> - `getOrdersController`<br> - `getAllOrdersController`<br> - `orderStatusController`<br>`models/orderModel.js` |
| Branson Lam Jian Tao | Product + Contact + Policy | `pages/ProductDetails.js`<br>`pages/CategoryProduct.js`<br>`pages/Contact.js`<br>`pages/Policy.js` | `controllers/productController.js`<br> - `getProductController`<br> - `getSingleProductController`<br> - `productPhotoController`<br> - `productFiltersController`<br> - `productCountController`<br> - `productListController`<br> - `searchProductController`<br> - `realtedProductController`<br> - `productCategoryController`<br>`models/productModel.js` |
| Ling Jun Long | Search + Home + Cart + Category + Payment | `components/Form/SearchInput.js`<br>`context/search.js`<br>`pages/Search.js`<br>`pages/Homepage.js`<br>`context/cart.js`<br>`pages/CartPage.js`<br>`hooks/useCategory.js`<br>`pages/Categories.js` | `controllers/categoryController.js`<br> - `categoryController`<br> - `singleCategoryController`<br>`models/categoryModel.js`<br>`controllers/productController.js`<br> - `braintreeTokenController`<br> - `brainTreePaymentController` |


## Workload Distribution (MS2)
| Assignee | Integration Testing | UI Testing |
|---|-----------------|----------------|
| Low Zheng Hui | *[Integration Testing Placeholder]* | *[UI Testing Placeholder]* |
| Wong Swee Chong, Dave | `pages/admin/AdminDashboard.integration.test.js`<br>`controllers/categoryController.integration.test.js`<br>`controllers/productController.admin.integration.test.js` | `tests/admin-dashboard.spec.js` |
| Liu Yifan (username: nusliuyifan) | `controllers/orderManagement.integration.test.js`<br> `controllers/updateProfile.integration.test.js`  | `tests/footer.spec.js`<br> `tests/about.spec.js`<br> `tests/header.spec.js`<br> `tests/pagenotfound.spec.js`<br>`tests/spinner.spec.js`|
| Branson Lam Jian Tao | `controllers/productController.integration.test.js` <br> `pages/CategoryProduct.integration.test.js` <br> `pages/ProductDetails.integration.test.js` | `tests/category-product.spec.js` <br> `tests/contact.spec.js` <br> `tests/policy.spec.js` <br> `tests/product-details.spec.js` |
| Ling Jun Long | `pages/CartPage.integration.test.js`<br>`pages/HomePage.integration.test.js`<br>`controllers/category.integration.test.js` | `tests/home-search-cart.spec.js` |


## 1. Project Introduction

Virtual Vault is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) e-commerce website, offering seamless connectivity and user-friendly features. The platform provides a robust framework for online shopping. The website is designed to adapt to evolving business needs and can be efficiently extended.

## 2. Website Features

- **User Authentication**: Secure user authentication system implemented to manage user accounts and sessions.
- **Payment Gateway Integration**: Seamless integration with popular payment gateways for secure and reliable online transactions.
- **Search and Filters**: Advanced search functionality and filters to help users easily find products based on their preferences.
- **Product Set**: Organized product sets for efficient navigation and browsing through various categories and collections.

## 3. Your Task

- **Unit and Integration Testing**: Utilize Jest for writing and running tests to ensure individual components and functions work as expected, finding and fixing bugs in the process.
- **UI Testing**: Utilize Playwright for UI testing to validate the behavior and appearance of the website's user interface.
- **Code Analysis and Coverage**: Utilize SonarQube for static code analysis and coverage reports to maintain code quality and identify potential issues.
- **Load Testing**: Leverage JMeter for load testing to assess the performance and scalability of the ecommerce platform under various traffic conditions.

## 4. Setting Up The Project

### 1. Installing Node.js

1. **Download and Install Node.js**:

   - Visit [nodejs.org](https://nodejs.org) to download and install Node.js.

2. **Verify Installation**:
   - Open your terminal and check the installed versions of Node.js and npm:
     ```bash
     node -v
     npm -v
     ```

### 2. MongoDB Setup

1. **Download and Install MongoDB Compass**:

   - Visit [MongoDB Compass](https://www.mongodb.com/products/tools/compass) and download and install MongoDB Compass for your operating system.

2. **Create a New Cluster**:

   - Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
   - After logging in, create a project and within that project deploy a free cluster.

3. **Configure Database Access**:

   - Create a new user for your database (if not alredy done so) in MongoDB Atlas.
   - Navigate to "Database Access" under "Security" and create a new user with the appropriate permissions.

4. **Whitelist IP Address**:

   - Go to "Network Access" under "Security" and whitelist your IP address to allow access from your machine.
   - For example, you could whitelist 0.0.0.0 to allow access from anywhere for ease of use.

5. **Connect to the Database**:

   - In your cluster's page on MongoDB Atlas, click on "Connect" and choose "Compass".
   - Copy the connection string.

6. **Establish Connection with MongoDB Compass**:
   - Open MongoDB Compass on your local machine, paste the connection string (replace the necessary placeholders), and establish a connection to your cluster.

### 3. Application Setup

To download and use the MERN (MongoDB, Express.js, React.js, Node.js) app from GitHub, follow these general steps:

1. **Clone the Repository**

   - Go to the GitHub repository of the MERN app.
   - Click on the "Code" button and copy the URL of the repository.
   - Open your terminal or command prompt.
   - Use the `git clone` command followed by the repository URL to clone the repository to your local machine:
     ```bash
     git clone <repository_url>
     ```
   - Navigate into the cloned directory.

2. **Install Frontend and Backend Dependencies**

   - Run the following command in your project's root directory:

     ```
     npm install && cd client && npm install && cd ..
     ```

3. **Add database connection string to `.env`**

   - Add the connection string copied from MongoDB Atlas to the `.env` file inside the project directory (replace the necessary placeholders):
     ```env
     MONGO_URL = <connection string>
     ```

4. **Adding sample data to database**

   - Download “Sample DB Schema” from Canvas and extract it.
   - In MongoDB Compass, create a database named `test` under your cluster.
   - Add four collections to this database: `categories`, `orders`, `products`, and `users`.
   - Under each collection, click "ADD DATA" and import the respective JSON from the extracted "Sample DB Schema".

5. **Running the Application**
   - Open your web browser.
   - Use `npm run dev` to run the app from root directory, which starts the development server.
   - Navigate to `http://localhost:3000` to access the application.

## 5. Unit Testing with Jest

Unit testing is a crucial aspect of software development aimed at verifying the functionality of individual units or components of a software application. It involves isolating these units and subjecting them to various test scenarios to ensure their correctness.  
Jest is a popular JavaScript testing framework widely used for unit testing. It offers a simple and efficient way to write and execute tests in JavaScript projects.

### Getting Started with Jest

To begin unit testing with Jest in your project, follow these steps:

1. **Install Jest**:  
   Use your preferred package manager to install Jest. For instance, with npm:

   ```bash
   npm install --save-dev jest

   ```

2. **Write Tests**  
   Create test files for your components or units where you define test cases to evaluate their behaviour.

3. **Run Tests**  
   Execute your tests using Jest to ensure that your components meet the expected behaviour.  
   You can run the tests by using the following command in the root of the directory:

   - **Frontend tests**

     ```bash
     npm run test:frontend
     ```

   - **Backend tests**

     ```bash
     npm run test:backend
     ```

   - **All the tests**
     ```bash
     npm run test
     ```
