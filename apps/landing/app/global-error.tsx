"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";
import { reloadOnStaleBuild } from "../stale-build";

/** Ошибка в корневом макете или при рендере: отправляем в Sentry и показываем стандартную страницу. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
    // Страница со старой выкатки — вместо экрана ошибки грузим свежую
    reloadOnStaleBuild(error.message);
  }, [error]);

  return (
    <html lang="ru">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
