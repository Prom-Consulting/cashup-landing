"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "./lib";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-colors outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-primary font-bold text-primary-foreground hover:bg-secondary hover:text-secondary-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground",
        outline: "border-2 border-border bg-surface text-foreground hover:border-foreground",
        ghost: "text-foreground hover:bg-muted",
        danger: "bg-destructive font-bold text-white hover:bg-secondary",
      },
      size: {
        sm: "h-10 px-4 text-base",
        md: "h-12 px-5 text-lg",
        lg: "h-14 px-7 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ComponentProps<"button"> & VariantProps<typeof button> & { asChild?: boolean };

/** Кнопка. `asChild` подставляет стиль ссылке — переход остаётся ссылкой. */
export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(button({ variant, size }), className)} {...props} />;
}

export { button as buttonVariants };
