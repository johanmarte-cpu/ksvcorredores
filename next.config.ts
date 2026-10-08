import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets phones on the local network open the dev server by IP (e.g. http://192.168.1.20:3000).
  // Only affects `next dev`.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
