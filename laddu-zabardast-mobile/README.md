# Laddu Zabardast mobile apps

Android and iOS package the same React storefront from `../laddu-zabardast-fe`. Both use the existing Go API, MongoDB, and email worker. The native projects are in `android/` and `ios/`.

## Build a local APK

Use Node.js 22 or later. Run from `laddu-zabardast-fe`.

```sh
npm ci --no-audit --no-fund
npm run mobile:android
```

The build creates `laddu-zabardast-mobile/output/laddu-zabardast-debug.apk`. It includes the frontend assets and uses `http://localhost:8080` as the test API. Each build writes its backend address to `output/build-info.json`.

The JDK and SDK installed during development are in `.tools/`, which is ignored by Git. On another Mac, install JDK 21 and Android SDK platform 36, build tools 35.0.0, and platform tools. Set `JAVA_HOME` and `ANDROID_HOME` if these live outside this folder. Android SDK licenses must be accepted by the developer.

## Open the emulator on this Mac

From `laddu-zabardast-mobile`, run:

```sh
ANDROID_USER_HOME="$PWD/.android" ANDROID_AVD_HOME="$PWD/.android/avd" \
  .tools/android-sdk/emulator/emulator -avd Laddu_Test_API_36 -no-snapshot-load
```

This opens the Android 16 test device created during setup. Start the Go API on port 8080, then run `npm run mobile:install` from the frontend folder. A running copy of the same emulator must be stopped before opening another instance.

## Run on your Android phone

1. Enable Developer options and USB debugging on the phone.
2. Connect the phone to the Mac by USB and approve its debugging prompt.
3. Start the Go API in the existing debugger on port 8080.
4. From the frontend folder, run `npm run mobile:install`.

The install command forwards ports 8080 (API) and 7000 (web storefront) from the phone to the Mac and launches the app. Keep USB and the API running for this local build. To open a password reset link in the phone's browser, also run the storefront with `npm run dev` from the frontend folder. If multiple devices are connected, select one with `ANDROID_SERIAL=<device-id>`.

Installing the APK from a file also works, but the local backend still needs forwarding. Approve Android's install prompt for the source you use.

## Build against a hosted API

```sh
MOBILE_BACKEND_URL=https://api.example.com npm run mobile:android
```

A hosted build can connect without USB forwarding. The backend URL is compiled into the assets. Native API requests use Capacitor's HTTP transport. Uploaded images use the same API base URL.

## Build for iPhone Simulator

Install full Xcode 26 or later and an iOS simulator runtime. The iOS project uses Swift Package Manager and targets iOS 15 and later. From `laddu-zabardast-fe`, run:

```sh
npm ci --no-audit --no-fund
npm run mobile:ios
```

The script syncs the current web assets and builds `output/ios-simulator/Build/Products/Debug-iphonesimulator/App.app`. To launch it in Xcode, open `ios/App/App.xcodeproj` from the mobile folder and select an iPhone simulator. Run `npm run mobile:ios -- --sync-only` to update the iOS project without Xcode.

The simulator defaults to `http://localhost:8080`. For a physical iPhone, set `MOBILE_BACKEND_URL` to an HTTPS API reachable by the phone and select your signing team in Xcode. The debug app stores session tokens in iOS Keychain. Google authentication opens in a system sign-in sheet and returns through the registered app URL scheme. Android browsers without Auth Tab support use a Custom Tab with a return link. Restart the Go backend after upgrading so it accepts the iOS sign-in flow.

## Android release preparation

```sh
MOBILE_BACKEND_URL=https://api.example.com npm run mobile:android -- --release
```

This produces an **unsigned** Android App Bundle in `output/`. A public HTTPS API, live SMTP settings, an upload signing key, and a Google Play developer account are needed for distribution. Account creation, store submission, and signing-key setup require the owner's approval.

The app ID is `com.ladduzabardast.app`. Version 1 uses `versionCode 1` and `versionName 1.0` in `android/app/build.gradle`. Increase the version code for each store update.

## iOS release preparation

Sync using the production HTTPS API before archiving:

```sh
MOBILE_BACKEND_URL=https://api.example.com npm run mobile:ios -- --release --sync-only
```

Use the `App` scheme in Xcode, select the owner’s Apple Developer team for `com.ladduzabardast.app`, and archive for TestFlight or App Store Connect. The iOS build has its own signing and build number. Validate sign-in, COD checkout, photo uploads, and PDF and ZIP sharing on an iPhone before submission. Review the App Store primary-login and in-app account-deletion requirements before publishing the build with Google sign-in enabled.

## Store release checklist

Complete this after local testing. Keep the Android and iOS release builds on the same tested app version.

### Both platforms

- [ ] Deploy the storefront and Go API over public HTTPS. Configure production MongoDB, secrets, admin access, Google OAuth callbacks, password reset links, and SMTP.
- [ ] Test the release builds on physical Android and iPhone devices. Cover signup and login, password reset, COD checkout, customer and admin cancellation, order emails, photo uploads, and invoice PDF and ZIP downloads.
- [ ] Add account deletion in the app and a public account-deletion page for Google Play. Prepare the public privacy policy, support details, screenshots, and a reviewer test account. [Google Play account deletion](https://support.google.com/googleplay/android-developer/answer/13327111) · [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

### Android · Google Play

- [ ] Set up the owner’s Play Console account and upload key. Verify the current target API requirement and build a signed `.aab` against the production API.
- [ ] Complete the store listing and Data safety form. Run internal testing and any required closed testing before requesting production access. [Play Console testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465)

### iOS · Apple App Store

- [ ] Install full Xcode and the iPhone simulator runtime. Compile the iOS target, test on the simulator, and verify a signed build on an iPhone.
- [ ] Set up the owner’s Apple Developer team and App Store Connect. Resolve Apple’s equivalent-login requirement for Google sign-in, such as by adding Sign in with Apple. [Apple login services guideline](https://developer.apple.com/app-store/review/guidelines/#login-services)
- [ ] Archive the production build, complete App Privacy and the store listing, run TestFlight, and submit the approved build for App Review.

## Mobile behavior

- The login token is encrypted using Android Keystore and scoped to the selected API. Passwords are never stored.
- Android Back closes overlays first, follows in-app history, and minimizes the app from its landing or account pages.
- Invoice actions save a PDF to the app cache and open Android's share/save sheet.
- The native window resizes for the keyboard. Capacitor handles system-bar safe areas.
- The launcher and splash use the existing logo and orange palette.
- The debug variant supports local HTTP. Release builds require HTTPS and keep cleartext traffic disabled.
- Android backup is disabled to keep session data out of cloud backups.

The launcher source is `assets/logo.png`. The generated Android resources are committed with the project.

## Verified flows and screenshots

See [TESTING.md](TESTING.md) for the emulator and web acceptance results. The validation captures are in `output/screenshots/`, with a standalone gallery at `output/mobile-screenshots.html`.

The storefront now uses compact cards with two columns on phones, a navbar search action, and sidebar theme preferences. The original account-page styling and orange branding remain in place.
