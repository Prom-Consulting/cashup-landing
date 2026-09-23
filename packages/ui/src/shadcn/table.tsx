"use client";

import type { ComponentProps } from "react";
import { cn } from "./lib";

/** Таблица в карточке: на узких экранах прокручивается вбок, а не ломает верстку. */
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-left", className)} {...props} />
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

export function TableCell({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-5 py-4 text-lg", className)} {...props} />;
}
