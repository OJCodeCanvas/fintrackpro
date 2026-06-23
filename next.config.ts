import type { NextConfig } from "next";

const isMobileBuild = process.env.BUILD_TARGET === "mobile";

const nextConfig: NextConfig = {
  // For mobile (Capacitor) builds, produce a static export in /out.
  // For regular dev/standalone builds, use the standalone server output.
  output: isMobileBuild ? "export" : "standalone",
  // Static export requires trailing slashes for consistent routing
  trailingSlash: isMobileBuild,
  images: {
    // Disable image optimization for static export
    unoptimized: isMobileBuild,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
