"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Переход между документами — это смена параметра одного маршрута `/legal/[doc]`, и
 * Next не докручивает страницу наверх сам (человек остаётся на середине нового текста).
 * Докручиваем сами, плавно — или мгновенно, если человек просил меньше движения.
 */
export function ScrollTopOnNav() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.scrollY === 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [pathname]);
  return null;
}
