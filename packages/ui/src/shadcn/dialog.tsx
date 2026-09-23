"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import type { ComponentProps, ReactNode } from "react";
import { Icon } from "./icon";
import { cn } from "./lib";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

/**
 * Модальное окно. Radix сам держит фокус внутри, закрывает по Esc и возвращает
 * фокус на кнопку, которая его открыла.
 */
export function DialogContent({
  title,
  description,
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { title: string; description?: ReactNode }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-[min(560px,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card bg-surface p-6 shadow-[0_2rem_4rem_rgb(9_8_9/0.25)]",
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4">
          <DialogPrimitive.Title className="display text-[1.75rem]">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Close
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Закрыть"
          >
            <Icon icon={Cancel01Icon} />
          </DialogPrimitive.Close>
        </div>
        {description && (
          <DialogPrimitive.Description className="mt-2 text-base text-muted-foreground">
            {description}
          </DialogPrimitive.Description>
        )}
        <div className="mt-6">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
