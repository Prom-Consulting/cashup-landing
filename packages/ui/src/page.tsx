"use client";

import type { ReactNode } from "react";

/** Шапка экрана: заголовок, пояснение и место под кнопку действия. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 py-2">
      <div>
        <h1 className="display text-[clamp(1.75rem,3vw,2.5rem)]">{title}</h1>
        {description && <p className="mt-2 max-w-[70ch] text-lg text-slate">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-[24px] bg-paper p-6 ${className}`}>{children}</div>;
}

/** Состояние загрузки: не прыгаем версткой, держим высоту блока. */
export function Loading({ label = "Загружаем…" }: { label?: string }) {
  return (
    <div role="status" className="grid min-h-[180px] place-items-center text-lg text-slate">
      {label}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="grid min-h-[180px] place-items-center text-center">
      <div>
        <p className="text-xl font-medium">{title}</p>
        {description && <p className="mt-2 text-lg text-slate">{description}</p>}
      </div>
    </div>
  );
}

/** Ошибка запроса. Текст приходит из ApiError — он на русском от бэкенда. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : "Что-то пошло не так";
  return (
    <div role="alert" className="rounded-[20px] bg-paper p-6">
      <p className="text-lg font-medium text-flame-ink">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-3 text-base underline underline-offset-4">
          Повторить
        </button>
      )}
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn"; children: ReactNode }) {
  const styles = {
    neutral: "bg-cream text-graphite",
    good: "bg-graphite text-paper",
    warn: "bg-flame text-white",
  }[tone];
  return <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${styles}`}>{children}</span>;
}
