# FinTrack — Build Native Apps (Android APK & iOS IPA)

This guide walks you through turning FinTrack into a **real downloadable app** for Android and iPhone using [Capacitor](https://capacitorjs.com).

## How It Works

FinTrack uses a **dual-mode architecture**:

- **Web mode** (browser): Uses the Next.js server + Prisma/SQLite backend. Data is stored server-side.
- **Native mode** (Android/iOS app): Uses **on-device localStorage** for all data. No server needed — the app works fully offline.

The app automatically detects which mode it's in via Capacitor's `isNativePlatform()` check and routes API calls to the local data layer when running as a native app. Your financial data stays private on your device.

---

## Prerequisites

### For Android
- [Android Studio](https://developer.android.com/studio) (latest)
- Java JDK 17+ (bundled with Android Studio)
- Android SDK (installed via Android Studio)

### For iOS
- A **Mac** (required — Xcode only runs on macOS)
- [Xcode](https://developer.apple.com/xcode/) 15+ from the Mac App Store
- An Apple Developer account ($99/year) to distribute on the App Store
  (free account works for testing on your own device)

### For both
- [Node.js](https://nodejs.org/) 18+ and npm/bun
- This project cloned to your machine

---

## Step 1: Install Dependencies

```bash
cd fintrack
npm install
```

This installs Capacitor core, the Android/iOS platform packages, and all app dependencies.

---

## Step 2: Build the Web App for Mobile

```bash
npm run mobile:build
```

This runs `BUILD_TARGET=mobile next build`, which produces a **static export** in the `out/` directory. This is the bundle that gets packaged into the native app.

> The static export excludes server-side API routes — that's fine because the native app uses the local (on-device) data layer instead.

---

## Step 3: Add Native Platforms

You only need to do this once per platform:

### Android
```bash
npm run mobile:add:android
```
This creates an `android/` folder with a full Android Studio project.

### iOS
```bash
npm run mobile:add:ios
```
This creates an `ios/` folder with a full Xcode project.

---

## Step 4: Sync the Web Build to Native Projects

Every time you change the web code and rebuild, sync the updated files to the native projects:

```bash
npm run mobile:sync
```

This runs the build + `npx cap sync` (copies `out/` into both `android/` and `ios/` and updates native plugins).

---

## Step 5: Build the App

### Android (APK)

**Option A — One command (opens Android Studio):**
```bash
npm run mobile:android
```

**Option B — Manual in Android Studio:**
1. Open Android Studio
2. Open the `android/` folder
3. Wait for Gradle sync to finish
4. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
5. When done, click "locate" to find your `app-release.apk` or `app-debug.apk`

The APK file will be at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```
(or `release/` for release builds)

**To install on your phone:**
- Transfer the `.apk` to your Android phone
- Open it (enable "Install from unknown sources" if prompted)
- FinTrack installs like any app

### iOS (IPA)

**Requires a Mac with Xcode:**

```bash
npm run mobile:ios
```

This opens Xcode. Then:
1. In Xcode, select your team (sign in with your Apple ID)
2. Change the **Bundle Identifier** to something unique (e.g. `com.yourname.fintrack`)
3. Connect your iPhone via cable (or select a simulator)
4. Press **Cmd+R** to build and run on your device
5. For a distributable build: **Product → Archive**, then distribute via App Store Connect or TestFlight

---

## Quick Reference — All Commands

| Command | What it does |
|---|---|
| `npm run dev` | Run the web app in dev mode (browser, with server backend) |
| `npm run mobile:build` | Build the static export for mobile (`out/` folder) |
| `npm run mobile:sync` | Build + sync to native projects |
| `npm run mobile:add:android` | Add the Android platform (one-time) |
| `npm run mobile:add:ios` | Add the iOS platform (one-time) |
| `npm run mobile:android` | Sync + open in Android Studio |
| `npm run mobile:ios` | Sync + open in Xcode |
| `npm run mobile:run:android` | Sync + run on a connected Android device/emulator |

---

## App Configuration

The app's native config is in `capacitor.config.ts`:

```ts
{
  appId: "com.fintrack.app",    // Change this to your unique app ID
  appName: "FinTrack",           // Shown under the app icon
  webDir: "out",                 // Static export output
}
```

**To customize:**
- Change `appId` to something unique (e.g. `com.yourname.fintrack`)
- Change `appName` to your preferred display name
- App icons are in `public/` (icon-192x192.png, icon-512x512.png, apple-touch-icon.png) — replace them with your own and re-sync

---

## Publishing to App Stores

### Google Play Store (Android)
1. Build a **release APK** or **Android App Bundle (.aab)** in Android Studio
2. Create a [Google Play Developer account](https://play.google.com/console) ($25 one-time fee)
3. Create a new application in the Play Console
4. Upload your `.aab` file
5. Fill in the store listing, screenshots, and description
6. Submit for review (usually approved in 1-3 days)

### Apple App Store (iOS)
1. Archive your app in Xcode (**Product → Archive**)
2. Distribute to App Store Connect
3. In [App Store Connect](https://appstoreconnect.apple.com), create your app listing
4. Add screenshots, description, and pricing
5. Submit for review (usually 1-2 days)

---

## Data & Privacy

- **Native app**: All data is stored locally on the device (localStorage). No data leaves the phone. Uninstalling the app deletes all data.
- **Web app**: Data is stored in the server's SQLite database.

If you later want to add cloud sync, you can deploy the Next.js backend to a host (Vercel, Railway, etc.) and have the native app optionally connect to it.

---

## Troubleshooting

**"cap: command not found"**
Run `npx cap` instead of `cap`, or install Capacitor CLI globally: `npm i -g @capacitor/cli`.

**Android build fails on Gradle sync**
Open Android Studio's SDK Manager and install the latest Android SDK Platform + Build Tools.

**iOS build fails on signing**
In Xcode → Signing & Capabilities, select your team. If using a free account, change the Bundle Identifier to something unique.

**White screen in the native app**
Make sure you ran `npm run mobile:sync` (which builds + copies the latest web code). Check that `out/index.html` exists.

**Changes not showing in the app**
Always rebuild + resync: `npm run mobile:sync`, then rebuild the native app.
