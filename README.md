# 🍬 Laddu Zabardast (लड्डू ज़बरदस्त)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.25+-00ADD8?style=flat&logo=go&logoColor=white)](https://golang.org)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.2+-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

An authentic, modern e-commerce platform dedicated to handcrafted Indian artisanal sweets (*laddus*) and traditional homemade pickles (*achaar*). Built with a blazing-fast **Golang REST API backend** and an interactive, highly responsive **React + TypeScript + Vite frontend**.

---

## 📑 Table of Contents

- [Project Architecture](#-project-architecture)
- [Repository Structure](#-repository-structure)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
  - [Frontend](#frontend)
  - [Backend](#backend)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup-laddu-zabardast-be)
  - [2. Frontend Setup](#2-frontend-setup-laddu-zabardast-fe)
- [API Reference](#-api-reference)
- [Environment Configuration](#-environment-configuration)
- [Scripts & Commands](#-scripts--commands)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🏛 Project Architecture

```
                       ┌───────────────────────────────┐
                       │          Client (Web)         │
                       │   React + Vite + TypeScript   │
                       │       Port: 7000              │
                       └──────────────┬────────────────┘
                                      │
                               REST / JSON (CORS)
                                      │
                                      ▼
                       ┌───────────────────────────────┐
                       │       Golang API Backend      │
                       │     Gorilla Mux + JWT Auth    │
                       │       Port: 8080              │
                       └──────────────┬────────────────┘
                                      │
                               MongoDB Driver v2
                                      │
                                      ▼
                       ┌───────────────────────────────┐
                       │        MongoDB Database       │
                       │ (Users, Products, Orders, etc)│
                       └───────────────────────────────┘
```

---

## 📁 Repository Structure

```plaintext
Laddu-Zabardast/
├── laddu-zabardast-be/             # Backend service (Golang)
│   ├── env/                        # Environment config files (TOML)
│   │   ├── dev.toml.example
│   │   └── local.toml
│   ├── src/
│   │   ├── config/                 # Config loader & TOML parser
│   │   ├── cors/                   # CORS middleware handler
│   │   ├── db/                     # MongoDB connection client
│   │   ├── handler/                # HTTP request handlers (Auth, User, Product, Order)
│   │   ├── model/                  # Data structures (User, Product, Order, Address)
│   │   ├── packet/                 # Request/Response DTO contracts
│   │   ├── routes/                 # Route registrations (Mux)
│   │   ├── server/                 # Application entrypoint (main.go)
│   │   ├── constant.go             # Global backend constants
│   │   ├── utils.go                # Token generation & helper utilities
│   │   └── validate.go             # Input validation logic
│   ├── design.md                   # Backend API specification & model design
│   ├── go.mod                      # Go module definition
│   └── go.sum                      # Go dependency checksums
│
├── laddu-zabardast-fe/             # Frontend application (React + Vite)
│   ├── env/                        # Frontend environment variables
│   │   └── .env
│   ├── src/
│   │   ├── app/                    # Top-level application layout
│   │   ├── components/             # Reusable UI & Layout components (Shadcn/UI)
│   │   ├── context/                # React context providers (Auth, Cart, Wishlist)
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Client utilities & helpers
│   │   ├── pages/                  # Route view components
│   │   ├── queries/                # TanStack query definitions
│   │   ├── types/                  # TypeScript interface definitions
│   │   ├── App.tsx                 # Client routing with React Router
│   │   ├── globals.css             # Tailwind base & custom design tokens
│   │   └── main.tsx                # Frontend entrypoint
│   ├── package.json                # Dependencies and frontend scripts
│   ├── tailwind.config.ts          # Tailwind styling configuration
│   ├── tsconfig.json               # TypeScript compiler config
│   └── vite.config.ts              # Vite configuration & path aliases
│
├── .gitignore                      # Monorepo git ignore rules
└── README.md                       # Repository documentation
```

---

## ✨ Key Features

### 🛍 Customer Experience
- **Interactive Storefront**: Explore handcrafted laddus and authentic pickles with rich descriptions, dietary tags, and pricing.
- **Dynamic Search & Filtering**: Instant keyword search and category filtering (`laddu`, `pickle`).
- **Cart & Wishlist**: Persistent cart and wishlist with fluid quantity management and price calculations.
- **Streamlined Checkout**: Multi-step checkout with address book selection and multiple payment methods (`COD`, `UPI`, `Card`, `Cash`).
- **Customer Account & Profiles**: User profile updates, password change, order history tracking, and saved delivery addresses.
- **Dark / Light Mode**: Beautiful theme toggle powered by Tailwind CSS and Next Themes.
- **Smooth Animations**: Micro-interactions and animated transitions powered by Framer Motion.

### 🛡 Admin & Operations
- **Product Management**: Create, update, toggle availability, and remove products.
- **Order Management**: Monitor live customer orders, update delivery status (`processing` → `shipped` → `delivered`), and verify payment status.
- **User Directory**: View registered users and manage permissions.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) primitives + [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State & Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

### Backend
- **Language**: [Golang (1.25+)](https://golang.org/)
- **HTTP Routing**: [Gorilla Mux](https://github.com/gorilla/mux)
- **Database**: [MongoDB](https://www.mongodb.com/) using official [mongo-driver/v2](https://pkg.go.dev/go.mongodb.org/mongo-driver/v2)
- **Authentication**: JWT ([golang-jwt/jwt/v5](https://github.com/golang-jwt/jwt))
- **Security**: Password hashing via [golang.org/x/crypto/bcrypt](https://pkg.go.dev/golang.org/x/crypto/bcrypt)
- **Configuration**: TOML via [pelletier/go-toml/v2](https://github.com/pelletier/go-toml)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher) & `npm`
- [Go](https://go.dev/dl/) (v1.23+ recommended)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account or local MongoDB instance

---

### 1. Backend Setup (`laddu-zabardast-be`)

1. **Navigate to the backend directory**:
   ```bash
   cd laddu-zabardast-be
   ```

2. **Configure environment settings**:
   Copy the sample environment file to create your configuration:
   ```bash
   cp env/dev.toml.example env/local.toml
   ```
   Open `env/local.toml` and configure your MongoDB connection string and allowed frontend origins:
   ```toml
   routes = [
       "http://localhost:7000"
   ]

   [master_mongo]
   host = "mongodb+srv://<username>:<password>@cluster.mongodb.net/?appName=LadduZabardast"
   database = "laddu_zabardast"
   ```

3. **Install dependencies**:
   ```bash
   go mod download
   ```

4. **Start the backend server**:
   ```bash
   go run src/server/main.go
   ```
   The backend API will start on: `http://localhost:8080`  
   Health check: `http://localhost:8080/health`

---

### 2. Frontend Setup (`laddu-zabardast-fe`)

1. **Navigate to the frontend directory**:
   ```bash
   cd laddu-zabardast-fe
   ```

2. **Configure environment variables**:
   Ensure `env/.env` contains the backend API URL:
   ```env
   BACKEND_URL="http://localhost:8080"
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   The web application will be live at: `http://localhost:7000`

---

## 📡 API Reference

All backend routes are served at `http://localhost:8080`.

| Method | Endpoint | Description | Auth Required |
|:-------|:---------|:------------|:-------------:|
| `GET` | `/health` | Server health check | No |
| `POST` | `/signup` | Register a new user | No |
| `POST` | `/login` | User login & JWT issuance | No |
| `POST` | `/logout` | User session logout | Yes |
| `GET` | `/profile` | Get current user's profile | Yes |
| `POST` / `PUT` | `/update-profile` | Update user details | Yes |
| `POST` | `/change-password` | Update account password | Yes |
| `GET` | `/addresses` | Fetch saved addresses | Yes |
| `POST` / `PUT` | `/addresses` | Save / update shipping address | Yes |
| `DELETE` | `/addresses/{idx}` | Remove address by index | Yes |
| `GET` | `/products` | List all available products | No |
| `GET` | `/products/search?q={query}` | Search products by name/description | No |
| `GET` | `/products/{id}` | Get product details by ID | No |
| `POST` | `/products/create` | Create a new product (Admin) | Yes |
| `PUT` | `/products/edit/{id}` | Update product information (Admin) | Yes |
| `DELETE` | `/products/delete/{id}` | Remove a product (Admin) | Yes |
| `GET` | `/orders` | List user orders / all orders (Admin) | Yes |
| `GET` | `/orders/{id}` | Get specific order details | Yes |
| `POST` | `/orders` | Place a new order | Yes |
| `PUT` | `/orders/{id}` | Update order status / payment status | Yes |
| `DELETE` | `/orders/{id}` | Cancel / remove order | Yes |

---

## ⚙ Environment Configuration

### Backend (`env/local.toml` or `env/dev.toml`)
| Key | Type | Description |
|:----|:-----|:------------|
| `routes` | Array of strings | List of allowed CORS origins (e.g. `["http://localhost:7000"]`) |
| `master_mongo.host` | String | MongoDB connection URI (`mongodb+srv://...` or `mongodb://localhost:27017`) |
| `master_mongo.database` | String | MongoDB database name (`laddu_zabardast`) |

### Frontend (`env/.env`)
| Key | Default | Description |
|:----|:--------|:------------|
| `BACKEND_URL` | `http://localhost:8080` | URL of the running Go API backend |

---

## 📜 Scripts & Commands

### Frontend (`laddu-zabardast-fe`)
```bash
npm run dev        # Starts Vite development server on port 7000
npm run build      # Compiles production bundle to dist/
npm run preview    # Locally previews production build
npm run lint       # Runs ESLint checks
npm run typecheck  # Validates TypeScript types with tsc
```

### Backend (`laddu-zabardast-be`)
```bash
go run src/server/main.go  # Starts the Go API server
go build -o bin/server src/server/main.go  # Compiles binary to bin/server
go test ./...              # Runs test suites
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
