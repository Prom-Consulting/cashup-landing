"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CLIENT_APP_URL, EMAIL, PHONE, PHONE_HREF } from "../_data/site";

gsap.registerPlugin(useGSAP);

type NavItem = { label: string; href: string };

/**
 * Бургер для телефонов и планшетов (до 1024px): кнопка в шапке и меню на весь экран.
 * Закрывается по Esc, по ссылке и при расширении окна до десктопной шапки.
 */
export function MobileMenu({ nav, cta }: { nav: NavItem[]; cta: NavItem }) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Пока меню открыто: не прокручиваем страницу под ним, Esc закрывает.
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    // Раскрыли окно до десктопной шапки — меню больше не нужно.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onChange = () => desktop.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onChange);
    panel.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onChange);
    };
  }, [open]);

  useGSAP(
    () => {
      if (!open || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // Только прозрачность, без visibility: иначе ссылки нельзя сфокусировать сразу при открытии.
      gsap
        .timeline()
        .from(panel.current, { opacity: 0, duration: 0.25, ease: "power2.out" })
        .from(
          panel.current!.querySelectorAll("[data-menu-item]"),
          { y: 24, opacity: 0, duration: 0.45, stagger: 0.05, ease: "power3.out" },
          0.05,
        );
    },
    { dependencies: [open], revertOnUpdate: true },
  );

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        onClick={() => setOpen((v) => !v)}
        className="relative z-50 grid h-12 w-12 place-items-center rounded-full bg-white transition-colors hover:bg-cream lg:hidden"
      >
        <span aria-hidden="true" className="relative block h-3.5 w-5">
          <span
            className={`absolute left-0 h-0.5 w-5 rounded-full bg-graphite transition-transform duration-300 ${
              open ? "top-1.5 rotate-45" : "top-0"
            }`}
          />
          <span
            className={`absolute top-1.5 left-0 h-0.5 w-5 rounded-full bg-graphite transition-opacity duration-200 ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`absolute left-0 h-0.5 w-5 rounded-full bg-graphite transition-transform duration-300 ${
              open ? "top-1.5 -rotate-45" : "top-3"
            }`}
          />
        </span>
      </button>

      {open && (
        <div
          ref={panel}
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label="Меню"
          className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-cream px-5 pt-28 pb-10 sm:px-12 lg:hidden"
        >
          <nav aria-label="Разделы">
            <ul className="flex flex-col">
              {nav.map((item) => (
                <li key={item.href} data-menu-item className="border-b border-slate-soft/30">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="display flex items-center justify-between py-5 text-[clamp(2rem,9vw,3rem)] transition-colors hover:text-flame"
                  >
                    {item.label}
                    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-flame" aria-hidden="true">
                      <path
                        d="M7 17 17 7M9 7h8v8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div data-menu-item className="mt-10">
            <Link
              href={cta.href}
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center rounded-full bg-flame px-7 py-4 text-lg font-medium text-white transition-colors hover:bg-graphite"
            >
              {cta.label}
            </Link>
            <a
              href={CLIENT_APP_URL}
              onClick={close}
              className="mt-4 block text-center text-lg font-medium underline-offset-4 hover:underline"
            >
              Моя карта
            </a>
          </div>

          <div data-menu-item className="mt-auto flex flex-col gap-2 pt-10 text-lg">
            <a href={PHONE_HREF} className="text-flame-ink underline-offset-4 hover:underline">
              {PHONE}
            </a>
            <a href={`mailto:${EMAIL}`} className="text-flame-ink underline-offset-4 hover:underline">
              {EMAIL}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
