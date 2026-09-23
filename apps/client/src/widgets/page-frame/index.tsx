import type { ReactNode } from "react";
import { Link, Outlet } from "react-router";
import { Logo } from "@loal/ui/logo";
import { SITE_URL } from "../../shared/config/env";

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
      <main className="mx-auto w-full max-w-[420px] flex-1 px-5 pb-10">{children ?? <Outlet />}</main>
      <footer className="mx-auto w-full max-w-[420px] px-5 py-8 text-base text-muted-foreground">
        <a href={SITE_URL} className="underline-offset-4 hover:underline">
          loal.kg
        </a>
      </footer>
    </div>
  );
}
