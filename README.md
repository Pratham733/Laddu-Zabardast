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
- **Local MongoDB (Default)**: Ensure MongoDB is running on port `27077`.
  - **macOS (Homebrew)**: `brew services start mongodb-community`
  - **Linux (systemd)**: `sudo systemctl start mongod`
  - **Docker**: `docker run -d -p 27077:27017 --name lz-mongo mongo:latest`
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
- **`27077`** for MongoDB (`lsof -i :27077`)

*If a port is in use, terminate the process with: `kill -9 <PID>`*

### 3. Node.js & Go Runtime Versions
- **Go**: v1.25+ (`go version`)
- **Node.js**: v20+ (`node -v`)
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
│   │   └── backend.local.env.example  # Local backend environment template
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
- **Product Reviews & Ratings**: Customer reviews with ratings, comments, and admin pinning.
- **Streamlined Checkout**: Checkout with saved addresses, cash on delivery, and optional UPI QR payments. An administrator verifies UPI payments.
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
- [Node.js](https://nodejs.org/) (v20 or higher) & `npm`
- [Go](https://go.dev/dl/) (v1.25+)
- Local MongoDB running on `127.0.0.1:27077` (or MongoDB Atlas URI)

---

### 1. Backend Setup (`laddu-zabardast-be`)

1. **Navigate to backend directory**:
   ```bash
   cd laddu-zabardast-be
   ```

2. **Set up the local environment**. Existing installations can use their private `env/backend.local.env`. On a fresh checkout, copy the template from the backend folder:

   ```bash
   cp env/backend.local.env.example env/backend.local.env
   chmod 600 env/backend.local.env
   ```

   Fill in `JWT_SECRET` using `openssl rand -hex 32` and set `LOCAL_ADMIN_EMAIL` to your local admin account. VS Code loads this file for **Launch Backend**. For **Dev - Atlas**, use `env/backend.dev.env` with the Atlas URI and `APP_ENV=dev`.

3. **Install dependencies & build**:
   ```bash
   go mod download
   go build ./...
   ```

4. **Start the backend server**:
   ```bash
   set -a
   source env/backend.local.env
   set +a
   go run ./src/server
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
| `GET` | `/products/{productId}/reviews` | List product reviews | No |
| `POST` | `/products/{productId}/reviews` | Submit a review and rating | Yes |
| `PUT` | `/reviews/{reviewId}` | Edit a review | Owner or admin |
| `DELETE` | `/reviews/{reviewId}` | Remove a review | Owner or admin |
| `PATCH` | `/reviews/{reviewId}` | Pin or unpin a review | Admin |

### Orders
| Method | Endpoint | Description | Auth Required |
|:-------|:---------|:------------|:-------------:|
| `GET` | `/orders` | List user orders (or all orders for Admin) | Yes |
| `GET` | `/orders/{id}` | Get detailed order summary | Yes |
| `POST` | `/orders` | Place a new order | Yes |
| `PUT` | `/orders/{id}` | Update order or payment status | Admin |
| `PATCH` | `/orders` | Update order or payment status by body `orderId` | Admin |
| `DELETE` | `/orders/{id}` | Delete an order | Admin |
| `GET` | `/generate-invoice?orderId={id}` | Download an order PDF | Owner or admin |

---

## ⚙ Environment Configuration

### Production backend configuration

Keep the production settings together in the private local file `laddu-zabardast-be/env/prod.json`. Git ignores this file. Keep it out of any deployment archive and enter the values in the hosting provider's environment or secret manager. The hosted backend loads settings from that environment.

Set these values in the host's environment or secret manager:

| Variable | Value |
|---|---|
| `APP_ENV` | `production`, which enables production config validation and secure cookies |
| `MONGODB_URI` | Private connection string for the production database user |
| `MONGODB_DATABASE` | Production database name |
| `JWT_SECRET` | A newly generated signing key of at least 32 bytes |
| `CORS_ORIGINS` | Comma-separated storefront HTTPS origins without trailing slashes |
| `PORT` | Port assigned by the host, unless `HTTP_ADDR` is set |
| `IMAGE_STORAGE` | Set to `r2` on Render. Defaults to `local` for the debugger. |
| `UPLOAD_DIR` | Optional local upload directory. When using local storage on a host, point this to a persistent volume. |

Keep the storefront and API on the same site for browser login cookies. Production accounts receive admin access through their stored MongoDB role. Set `ORDER_EMAIL_ADMIN` to the fulfillment inbox if SMTP is enabled. Use the Google and SMTP settings below for live delivery and sign-in. Rotate any MongoDB credentials and signing keys previously committed to Git before exposing the API.

### Deploy the backend to Render

Use one [paid Render Go web service](https://render.com/docs/deploy-go-nethttp), MongoDB Atlas, and a Cloudflare R2 Standard bucket. Render's Free web services block outbound SMTP on port 587. The paid service lets the API run the mail queue alongside HTTP requests. [Render Free instance limits](https://render.com/docs/free#other-limitations)

1. Create the production Atlas database and a database user with `readWrite` on that database. Create a new database password and generate the signing key with `openssl rand -hex 32`. In Render, copy the service's CIDRs from **Connect → Outbound** and add them to the [Atlas IP access list](https://www.mongodb.com/docs/atlas/security/ip-access-list/). Render publishes the [steps for finding the CIDRs](https://render.com/docs/outbound-ip-addresses). Revoke any database credentials that were previously committed to Git. Import only the production data you need.
2. Create an R2 Standard bucket, for example `laddu-zabardast-images`. Create an [R2 S3 API token](https://developers.cloudflare.com/r2/get-started/s3/) with **Object Read & Write** scoped to that bucket. Add `images.example.com` as the bucket's [custom domain](https://developers.cloudflare.com/r2/buckets/public-buckets/). Use the domain for public catalog images only.
3. In Render select **New → Web Service** and connect the Git repository. Fill in the service settings below. Enter the production variables from the preceding table and the R2, SMTP, and Google settings you plan to enable in Render's **Environment** tab. Keep `HTTP_ADDR` unset so that the app uses Render's `PORT`.
4. Deploy and check `https://<service>.onrender.com/health` for `200 OK`. Add `api.example.com` under [Custom Domains](https://render.com/docs/custom-domains) and create the DNS record Render provides. Check `/health` again on the new hostname before changing any storefront or mobile configuration.
5. Set `VITE_BACKEND_URL=https://api.example.com` at frontend build time. Set `CORS_ORIGINS` and `PASSWORD_RESET_WEB_ORIGIN` to the HTTPS storefront origin, such as `https://shop.example.com`. When enabling Google sign-in, set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from your Google web OAuth client, `GOOGLE_WEB_ORIGIN` to the storefront origin, and `GOOGLE_CALLBACK_URL` to `https://api.example.com/auth/google/callback`. Register that same callback with Google. Configure all four Google variables together. For mobile builds set `MOBILE_BACKEND_URL=https://api.example.com`. The local debug configuration continues to use the local API and MongoDB.

| Render setting | Value |
|---|---|
| Language | Go |
| Root Directory | `laddu-zabardast-be` |
| Build Command | `GOWORK=off go build -mod=mod -o server ./src/server` |
| Start Command | `./server` |
| Health Check Path | `/health` |

| Render image variable | Value |
|---|---|
| `IMAGE_STORAGE` | `r2` |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_BUCKET` | Bucket name |
| `R2_ACCESS_KEY_ID` | S3 API token access key ID |
| `R2_SECRET_ACCESS_KEY` | S3 API token secret access key |
| `R2_PUBLIC_BASE_URL` | `https://images.example.com` |

The admin uploader accepts JPEG, PNG, and WebP up to 10 MB and 24 megapixels. It stores one optimized image capped at 1,600 pixels on its longest side. Local mode saves to disk and R2 mode saves to `products/` in the bucket. MongoDB stores the image URL. If imported products have `/uploads/` URLs, transfer those files to R2 and update their URLs before cutover. For imported orders, check any saved item image URLs as well. Keep the source files until the migrated URLs work.

For Gmail use `ORDER_SMTP_HOST=smtp.gmail.com`, `ORDER_SMTP_PORT=587`, and `ORDER_SMTP_SECURITY=starttls`. Set `ORDER_SMTP_USER` and `ORDER_EMAIL_FROM` to `ladduzab@gmail.com`, `ORDER_SMTP_PASSWORD` to the Gmail app password, and `ORDER_EMAIL_ADMIN` to `spratham388@gmail.com` or the intended fulfillment inbox. Grant the production admin account its stored role using the database command under **Local administrator** below, after the account signs up.

Before launch, test password and Google sign-in, password reset, a COD order and invoice, confirmation emails to the customer and admin, cancellation, admin invoice export, and an uploaded product image after a redeploy. Use test recipients and verify actual inbox delivery. Set up a database backup that covers the invoice sequence and `issuedInvoices` before taking live orders.

### Frontend Configuration (`laddu-zabardast-fe/.env`)
| Key | Default | Description |
|:----|:--------|:------------|
| `VITE_BACKEND_URL` | `http://localhost:8080` | URL of the running Go API backend |
| `VITE_UPI_QR_URL` | Empty | Merchant QR image URL or frontend asset path. Set this to show UPI at checkout. |

### Order confirmation emails

For the local debugger, set `ORDER_SMTP_HOST`, `ORDER_SMTP_PORT`, `ORDER_SMTP_SECURITY`, `ORDER_SMTP_USER`, `ORDER_SMTP_PASSWORD`, and `ORDER_EMAIL_FROM` in `env/backend.local.env`, then restart. Set the same variables in the hosting provider’s secret manager for deployments. Port defaults to 587 for STARTTLS or 465 for implicit TLS. Use `plain` only for a loopback test relay. Local admin notifications default to `LOCAL_ADMIN_EMAIL`. Set `ORDER_EMAIL_ADMIN` to override this or supply the production fulfillment inbox.

The local checkout queues separate messages for the checkout email and admin even before SMTP is configured. After enabling SMTP and restarting, the queue retries pending messages. Orders created by older builds with mail disabled have no notification jobs.

### Password reset email

Open **Login → Forgot password?** and enter the email used for a password account. The email uses the same backend SMTP settings documented above. Reset links are valid for 30 minutes, and each link can be used once. If a customer uses Google exclusively, they can continue to sign in with Google.

For deployments, set `PASSWORD_RESET_WEB_ORIGIN` to the public HTTPS storefront origin (for example, `https://shop.example.com`). The backend uses `GOOGLE_WEB_ORIGIN` if the reset origin is unset, or `http://localhost:7000` for the local debugger. When testing from Android, the link opens in the phone's browser and needs a storefront URL the phone can reach.

### Order cancellation and contact

New orders start as **Pending**. Customers and admins can cancel from **Orders** while the order is pending. When an order is cancelled or marked **Delivered**, the backend queues a status email for the customer and admin. Cancellation leaves the payment record intact. To send these emails, use the SMTP settings above.

The storefront footer shows the support contact. Set `STORE_CONTACT_EMAIL` and `STORE_CONTACT_PHONES` in the backend environment to override it. Use a comma-separated list of phone numbers, ideally including country codes, for example `+918826225551,+919910345551`.

### Invoices

New orders get an invoice number in `YYYYMMDDNNNNNN` format. It uses the date in India and a six-digit serial starting at `000001` each day. The customer confirmation email attaches the same compressed PDF available from **Orders**. Keep MongoDB’s `issuedInvoices` collection in backups. It holds invoice numbers, metadata, and one archived PDF per issued invoice. Previously numbered invoices preserve their number and issue date, and receive a stored copy when first downloaded or exported.

In **Admin → Order History**, select the invoice month, choose the invoices or **Select all**, and download a ZIP. The tab opens to the current month in India. The invoice list and export use separate admin-only routes.

Optional backend settings include `INVOICE_SELLER_NAME`, `INVOICE_SELLER_ADDRESS`, and `INVOICE_BANK_DETAILS` (one line per bank detail). Checkout currently has no GST breakdown, so the PDF uses the **Invoice** title and leaves the tax fields blank.

**Buy again** adds available items to the existing cart at current prices. It reports any item, sweetener, or custom box that can no longer be supplied.

In **Admin → Products**, use **Food details** to enter ingredients, allergen information, shelf life, and storage instructions. Shared fields apply to every sweetener. Use the option selector to override a field for a specific sweetener. Blank fields do not display any claim.

### Local administrator

For local testing, the email set in `LOCAL_ADMIN_EMAIL` can sign up normally and receives admin access through the configured-email check. Use the password you choose during signup for future sign-ins. Changing the configured email changes which account receives this access. MongoDB accounts with a stored admin role can also manage the store. To grant that role to a different account, first sign up with the separate email, then run this in the configured MongoDB database.

```javascript
db.users.updateOne({ email: "operator@example.test" }, { $set: { role: "admin" } })
```

Reload the storefront and open `/admin`. Existing administrators who previously relied on an email match also need the stored `admin` role.

### Sign in with Google

1. Configure the consent screen in [Google Cloud](https://console.cloud.google.com/auth/overview) and create an OAuth client of type **Web application** for Laddu Zabardast. If the project is in testing mode and Google requires test users, add the account you will use.
2. Register `http://localhost:8080/auth/google/callback` as an **authorized redirect URI** for local testing.
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the ignored `laddu-zabardast-be/env/backend.local.env` file. Select **Launch Backend** in the root VS Code workspace.
4. Open the web app at `http://localhost:7000`. For the debug APK, keep USB connected with `adb reverse tcp:8080 tcp:8080`. Android and iOS open a system-managed Google sign-in sheet. Recent browsers return directly to the app. Older Android browsers may show an **Open Laddu Zabardast** button. For iPhone build and network setup, see the [mobile README](laddu-zabardast-mobile/README.md).

Use **Sign up with Google** or **Sign in with Google** for a new Google account. If your email already has a password account, sign in with the password and choose **Profile → Security → Connect Google**. You can then use either method on the same account. Google buttons appear once the backend is configured.

On the hosted backend, set these four values as environment variables. Use an HTTPS callback and register it with Google, and add the storefront origin to the backend's CORS `routes`. Host the storefront and API on the same site so browsers can retain the login cookie. Rebuild the mobile apps with the public HTTPS API URL. If the backend reports that the email uniqueness index cannot be created, check for existing accounts with duplicate emails before enabling Google.

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
(set -a; source env/backend.local.env; go run ./src/server)  # Local MongoDB
(set -a; source env/backend.dev.env; go run ./src/server)    # Atlas
go build -o bin/server src/server/main.go  # Compiles binary into bin/server
go test ./...                           # Runs test suites
```

---

## 🔍 Troubleshooting & Common Issues

### 1. `error parsing uri: lookup ...: no such host`
- **Cause**: The MongoDB Atlas hostname in `env/backend.dev.env` does not resolve or has expired.
- **Fix**: Run with local MongoDB (default) or update `MONGODB_URI` in `env/backend.dev.env` with an active Atlas cluster URI.

### 2. `failed to connect to `127.0.0.1:27077`: connection refused`
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
- **Fix**: Set `CORS_ORIGINS=http://localhost:7000` in `laddu-zabardast-be/env/backend.local.env`.

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
