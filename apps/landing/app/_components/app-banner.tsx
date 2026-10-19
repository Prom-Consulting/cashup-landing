"use client";

import { useSyncExternalStore } from "react";
import { APP_STORE_URL } from "../_data/site";

const HIDDEN_KEY = "loal.app-banner.hidden";
const listeners = new Set<() => void>();

function isHidden() {
  try {
    return sessionStorage.getItem(HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Полоса над шапкой на всю ширину: приложение Loal в App Store. Живёт в корневом макете — не
 * пересоздаётся при переходах. Текст в HTML (видно без JS); закрыли — не показываем до конца
 * визита (sessionStorage), в новый заход полоса снова на месте. Маленький скрипт прячет закрытую
 * полосу ещё до отрисовки, чтобы она не мелькала при переходах с перезагрузкой.
 */
export function AppBanner() {
  const hidden = useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    isHidden,
    () => false,
  );
  if (hidden) return null;

  const hide = () => {
    try {
      sessionStorage.setItem(HIDDEN_KEY, "1");
    } catch {
      // Не запомнили — скроем хотя бы до перезагрузки страницы
    }
    listeners.forEach((notify) => notify());
  };

  return (
    <div id="app-banner" suppressHydrationWarning className="relative z-50 shrink-0 bg-graphite text-paper">
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(sessionStorage.getItem("${HIDDEN_KEY}")==="1")document.getElementById("app-banner").hidden=true}catch(e){}`,
        }}
      />
      <div className="mx-auto flex w-full max-w-[1512px] items-center gap-3 px-5 py-2.5 sm:px-12">
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener"
          className="flex min-w-0 flex-1 items-center justify-center gap-3 text-sm font-semibold sm:text-base"
        >
          <span className="truncate">
            <span className="sm:hidden">Loal теперь в App Store</span>
            <span className="hidden sm:inline">Loal теперь в App Store — карта, бонусы и партнёры в одном приложении</span>
          </span>
          <span className="shrink-0 rounded-full bg-flame px-3 py-1 text-sm font-bold text-white">Скачать</span>
        </a>
        <button
          type="button"
          onClick={hide}
          aria-label="Скрыть"
          className="grid size-8 shrink-0 place-items-center rounded-full text-paper/70 transition-colors hover:bg-paper/10 hover:text-paper"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
