"use client";

import type { ReactNode } from "react";
import { Logo } from "./logo";

export type NavItem = { to: string; label: string };

/**
 * Каркас кабинета: слева разделы, сверху — кто вошёл. Один на все кабинеты,
 * поэтому навигация и ссылки приходят снаружи: пакет не знает про react-router.
 */
export function AppShell({
  title,
  nav,
  renderLink,
  userLabel,
  onLogout,
  children,
  direction,
}: {
  title: string;
  /** corporate — кабинет бизнеса: тёмная панель и фирменный блок Loal Corporate из брендбука. */
  direction?: "corporate";
  nav: NavItem[];
  /** Ссылку рисует приложение — у него свой роутер. */
  renderLink: (item: NavItem) => ReactNode;
  userLabel?: string;
  onLogout: () => void;
  children: ReactNode;
}) {
  const corporate = direction === "corporate";
  return (
    <div
      className="min-h-dvh bg-cream lg:grid lg:grid-cols-[272px_1fr]"
      data-shell={corporate ? "corporate" : undefined}
    >
      <aside
        className={`flex flex-col gap-8 px-5 py-6 lg:sticky lg:top-0 lg:h-dvh ${
          corporate ? "bg-graphite text-white" : "border-b border-smoke bg-paper lg:border-r lg:border-b-0"
        }`}
      >
        <div>
          <Logo direction={direction} tone={corporate ? "light" : "dark"} />
          <p className={`mt-3 text-base ${corporate ? "text-slate-soft" : "text-slate"}`}>{title}</p>
        </div>
        <nav className="flex flex-wrap gap-1 lg:flex-col">{nav.map((item) => renderLink(item))}</nav>
        <div className="mt-auto hidden lg:block">
          {userLabel && (
            <p className={`truncate text-base ${corporate ? "text-slate-soft" : "text-slate"}`}>{userLabel}</p>
          )}
          <button
            type="button"
            onClick={onLogout}
            className={`mt-2 text-base font-semibold underline-offset-4 hover:underline ${corporate ? "text-amber" : "text-flame-ink"}`}
          >
            Выйти
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between gap-4 px-5 py-4 lg:px-10 lg:py-6">
          <span className="truncate text-base text-slate lg:hidden">{userLabel}</span>
          <button
            type="button"
            onClick={onLogout}
            className="ml-auto text-base font-medium text-flame-ink underline-offset-4 hover:underline lg:hidden"
          >
            Выйти
          </button>
        </header>
        <main className="min-w-0 flex-1 px-5 pb-16 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

/**
 * Ссылка раздела: стиль общий, сам элемент даёт приложение (Link из роутера).
 * Цвет наследуется от панели, поэтому одна и та же ссылка читается и на светлой,
 * и на тёмной панели Loal Corporate.
 */
export const navLinkClass = (active: boolean) =>
  `block rounded-2xl px-4 py-3 text-lg font-semibold transition-colors ${
    active ? "brand-gradient text-white shadow-[0_0.5rem_1.25rem_rgb(255_93_52/0.3)]" : "hover:bg-current/8"
  }`;
