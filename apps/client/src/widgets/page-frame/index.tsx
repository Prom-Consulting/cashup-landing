import type { ReactNode } from "react";
import { Link, Outlet } from "react-router";
import { Logo } from "@loal/ui/logo";

/**
 * Рамка публичных страниц. Страница — одна колонка под телефон, поэтому шапка и
 * подвал держат ту же ширину, а не расползаются по экрану.
 */
export function PageFrame({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="mx-auto w-full max-w-[420px] px-5 py-6">
        <Link to="/" aria-label="Карта Loal" className="inline-flex">
          <Logo />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-[420px] flex-1 px-5 pb-12">{children ?? <Outlet />}</main>
    </div>
  );
}
