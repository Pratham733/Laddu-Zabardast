# Findings

- React/Vite storefront and Go REST API backed by MongoDB.
- Local MongoDB is available. Use an isolated test database for writes.
- The worktree already contained a deleted generated Go debug binary.
- TypeScript route imports point at a missing packets barrel. ESLint points at a removed Next.js configuration.
- Checkout and admin require an in-memory token even after a valid cookie session is restored. Checkout stores a user ID in the order's email field.
- MongoDB collection selection ignores the configured database. Address deletion queries the JSON field instead of the BSON field.
- Store mutations and order reads need server-side authorization, and checkout totals need to come from the catalog.
- Local configuration retains the historical database name. Administration requires the stored role. UPI is shown only when a merchant QR image is configured and starts with pending payment.
- The original storefront offered unavailable products and claimed to send confirmation email. Product actions now respect availability and confirmation reflects the order response.
