import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets phones on the local network open the dev server by IP (otherwise JS is blocked and animations never start).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  images: {
    // 90 keeps the hero and partner photos crisp; 75 stays the default.
    qualities: [75, 90],
  },
};

export default nextConfig;
