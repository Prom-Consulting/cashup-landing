"use client";

import type { ComponentProps } from "react";
import { cn } from "./lib";

const base =
  "w-full rounded-2xl border-2 bg-surface px-4 py-3 text-lg text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60";

export function Input({ className, "aria-invalid": invalid, ...props }: ComponentProps<"input">) {
  return (
    <input
      aria-invalid={invalid}
      className={cn(base, invalid ? "border-destructive" : "border-border", className)}
      {...props}
    />
  );
}

export function Textarea({ className, "aria-invalid": invalid, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      aria-invalid={invalid}
      className={cn(base, "min-h-[120px] resize-y", invalid ? "border-destructive" : "border-border", className)}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-base font-medium text-foreground", className)} {...props} />;
}
