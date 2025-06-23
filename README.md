
# Ladoo Zabardast

This is a NextJS starter app for Ladoo Zabardast, an online store for Indian sweets and pickles.

## Features

- Product Showcase (Laddus & Pickles)
- Add to Cart functionality
- Simple Checkout Process
- User Authentication (Login/Signup)
- User Profile Management
- Order History
- Product Search
- Dark/Light Mode Toggle
- Page Transitions & Animations

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Setup**:
    *   Create a `.env.local` file in your project root and add your environment variables:


3.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    The app will be available at [http://localhost:9002](http://localhost:9002).

4.  **Explore the App**:
    *   Start by looking at the home page: `src/app/page.tsx`.
    *   Check out authentication flow in `src/app/login/page.tsx` and `src/app/signup/page.tsx`.
    *   Authentication state is managed in `src/context/auth-context.tsx`.

## Key Technologies

*   Next.js (App Router)
*   React
*   TypeScript
*   Tailwind CSS
*   Shadcn/UI
*   NextAuth.js (Authentication)
*   MongoDB (Database)
*   Framer Motion (for animations)
*   Lucide Icons
*   Zod (for validation)
*   React Hook Form
