"use client";

import { Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useState, type MouseEvent, type ReactNode } from "react";
import { Logo } from "./logo";
import { Icon } from "./shadcn/icon";

export type NavItem = { to: string; label: string };

type ShellProps = {
  title: string;
  /** corporate — кабинет бизнеса: тёмная панель и фирменный блок Loal Corporate из брендбука. */
  direction?: "corporate";
  nav: NavItem[];
  /** Ссылку рисует приложение — у него свой роутер. */
  renderLink: (item: NavItem) => ReactNode;
  userLabel?: string;
  onLogout: () => void;
  children: ReactNode;
};

/** Содержимое панели разделов: одно и то же слева на десктопе и в выезжающем меню на телефоне. */
function Panel({
  title,
  direction,
  nav,
  renderLink,
  userLabel,
  onLogout,
  onNavigate,
}: Omit<ShellProps, "children"> & { onNavigate?: () => void }) {
  const corporate = direction === "corporate";
  // Ссылки рисует приложение, поэтому закрываем меню по клику на любую из них
  const closeOnLink = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("a")) onNavigate?.();
  };
  return (
    <>
      <div>
        <Logo direction={direction} tone={corporate ? "light" : "dark"} />
        <p className={`mt-3 text-base ${corporate ? "text-slate-soft" : "text-slate"}`}>{title}</p>
      </div>
      <nav className="flex flex-col gap-1" onClick={closeOnLink}>
        {nav.map((item) => renderLink(item))}
      </nav>
      <div className="mt-auto">
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
    </>
  );
}

/**
 * Каркас кабинета: на десктопе слева разделы, на телефоне — узкая шапка с кнопкой «Меню»,
 * которая выдвигает те же разделы слева. Один на все кабинеты, поэтому навигация и ссылки
 * приходят снаружи: пакет не знает про react-router.
 */
export function AppShell(props: ShellProps) {
  const { title, direction, children } = props;
  const corporate = direction === "corporate";
  const [open, setOpen] = useState(false);
  const panelTone = corporate ? "bg-graphite text-white" : "bg-paper text-graphite";

  return (
    <div
      className="min-h-dvh bg-cream lg:grid lg:grid-cols-[272px_1fr]"
      data-shell={corporate ? "corporate" : undefined}
    >
      <aside
        className={`hidden flex-col gap-8 px-5 py-6 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:overflow-y-auto ${
          corporate ? "bg-graphite text-white" : "border-r border-smoke bg-paper"
        }`}
      >
        <Panel {...props} />
      </aside>

      {/* Телефон: разделов десяток — в шапке только знак и кнопка, сами разделы в выезжающем меню */}
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <header
          className={`sticky top-0 z-30 flex items-center justify-between gap-4 px-5 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-3 lg:hidden ${
            corporate ? "bg-graphite text-white" : "border-b border-smoke bg-paper/95 backdrop-blur"
          }`}
        >
          <Logo size="sm" direction={direction} tone={corporate ? "light" : "dark"} />
          <DialogPrimitive.Trigger
            className={`-mr-2 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-base font-semibold ${
              corporate ? "hover:bg-white/10" : "hover:bg-graphite/5"
            }`}
          >
            <Icon icon={Menu01Icon} size={22} />
            Меню
          </DialogPrimitive.Trigger>
        </header>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-graphite/45 data-[state=open]:animate-[shell-fade_160ms_ease-out] lg:hidden" />
          <DialogPrimitive.Content
            data-shell={corporate ? "corporate" : undefined}
            className={`fixed inset-y-0 left-0 z-50 flex w-[min(320px,86vw)] flex-col gap-8 overflow-y-auto px-5 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] shadow-[0_0_3rem_rgb(22_21_21/0.3)] outline-none data-[state=open]:animate-[shell-slide_200ms_ease-out] motion-reduce:animate-none lg:hidden ${panelTone}`}
          >
            <DialogPrimitive.Title className="sr-only">{title}: разделы</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">Разделы кабинета и выход</DialogPrimitive.Description>
            <DialogPrimitive.Close
              aria-label="Закрыть меню"
              className={`absolute top-[calc(env(safe-area-inset-top,0px)+1rem)] right-3 grid h-11 w-11 place-items-center rounded-full ${
                corporate ? "hover:bg-white/10" : "hover:bg-graphite/5"
              }`}
            >
              <Icon icon={Cancel01Icon} size={22} />
            </DialogPrimitive.Close>
            <Panel {...props} onNavigate={() => setOpen(false)} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <main className="min-w-0 flex-1 px-5 pt-6 pb-16 lg:px-10 lg:pt-12">{children}</main>
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
