# Restore local end-to-end operation

- [x] Read the requested context skills and identify application entry points.
- [x] Establish Go and frontend baselines. Trace core HTTP contracts.
- [x] Fix confirmed defects while preserving existing data and callers.
- [x] Verify customer and admin workflows against isolated MongoDB and review the diff.

## Android app

- [x] Package the existing storefront with Capacitor, keeping its orange design.
- [x] Add encrypted sessions, native Back navigation, PDF sharing and build/install scripts.
- [x] Install the approved JDK, Android SDK and emulator inside the ignored mobile tools folder.
- [x] Recheck the web account, product and COD checkout flows against an isolated database.
- [x] Build and install the APK; verify customer flows in the Android emulator.
- [x] Improve mobile card sizing, navbar search and sidebar theme preferences; verify phone/desktop widths.
- [x] Record verified behavior, screenshots, limitations and local installation instructions.

## Storefront and admin UX refinement

- [x] Audit existing screens and API contracts; retain orange branding and account-page styling.
- [x] Replace the long admin page with Overview, Orders, Products and Banners workspaces; add search, filters, clear pending/error states and accessible editors.
- [x] Improve catalog navigation, cart and order recovery states, checkout progress and return-to-page sign-in.
- [ ] Verify desktop/phone customer and admin journeys against isolated data; rebuild Android and export previews.

Design: warm, restrained storefront with an efficient operator workspace. Keep existing typography, orange accents and cream surfaces. Use tabbed work areas, compact data rows, visible status labels, 44px touch targets and limited motion. DFII: 15 (impact 4 + context 5 + feasibility 5 + performance 5 - consistency risk 4).

## Curated storefront and laddu sweeteners

- [x] Persist product placement, home visibility and sweetener pricing in the API.
- [x] Wire admin settings, cart, checkout and order details; fix phone gutters.
- [x] Verify isolated COD checkout and responsive views, then build and test the Android APK in the emulator.

## Google sign-in

- [x] Add Google authorization, account creation and explicit account linking.
- [x] Integrate the web and Android sign-in screens and return flow.
- [x] Verify both flows against an isolated database and document Google Cloud setup.
- [ ] Configure the Google Cloud OAuth client and test with a real Google account after approval.

## Order history actions and food details

- [x] Reprint the original invoice and add eligible order lines to the current cart at current prices.
- [x] Add shared food details and sweetener overrides in the admin editor and product page.
- [x] Verify mixed reorders, retry safety, variant details, and invoice sharing. Rebuild and test the Android APK.
