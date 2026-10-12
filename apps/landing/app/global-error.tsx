"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

/** Ошибка в корневом макете или при рендере: отправляем в Sentry и показываем стандартную страницу. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ru">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
