"use client";

import { useEffect } from "react";

/**
 * Переход по ссылке с якорем (`/become-partner#form`) из другой страницы: Next не всегда
 * докручивает до места — форма и картинки догружаются уже после перехода. Докручиваем сами,
 * когда раскладка устоится.
 */
export function ScrollToHash({ id }: { id: string }) {
  useEffect(() => {
    if (window.location.hash !== `#${id}`) return;
    const go = () => document.getElementById(id)?.scrollIntoView({ block: "start" });
    const timers = [80, 400, 900].map((delay) => window.setTimeout(go, delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [id]);
  return null;
}
