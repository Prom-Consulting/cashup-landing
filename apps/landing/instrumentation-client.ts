import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "./sentry.options";
import { reloadOnStaleBuild } from "./stale-build";

// Браузер: ошибки и трейсинг переходов между страницами
Sentry.init(sentryOptions);

// Переходы App Router — отдельные спаны навигации
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// Код страницы устарел после выкатки — одна свежая загрузка (stale-build.ts)
window.addEventListener("error", (event) => reloadOnStaleBuild(event.error?.message ?? event.message));
window.addEventListener("unhandledrejection", (event) => reloadOnStaleBuild(event.reason?.message ?? event.reason));
