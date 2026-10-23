"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@loal/ui/logo";
import { CLIENT_APP_URL } from "../_data/site";
import { ACCOUNT, NAV } from "./site-header";
import { MobileMenu } from "./mobile-menu";

/**
 * Шапка страниц для бизнеса. Прилипает к верху: над тёмным героем Loal Corporate
 * она графитовая, бесшовно с ним и с полосой App Store. Как только страницу
 * прокручивают, она плавно «отрывается» в матовую стеклянную панель с фирменной
 * градиентной линией снизу — подача ощутимо меняется на корпоративную. Sticky
 * (а не fixed), чтобы не перекрывать полосу App Store над ней.
 */
export function CorporateHeader({
  cta = { label: "Моя карта", href: CLIENT_APP_URL },
}: {
  cta?: { label: string; href: string };
}) {
  const account = ACCOUNT.business;
  const [scrolled, setScrolled] = useState(false);

  // Порог небольшой: панель проявляется сразу, как только герой начинает уходить вверх.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-out ${
        scrolled
          ? "bg-graphite/80 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          : "bg-graphite shadow-none"
      }`}
    >
      {/* Фирменная волосяная линия снизу — разгорается, когда панель «отрывается» */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-flame to-transparent transition-opacity duration-500 ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="mx-auto flex w-full max-w-[1512px] items-center justify-between gap-6 px-5 py-5 sm:px-12">
        <Link href="/" aria-label="Loal Corporate, на главную" className="relative z-50">
          <Logo direction="corporate" tone="light" />
        </Link>
        <nav aria-label="Разделы" className="hidden lg:block">
          <ul className="flex gap-6 text-lg font-bold text-white">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="whitespace-nowrap transition-colors hover:text-amber">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-5 lg:flex">
          <a
            href={account.href}
            className="text-lg font-bold whitespace-nowrap text-white transition-colors hover:text-amber"
          >
            {account.label}
          </a>
          <Link
            href={cta.href}
            className="rounded-full bg-white px-5 py-4 text-[1.1875rem] font-bold whitespace-nowrap text-graphite transition-colors hover:bg-flame hover:text-white"
          >
            {cta.label}
          </Link>
        </div>
        <MobileMenu nav={NAV} cta={cta} account={account} />
      </div>
    </header>
  );
}
