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
  as = "h1",
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** h2 — раздел внутри страницы с общим заголовком (вкладки), он мельче. */
  as?: "h1" | "h2";
}) {
  const Heading = as;
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <Heading className={as === "h1" ? "display text-[clamp(1.75rem,3vw,2.5rem)]" : "text-2xl font-bold"}>{title}</Heading>
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

/**
 * Скелетон всего кабинета, пока узнаём, кто вошёл: та же раскладка, что у AppShell
 * (меню слева на десктопе, узкая шапка на телефоне), чтобы экран не прыгал после загрузки.
 */
export function CabinetSkeleton({ label = "Загружаем кабинет…" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="min-h-dvh bg-cream lg:grid lg:grid-cols-[272px_1fr]">
      <div className="hidden flex-col gap-6 bg-graphite px-5 py-6 lg:flex lg:h-dvh">
        <Skeleton className="h-9 w-32 bg-white/10" />
        <div className="mt-6 flex flex-col gap-3">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-11 w-full bg-white/10" />
          ))}
        </div>
      </div>
      <div className="flex h-16 items-center justify-between bg-graphite px-5 lg:hidden">
        <Skeleton className="h-8 w-28 bg-white/10" />
        <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
      </div>
      <div className="flex flex-col gap-6 px-5 pt-6 lg:px-10 lg:pt-12">
        <Skeleton className="h-11 w-[min(420px,80%)]" />
        <Skeleton className="h-6 w-[min(560px,90%)]" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}
