import * as Sentry from "@sentry/nextjs";

/** Next вызывает register один раз при старте сервера — подключаем Sentry нужного рантайма. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config");
}

// Все необработанные ошибки серверных запросов уходят в Sentry
export const onRequestError = Sentry.captureRequestError;
