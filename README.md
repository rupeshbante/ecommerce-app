# ShopEase — Full Stack E-Commerce App

A complete e-commerce application built with **Angular 18** (frontend) and **ASP.NET Core 8** (backend) with SQL Server.

## 🚀 Features

### Customer Side
- 🏠 Home page with hero banner, categories, featured products
- 🛍️ Product listing with filters, search, sorting
- 📦 Product detail with image, specs, reviews
- 🛒 Shopping cart with order summary
- 🔐 User authentication (JWT)
- 📋 Order history with status tracking

### Admin Panel (`/admin`)
- 📊 Dashboard — sales stats, revenue charts, recent orders
- 📦 Product Management — add/edit/delete, image upload
- 🗂️ Category Management — parent/sub-categories
- 🛒 Order Management — view all, update status
- 👥 Customer Management — profiles, order history
- 🎟️ Coupon Management — discount codes, expiry, usage limits
- 📈 Reports — sales charts, top products, category revenue
- 🔐 Users & Roles — Admin / Manager / Customer

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 18, TypeScript, CSS |
| Backend | ASP.NET Core 8, C# |
| Database | SQL Server (LocalDB) |
| Auth | JWT Bearer Tokens |
| ORM | Entity Framework Core 8 |

## ⚙️ How to Run

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- SQL Server LocalDB

### 1. Start Database
```powershell
sqllocaldb start MSSQLLocalDB
```

### 2. Start Backend
```powershell
cd ecommerce/backend
dotnet run --urls http://localhost:5000
```

### 3. Start Frontend
```powershell
cd ecommerce/frontend
npx ng serve
```

### 4. Open Browser
- **Store:** http://localhost:4200
- **Admin:** http://localhost:4200/admin
- **API Docs:** http://localhost:5000/swagger

## 🔑 Admin Credentials
| Field | Value |
|-------|-------|
| Email | admin@shopease.in |
| Password | Admin@123 |

## 📁 Project Structure
```
ecommerce-app/
├── ecommerce/
│   ├── backend/          # ASP.NET Core API
│   │   ├── Controllers/
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── DTOs/
│   │   └── Data/
│   └── frontend/         # Angular 18
│       └── src/app/
│           ├── core/
│           ├── features/
│           │   ├── admin/    # Admin panel
│           │   ├── products/
│           │   ├── cart/
│           │   ├── orders/
│           │   └── auth/
│           └── shared/
```

## 📸 Pages
- Home, Products, Product Detail, Cart, Orders
- Login, Register
- Admin: Dashboard, Products, Categories, Orders, Customers, Coupons, Reports, Users
