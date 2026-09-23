"use client";

import { Alert02Icon, InboxIcon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";
import { Button } from "./button";
import { Icon } from "./icon";
import { cn } from "./lib";

/** Шапка экрана: заголовок, пояснение и место под действие справа. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="display text-[clamp(1.75rem,3vw,2.5rem)]">{title}</h1>
        {description && <p className="mt-2 max-w-[70ch] text-lg text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Заглушка на время загрузки: держит высоту, чтобы верстка не прыгала. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-muted", className)} />;
}

export function Loading({ label = "Загружаем…", rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-card bg-surface px-6 py-12 text-center">
      <div className="max-w-[46ch]">
        <Icon icon={InboxIcon} size={32} className="mx-auto text-muted-foreground" />
        <p className="mt-4 text-xl font-medium">{title}</p>
        {description && <p className="mt-2 text-base text-muted-foreground">{description}</p>}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}

/** Ошибка запроса: текст приходит от сервера, он уже на русском. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : "Что-то пошло не так";
  return (
    <div role="alert" className="flex flex-wrap items-center gap-4 rounded-card bg-surface px-6 py-5">
      <Icon icon={Alert02Icon} size={24} className="text-destructive" />
      <p className="text-lg font-medium text-destructive">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="ml-auto">
          Повторить
        </Button>
      )}
    </div>
  );
}
