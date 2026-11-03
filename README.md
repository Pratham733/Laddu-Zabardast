# 🍬 Laddu Zabardast

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.25+-00ADD8?style=flat&logo=go&logoColor=white)](https://golang.org)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2+-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Local%20%2F%20Atlas-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

An authentic, modern e-commerce platform dedicated to handcrafted Indian artisanal sweets (*laddus*) and traditional homemade pickles (*achaar*). Built with a blazing-fast **Golang REST API backend** and an interactive, highly responsive **React + TypeScript + Vite frontend**.

---

## 📑 Table of Contents

- [⚡ Quick Start: One-Click IDE Debugger](#-quick-start-one-click-ide-debugger-recommended)
- [✅ Pre-flight Checklist (Things to Ensure Before Running)](#-pre-flight-checklist-things-to-ensure-before-running)
- [🏛 Project Architecture](#-project-architecture)
- [📁 Repository Structure](#-repository-structure)
- [✨ Key Features](#-key-features)
- [🛠 Tech Stack](#-tech-stack)
- [🚀 Manual Setup Guide](#-manual-setup-guide)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup-laddu-zabardast-be)
  - [2. Frontend Setup](#2-frontend-setup-laddu-zabardast-fe)
- [📡 API Reference](#-api-reference)
- [⚙ Environment Configuration](#-environment-configuration)
- [📜 Scripts & Commands](#-scripts--commands)
- [🔍 Troubleshooting & Common Issues](#-troubleshooting--common-issues)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ⚡ Quick Start: One-Click IDE Debugger (Recommended)

This repository includes a preconfigured [`.vscode/launch.json`](.vscode/launch.json) for VS Code, Cursor, and GoLand. You can launch and debug both the backend and frontend simultaneously with **zero extra setup**:

1. Open the repository root (`Laddu-Zabardast`) in your IDE.
2. Press **`F5`** (or go to **Run and Debug** via `Cmd+Shift+D` / `Ctrl+Shift+D`).
3. The default configuration **`Full Stack (Backend + Frontend)`** will start:
   - **Backend** running on `http://localhost:8080` with Delve live breakpoint debugging.
   - **Frontend** running on `http://localhost:7000` via the Vite development server.
4. Stopping the debug session will cleanly shut down both servers (`stopAll: true`).

### Available Launch Configurations
| Runner Option | Description |
|:--------------|:------------|
| **`Full Stack (Backend + Frontend)`** *(Default)* | Launches both Backend (`:8080`) and Frontend (`:7000`) concurrently. |
| **`Launch Backend`** | Starts only the Go API backend connected to local MongoDB. |
| **`Launch Frontend (Vite)`** | Starts only the Vite development server in an integrated debug terminal. |
| **`Launch Backend (Dev - Atlas)`** | Starts the Go backend with `APP_ENV=dev` (cloud MongoDB). |
| **`Debug Frontend (Chrome)`** | Attaches Chrome devtools to the frontend on `http://localhost:7000`. |

---

## ✅ Pre-flight Checklist (Things to Ensure Before Running)

Before launching the project, verify the following prerequisites:

### 1. MongoDB Service Running
The backend requires an active MongoDB database:
- **Local MongoDB (Default)**: Ensure MongoDB is running on port `27017`.
  - **macOS (Homebrew)**: `brew services start mongodb-community`
  - **Linux (systemd)**: `sudo systemctl start mongod`
  - **Docker**: `docker run -d -p 27017:27017 --name lz-mongo mongo:latest`
  - **Test connection**: `mongosh --eval "db.adminCommand('ping')"`
- When the backend connects successfully, it outputs:
  ```text
  Pinged your deployment. You successfully connected to MongoDB!
  Server running on :8080
  ```

### 2. Required Ports Are Available
Ensure no leftover processes are blocking the ports:
- **`8080`** for Backend API (`lsof -i :8080`)
- **`7000`** for Frontend Vite Dev Server (`lsof -i :7000`)
- **`27017`** for MongoDB (`lsof -i :27017`)

*If a port is in use, terminate the process with: `kill -9 <PID>`*

### 3. Node.js & Go Runtime Versions
- **Go**: v1.23+ or v1.25+ (`go version`)
- **Node.js**: v18.0.0+ (`node -v`)
- **npm**: v9.0.0+ (`npm -v`)

### 4. Frontend Environment Variable
Ensure `laddu-zabardast-fe/.env` exists and contains:
```env
VITE_BACKEND_URL=http://localhost:8080
```

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
                       │   WithBody[T] Strict Packets  │
                       │       Port: 8080              │
                       └──────────────┬────────────────┘
                                      │
                              MongoDB Driver v2
                                      │
                                      ▼
                       ┌───────────────────────────────┐
                       │        MongoDB Database       │
                       │  Users, Products, Orders,     │
                       │   Cart, Wishlist, Reviews     │
                       └───────────────────────────────┘
```

### Strict API Contract Architecture
- **Parameter-injected DTOs**: Request packets are automatically decoded into typed structures using the `utils.WithBody[T]` wrapper (`func(w, r, req T)`), preventing manual decode boilerplate.
- **Zero Fallback Validation**: Requests validate required entity IDs (`productId`, `userId`, `orderId`) strictly with no fallback chains. Invalid or missing identifiers return immediate, actionable HTTP 400 Bad Request responses.

---

## 📁 Repository Structure

```plaintext
Laddu-Zabardast/
├── .vscode/
│   └── launch.json                 # Unified IDE runner & debugger configurations
├── laddu-zabardast-be/             # Backend service (Golang)
│   ├── env/                        # TOML environment configuration files
│   │   ├── dev.toml                # Cloud / Atlas configuration
│   │   ├── dev.toml.example        # Example configuration template
│   │   └── local.toml              # Local MongoDB & CORS configuration
│   ├── public/
│   │   └── uploads/                # Static uploaded product media
│   ├── src/
│   │   ├── config/                 # TOML configuration parser
│   │   ├── cors/                   # Strict CORS middleware handler
│   │   ├── db/                     # MongoDB v2 connection client
│   │   ├── handler/                # HTTP request handlers (Auth, Product, Order, Cart, Wishlist, Review)
│   │   ├── model/                  # Database entity models
│   │   ├── packet/                 # Request & response contract DTOs
│   │   ├── routes/                 # Route registrations
│   │   ├── server/                 # Entrypoint (main.go)
│   │   ├── constant.go             # Global backend constants
│   │   └── utils.go                # WithBody[T] generic wrapper & JWT utilities
│   ├── design.md                   # API specification & design notes
│   ├── go.mod                      # Go module definition
│   └── go.sum                      # Dependency checksums
│
├── laddu-zabardast-fe/             # Frontend application (React + Vite)
│   ├── .env                        # Frontend environment variables (VITE_BACKEND_URL)
│   ├── src/
│   │   ├── components/             # UI component library (Shadcn/UI & Radix primitives)
│   │   ├── context/                # React context providers (Auth, Cart, Wishlist)
│   │   ├── hooks/                  # Custom application hooks
│   │   ├── lib/                    # Client utilities
│   │   ├── models/                 # Frontend TypeScript models
│   │   ├── packets/                # Frontend API request/response contracts
│   │   ├── pages/                  # Page route components
│   │   ├── queries/                # TanStack query definitions
│   │   ├── routes/                 # Client API call helpers & fetch client
│   │   ├── App.tsx                 # Client routing with React Router
│   │   ├── globals.css             # Tailwind base & design tokens
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
- **Interactive Storefront**: Handcrafted laddus and artisanal pickles with rich descriptions, dietary tags, and pricing.
- **Dynamic Search & Filtering**: Instant keyword search and category filtering (`laddu`, `pickle`).
- **Cart & Wishlist**: Real-time synchronized cart and wishlist with database persistence.
- **Product Reviews & Ratings**: Verified customer reviews with rating stars, feedback comments, and admin review pinning.
- **Streamlined Checkout**: Multi-step checkout with address selection and payment options (`COD`, `UPI`, `Card`, `Cash`).
- **Customer Account & Profiles**: User profile updates, secure password change, order tracking, and saved address book.
- **Dark / Light Mode**: Beautiful theme toggle powered by Tailwind CSS and Next Themes.
- **Smooth Animations**: Animated interactions and transitions powered by Framer Motion.

### 🛡 Admin & Operations
- **Product Management**: Create new products with local image upload, update product details, toggle availability, and delete items.
- **Order Management**: Monitor live customer orders, update delivery status (`processing` → `shipped` → `delivered`), and verify payment status.
- **Review Moderation**: Pin standout reviews and delete inappropriate submissions.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
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

## 🚀 Manual Setup Guide

If you prefer using the terminal rather than the IDE runner:

### Prerequisites

Ensure you have installed:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher) & `npm`
- [Go](https://go.dev/dl/) (v1.23+ or v1.25+)
- Local MongoDB running on `localhost:27017` (or MongoDB Atlas URI)

---

### 1. Backend Setup (`laddu-zabardast-be`)

1. **Navigate to backend directory**:
   ```bash
   cd laddu-zabardast-be
   ```

2. **Verify configuration (`env/local.toml`)**:
   Ensure `env/local.toml` points to your local MongoDB:
   ```toml
   routes = [
       "http://localhost:7000"
   ]

   [master_mongo]
   host = "mongodb://localhost:27017"
   database = "lz_local"

   [auth]
   jwt_secret = "seQdPYk/vWPg9AgUrPm9mrNQ1t3cpvvRy0jPQy9TJLY="
   ```

3. **Install dependencies & build**:
   ```bash
   go mod download
   go build ./...
   ```

4. **Start the backend server**:
   ```bash
   go run src/server/main.go
   ```
   *Expected output:*
   ```text
   Pinged your deployment. You successfully connected to MongoDB!
   Server running on :8080
   ```
   *Verify health check:* `curl http://localhost:8080/health` → `OK`

---

### 2. Frontend Setup (`laddu-zabardast-fe`)

1. **Navigate to frontend directory**:
   ```bash
   cd laddu-zabardast-fe
   ```

2. **Configure environment (`.env`)**:
   Create or verify `.env`:
   ```env
   VITE_BACKEND_URL=http://localhost:8080
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start Vite development server**:
   ```bash
   npm run dev
   ```
   *The application will open on:* `http://localhost:7000`

---

## 📡 API Reference

All backend API routes are served at `http://localhost:8080`.

### Health Check
| Method | Endpoint | Description | Auth Required |
|:-------|:---------|:------------|:-------------:|
| `GET` | `/health` | Server health verification | No |

### Authentication & User
| Method | Endpoint | Description | Auth Required |
|:-------|:---------|:------------|:-------------:|
| `POST` | `/signup` | Register a new user | No |
| `POST` | `/login` | User login & JWT issuance | No |
| `POST` | `/logout` | User session logout | Yes |
| `GET` | `/profile` | Get current user's profile | Yes |
| `POST` | `/update-profile` | Update profile information | Yes |
| `POST` | `/change-password` | Change account password | Yes |
| `GET` | `/addresses` | Fetch saved delivery addresses | Yes |
| `POST` | `/addresses` | Add a new address to address book | Yes |
| `DELETE` | `/addresses/{idx}` | Remove address by index | Yes |

### Products & Static Media
| Method | Endpoint | Description | Auth Required |
|:-------|:---------|:------------|:-------------:|
| `GET` | `/products` | List all available products | No |
| `GET` | `/products/search?q={query}` | Search products by name/description | No |
| `GET` | `/products/{id}` | Get product details by ID | No |
| `POST` | `/products/create` | Create a new product (Supports image upload) | Yes |
| `PUT` | `/products/edit/{id}` | Update product information | Yes |
| `DELETE` | `/products/delete/{id}` | Delete a product | Yes |
| `GET` | `/uploads/{filename}` | Serve uploaded product media files | No |

### Cart & Wishlist
| Method | Endpoint | Description | Auth Required |
|:-------|:---------|:------------|:-------------:|
| `GET` | `/cart` | Fetch authenticated user's cart | Yes |
| `POST` | `/cart` | Replace/sync full cart items payload | Yes |
| `GET` | `/wishlist` | Fetch authenticated user's wishlist | Yes |
| `POST` | `/wishlist` | Replace/sync full wishlist product IDs | Yes |

### Reviews & Ratings
| Method | Endpoint | Description | Auth Required |
|:-------|:---------|:------------|:-------------:|
| `GET` | `/reviews/{productId}` | List verified reviews for a product | No |
| `POST` | `/reviews/create` | Submit a new review and rating | Yes |
| `PUT` | `/reviews/edit/{id}` | Update existing review content | Yes |
| `DELETE` | `/reviews/delete/{id}` | Remove a review | Yes |
| `POST` | `/reviews/pin/{id}` | Pin/unpin review to top (Admin) | Yes |

### Orders
| Method | Endpoint | Description | Auth Required |
|:-------|:---------|:------------|:-------------:|
| `GET` | `/orders` | List user orders (or all orders for Admin) | Yes |
| `GET` | `/orders/{id}` | Get detailed order summary | Yes |
| `POST` | `/orders` | Place a new order | Yes |
| `PUT` | `/orders/{id}` | Full update of order information | Yes |
| `PATCH` | `/orders/{id}` | Partial update of order or payment status | Yes |
| `DELETE` | `/orders/{id}` | Cancel/delete an order | Yes |

---

## ⚙ Environment Configuration

### Backend Configuration (`env/local.toml` or `env/dev.toml`)
| Key | Type | Description |
|:----|:-----|:------------|
| `routes` | `string[]` | Allowed CORS origins (e.g. `["http://localhost:7000"]`) |
| `master_mongo.host` | `string` | MongoDB connection URI (`mongodb://localhost:27017` or Atlas URI) |
| `master_mongo.database` | `string` | Target MongoDB database name (e.g. `lz_local`) |
| `auth.jwt_secret` | `string` | Secret key used for signing JWT tokens |

### Frontend Configuration (`laddu-zabardast-fe/.env`)
| Key | Default | Description |
|:----|:--------|:------------|
| `VITE_BACKEND_URL` | `http://localhost:8080` | URL of the running Go API backend |

---

## 📜 Scripts & Commands

### Frontend (`laddu-zabardast-fe`)
```bash
npm run dev        # Starts Vite development server on port 7000
npm run build      # Compiles production bundle into dist/
npm run preview    # Locally previews production build
npm run lint       # Runs ESLint checks
npm run typecheck  # Validates TypeScript types (tsc --noEmit)
```

### Backend (`laddu-zabardast-be`)
```bash
go run src/server/main.go               # Starts Go API server with local config
APP_ENV=dev go run src/server/main.go   # Starts Go API server with dev config
go build -o bin/server src/server/main.go  # Compiles binary into bin/server
go test ./...                           # Runs test suites
```

---

## 🔍 Troubleshooting & Common Issues

### 1. `error parsing uri: lookup ...: no such host`
- **Cause**: The MongoDB Atlas hostname in `env/dev.toml` does not resolve or has expired.
- **Fix**: Run with local MongoDB (default) or update `host` in `env/dev.toml` with an active Atlas cluster URI.

### 2. `failed to connect to `localhost:27017`: connection refused`
- **Cause**: Local MongoDB service is not started.
- **Fix**: Start MongoDB using `brew services start mongodb-community` (macOS) or `sudo systemctl start mongod` (Linux).

### 3. `Port 8080 is in use` or `Port 7000 is in use`
- **Cause**: Another instance of the backend or frontend is already running.
- **Fix**: Find and kill the process:
  ```bash
  lsof -i :8080  # Check backend PID
  kill -9 <PID>
  lsof -i :7000  # Check frontend PID
  kill -9 <PID>
  ```

### 4. CORS Errors in Browser Console
- **Cause**: Frontend origin does not match the allowed origins list in backend configuration.
- **Fix**: Ensure `routes = ["http://localhost:7000"]` is present in `laddu-zabardast-be/env/local.toml`.

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
