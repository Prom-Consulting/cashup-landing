"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "./lib";

const badge = cva("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium", {
  variants: {
    tone: {
      neutral: "bg-muted text-foreground",
      good: "bg-secondary text-secondary-foreground",
      warn: "bg-primary text-primary-foreground",
      quiet: "border border-border text-muted-foreground",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({ className, tone, ...props }: ComponentProps<"span"> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}
