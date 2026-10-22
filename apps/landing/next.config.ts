import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";
import { CLIENT_APP_URL } from "./app/_data/site";

const nextConfig: NextConfig = {
  // REF-01: сервер раздаёт ссылки loal.kg/ref/{code}, а переход и регистрация живут в кабинете клиента —
  // там один и тот же deviceId для visit и register. Временный редирект: ссылки не кэшируются навсегда.
  // loal.kg/promo — короткая ссылка для печати и соцсетей: регистрация в кабинете клиента с промокодом.
  redirects() {
    const client = CLIENT_APP_URL.replace(/\/$/, "");
    return [
      { source: "/ref/:code", destination: `${client}/ref/:code`, permanent: false },
      { source: "/promo", destination: `${client}/register?promo=MIR-VOSTOKA`, permanent: false },
    ];
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

export default withSentryConfig(nextConfig, {
  org: "adilhan",
  project: "loal",
  // Исходники для читаемых стек-трейсов грузятся только при сборке с токеном (SENTRY_AUTH_TOKEN)
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  widenClientFileUpload: true,
  // События идут через loal.kg/monitoring — блокировщики рекламы их не режут
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
});
