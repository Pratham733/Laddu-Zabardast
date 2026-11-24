# Android acceptance results

Verified locally on 18 November 2026 with the Android 16 / API 36 ARM64 emulator. The APK packages the existing storefront and calls the real Go API. Writes used isolated MongoDB databases and synthetic accounts/products. No external customer emails were sent.

| Area | Result |
| --- | --- |
| Account | Signup, existing-account login, profile name/phone save, encrypted session after process restart, and logout passed. |
| Connection recovery | Disconnected startup showed a retry screen; reconnect restored the account without losing the encrypted session. |
| Products | Details, wishlist and Add to Cart passed in the Android app. |
| Custom boxes | Search and capacity limits passed for 9 laddus and a mixed box of 16 (8 Besan + 8 Coconut). Both completed COD checkout. |
| Checkout | Saved address, adding another address, switching addresses, optional instructions, Buy Now retaining the existing cart, and ordinary cart checkout passed. |
| Orders | Confirmation, order history, persisted instructions and cart clearing passed. |
| Invoice | Generated PDF signature/content, app-cache file, Android share sheet and cancellation without an error passed. |
| Email | Customer and admin confirmations reached a loopback SMTP capture server. Its temporary admin failure also exercised retry. |
| Mobile UI | Navbar search returned the matching product; sidebar Light/Dark/System controls, Shop navigation, compact-card wishlist and Add actions passed. |
| Layout | Actual browser widths 320, 390, 430 and 1440 had no horizontal page overflow. Phone widths showed two cards across. The final Android viewport was 412 CSS pixels; home cards measured approximately 171 × 255 CSS pixels. The single-line name-to-price spacing was 8 CSS pixels, and wishlist tap targets remained 44 × 44 CSS pixels. |
| Web regression | Profile, multiple addresses, default/edit actions, product details, wishlist, cart, Buy Now, COD, saved checkout addresses and retained notes/cart passed in Chrome. |
| Build checks | TypeScript, ESLint, APK compilation, APK signature verification and diff whitespace checks passed. |

The latest captures are in `output/screenshots/`; `output/mobile-screenshots.html` is a standalone gallery. Product images in these captures are fixture placeholders. Checkout and product captures include the full scrollable page.

## Local operation

The debug APK targets `http://localhost:8080`. During emulator verification, ADB forwarded that port to an isolated API on the Mac's port 18081. The existing web debugger was not replaced. See [README.md](README.md) for forwarding to your normal backend and installing on a USB-connected phone.

## Not yet verified or configured

- Physical Android hardware and older supported Android versions.
- Live SMTP delivery to real customer/admin inboxes.
- A public HTTPS backend, release signing and Google Play distribution.
- Performance on low-memory phones. Vite still reports the existing large JavaScript bundle warning.

The delivered APK is a local debug build. Production account setup, signing-key setup and store submission require owner approval.
