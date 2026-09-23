import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Сборка для Docker: .next/standalone со своим сервером. Трассировку файлов ведём
  // от корня монорепо, иначе не попадут зависимости из packages/ и общий node_modules.
  output: "standalone",
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  // Общий бренд и UI-кит лежат исходниками в packages/ui — Next их компилирует сам.
  transpilePackages: ["@loal/ui", "@loal/api"],
  // Lets phones on the local network open the dev server by IP (otherwise JS is blocked and animations never start).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  images: {
    // 90 keeps the hero and partner photos crisp; 75 stays the default.
    qualities: [75, 90],
  },
};

export default nextConfig;
