
# Expense Tracker API

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue)

A robust RESTful API for tracking personal expenses, built with Node.js, Express, TypeScript, and MongoDB. This service handles authentication, expense management, and categorization, serving as a backend for web and mobile clients.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Features

* **User Authentication**: Secure signup and login using JWT (JSON Web Tokens).
* **CRUD Operations**: Full Create, Read, Update, and Delete capabilities for expenses.
* **Advanced Filtering**: Filter expenses by date range, category, or payment method.
* **Data Validation**: Strict input validation using Zod/Joi.
* **Type Safety**: End-to-end type safety with TypeScript.
* **Database**: Scalable schema design using Mongoose.

## 🛠 Tech Stack

* **Runtime**: [Node.js](https://nodejs.org/)
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **Framework**: [Express.js](https://expressjs.com/)
* **Database**: [MongoDB](https://www.mongodb.com/) (Atlas or Local)
* **ODM**: [Mongoose](https://mongoosejs.com/)
* **Authentication**: JSON Web Tokens (JWT) & Bcrypt

## 🏁 Getting Started

Follow these steps to set up the project locally.

### Folder Structure

```
API
├── dist
│   ├── index.d.ts
│   ├── index.d.ts.map
│   ├── index.js
│   └── index.js.map
├── package.json
├── package-lock.json
├── README.md
├── tsconfig.json
├── .gitignore
├── .env
├── src
│   ├── config
│   │   └── db.ts
│   ├── controller
│   │   ├── TransactionController.ts
│   │   └── UserController.ts
│   ├── index.ts
│   ├── middleware
│   │   └── AuthMiddleware.ts
│   ├── models
│   │   ├── Transaction.ts
│   │   └── User.ts
│   ├── routes
│   │   ├── AuthRoutes.ts
│   │   └── TransactionRoutes.ts
│   ├── service
│   │   ├── TransactionService.ts
│   │   └── UserService.ts
│   └── types
│       └── express.d.ts
```

### Prerequisites

Ensure you have the following installed:
* Node.js (v18+)
* npm or yarn
* MongoDB (running locally or a cloud connection string)

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/your-username/expense-tracker-api.git](https://github.com/your-username/expense-tracker-api.git)
    cd expense-tracker-api
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Variables**
    Create a `.env` file in the root directory and add the following configuration:

    ```env
    NODE_ENV=development
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/expense_tracker
    JWT_SECRET=your_super_secret_jwt_key
    JWT_EXPIRES_IN=7d
    ```

4.  **Build the project** (Optional for dev, required for prod)
    ```bash
    npm run build
    ```

## ⚡ Usage

### Development Mode
Runs the server with hot-reloading (via `nodemon` or `ts-node`).

```bash
npm run dev
