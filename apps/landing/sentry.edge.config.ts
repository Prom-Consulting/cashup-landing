import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "./sentry.options";

// Edge-рантайм (middleware и edge-маршруты, если появятся)
Sentry.init(sentryOptions);
