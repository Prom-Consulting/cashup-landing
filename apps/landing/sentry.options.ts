/**
 * Общие настройки Sentry для браузера, сервера и edge. DSN публичный (он и так виден в коде
 * страницы) и подставляется при сборке; без него Sentry выключен и сайт работает как раньше.
 */
export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || (process.env.NODE_ENV === "production" ? "production" : "development"),
  // Коммит сборки: ошибки привязываются к выкатке, а не к «unknown release»
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
  // Все трейсы локально, 10% на проде — хватает для картины скорости и не съедает квоту
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
};
