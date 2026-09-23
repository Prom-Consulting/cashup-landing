"use client";

import type { ComponentProps } from "react";
import { cn } from "./lib";

const base =
  "w-full rounded-2xl border-2 bg-surface px-4 py-3 text-lg text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60";

/**
 * Поле ввода. Кроме обычных свойств принимает `describedBy` и `invalid` — их отдаёт
 * обёртка `Field`, чтобы подсказка и ошибка читались скринридером.
 */
export type InputProps = ComponentProps<"input"> & { describedBy?: string; invalid?: boolean };

export function Input({ className, describedBy, invalid, "aria-invalid": ariaInvalid, ...props }: InputProps) {
  const broken = invalid ?? ariaInvalid === true;
  return (
    <input
      aria-describedby={describedBy}
      aria-invalid={broken || undefined}
      className={cn(base, broken ? "border-destructive" : "border-border", className)}
      {...props}
    />
  );
}

export type TextareaProps = ComponentProps<"textarea"> & { describedBy?: string; invalid?: boolean };

export function Textarea({ className, describedBy, invalid, "aria-invalid": ariaInvalid, ...props }: TextareaProps) {
  const broken = invalid ?? ariaInvalid === true;
  return (
    <textarea
      aria-describedby={describedBy}
      aria-invalid={broken || undefined}
      className={cn(base, "min-h-[120px] resize-y", broken ? "border-destructive" : "border-border", className)}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-base font-medium text-foreground", className)} {...props} />;
}
