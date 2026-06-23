import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.fintrack.app",
  appName: "FinTrack",
  webDir: "out", // Next.js static export output directory
  bundledWebRuntime: false,
  backgroundColor: "#10b981",
  android: {
    backgroundColor: "#10b981",
    allowMixedContent: true,
  },
  ios: {
    backgroundColor: "#10b981",
    contentInset: "always",
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#10b981",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      iosSpinnerStyle: "small",
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
