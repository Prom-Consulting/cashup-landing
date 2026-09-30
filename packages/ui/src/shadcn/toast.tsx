"use client";

import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { useEffect } from "react";
import { Icon } from "./icon";

/**
 * Короткое сообщение снизу экрана о том, что случилось само, без действия человека
 * (например, «Кассир зарегистрировался»). Экранный диктор прочитает его вежливо, не перебивая.
 * Уходит само через `duration`, по тапу — сразу.
 */
export function Toast({
  message,
  onDismiss,
  duration = 6000,
}: {
  message: string | null;
  onDismiss: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)]"
    >
      {message && (
        <button
          type="button"
          onClick={onDismiss}
          className="pointer-events-auto flex max-w-[480px] items-center gap-3 rounded-2xl bg-graphite px-5 py-4 text-left text-base font-semibold text-white shadow-[0_1rem_2.5rem_rgb(22_21_21/0.3)] motion-safe:animate-[toast-in_220ms_ease-out]"
        >
          <Icon icon={CheckmarkCircle02Icon} size={22} className="text-amber" />
          {message}
        </button>
      )}
    </div>
  );
}
