"use client";

import type { ComponentProps } from "react";
import { cn } from "./lib";

/**
 * Таблица в карточке. На телефоне строки становятся карточками: заголовок прячется, а у
 * ячейки появляется подпись из `label` (theme.css, .table-stack). stack={false} — оставить
 * таблицей с прокруткой вбок.
 */
export function Table({ className, stack = true, ...props }: ComponentProps<"table"> & { stack?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-left", stack && "table-stack", className)} {...props} />
    </div>
  );
}

export function TableHead({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={cn("border-b border-border text-base text-muted-foreground", className)} {...props} />;
}

export function TableBody(props: ComponentProps<"tbody">) {
  return <tbody {...props} />;
}

export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("border-b border-border/60 last:border-0", className)} {...props} />;
}

export function TableHeaderCell({ className, ...props }: ComponentProps<"th">) {
  return <th className={cn("px-5 py-4 font-normal", className)} {...props} />;
}

/**
 * label — подпись ячейки на телефоне (обычно текст заголовка колонки); primary — главная
 * ячейка строки (имя, название): на телефоне без подписи и жирным, первой строкой карточки.
 */
export function TableCell({
  className,
  label,
  primary,
  ...props
}: ComponentProps<"td"> & { label?: string; primary?: boolean }) {
  return (
    <td
      data-label={primary ? undefined : label}
      data-primary={primary ? "" : undefined}
      className={cn("px-5 py-4 text-lg", className)}
      {...props}
    />
  );
}
