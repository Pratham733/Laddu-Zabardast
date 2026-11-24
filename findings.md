# Findings

## UX refinement, 19 November 2026

- The admin page combines product creation, all orders, banner management and catalog editing in an 1,866-line screen, without operational search or section navigation. Mutation buttons lack consistent pending states, and errors can resemble empty lists.
- Shop ignores category links in the URL; cart can briefly display an empty state before its API load finishes; order failures provide no retry; authentication discards the requested destination.
- Reuse existing product/order/banner endpoints. Preserve custom-box contents, notes, invoice sharing, image upload, availability, banner ordering and role checks. UI work uses isolated test data; do not alter the owner's debugger or real orders.
- The UI skill's automated palette/landing recommendation does not fit the established store; keep the existing orange brand and apply its accessibility, touch-target and loading-state guidance.

- React/Vite storefront and Go REST API backed by MongoDB.
- Local MongoDB is available. Use an isolated test database for writes.
- The worktree already contained a deleted generated Go debug binary.
- TypeScript route imports point at a missing packets barrel. ESLint points at a removed Next.js configuration.
- Checkout and admin require an in-memory token even after a valid cookie session is restored. Checkout stores a user ID in the order's email field.
- MongoDB collection selection ignores the configured database. Address deletion queries the JSON field instead of the BSON field.
- Store mutations and order reads need server-side authorization, and checkout totals need to come from the catalog.
- Local configuration retains the historical database name. Administration requires the stored role. UPI is shown only when a merchant QR image is configured and starts with pending payment.
- The original storefront offered unavailable products and claimed to send confirmation email. Product actions now respect availability and confirmation reflects the order response.
# Curated storefront and laddu sweeteners

- Home currently picks featured products by array position. Replace with explicit product flags and persist home shortcuts in one settings document.
- The quantity screenshot is the cart. Put the selector there and in checkout. Use the existing laddu price for default jaggery and allow independently priced optional variants.
- Buy Now must retain the existing cart. Keep custom-box pricing on base jaggery prices.
