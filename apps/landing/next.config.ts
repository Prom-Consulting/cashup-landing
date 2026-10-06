import path from "node:path";
import type { NextConfig } from "next";
import { CLIENT_APP_URL } from "./app/_data/site";

const nextConfig: NextConfig = {
  // REF-01: сервер раздаёт ссылки loal.kg/ref/{code}, а переход и регистрация живут в кабинете клиента —
  // там один и тот же deviceId для visit и register. Временный редирект: ссылки не кэшируются навсегда.
  redirects() {
    return [{ source: "/ref/:code", destination: `${CLIENT_APP_URL.replace(/\/$/, "")}/ref/:code`, permanent: false }];
  },
  // Сборка для Docker: .next/standalone со своим сервером. Трассировку файлов ведём
  // от корня монорепо, иначе не попадут зависимости из packages/ и общий node_modules.
  output: "standalone",
  // Без заголовка X-Powered-By: он ничего не даёт посетителю и снижает оценку в SEO-аудитах
  poweredByHeader: false,
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
