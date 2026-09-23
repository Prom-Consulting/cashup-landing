import type { ReactNode } from "react";
import { Link, Outlet } from "react-router";
import { Logo } from "@loal/ui/logo";
import { SITE_URL } from "../../shared/config/env";

/** Общая рамка публичных страниц: шапка со знаком и ссылка на сайт внизу. */
export function PageFrame({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <header className="mx-auto w-full max-w-[720px] px-5 py-5">
        <Link to="/" aria-label="Карта Loal">
          <Logo />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-[720px] flex-1 px-5 py-6">{children ?? <Outlet />}</main>
      <footer className="mx-auto w-full max-w-[720px] px-5 py-6 text-base text-slate">
        <a href={SITE_URL} className="underline-offset-4 hover:underline">
          loal.kg
        </a>
      </footer>
    </div>
  );
}
