"use client";

import type { ComponentProps } from "react";
import { cn } from "./lib";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-card bg-surface p-6", className)} {...props} />;
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-wrap items-start justify-between gap-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("text-xl font-bold", className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("max-w-[70ch] text-base text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mt-5", className)} {...props} />;
}
