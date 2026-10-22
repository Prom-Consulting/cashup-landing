import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "./sentry.options";

// Сервер Next (Node): ошибки рендера, API-маршрутов и ISR
Sentry.init(sentryOptions);
