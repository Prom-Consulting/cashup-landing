import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "./sentry.options";

// Браузер: ошибки и трейсинг переходов между страницами
Sentry.init(sentryOptions);

// Переходы App Router — отдельные спаны навигации
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
