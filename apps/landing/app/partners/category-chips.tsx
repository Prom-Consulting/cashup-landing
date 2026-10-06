"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * Категории одной строкой. Полосы прокрутки нет (она лезла поверх списка на компьютере):
 * строку листают пальцем, колесом мыши или тачпадом, а края плавно гаснут там, где есть ещё.
 */
export function CategoryChips({
  categories,
  value,
  onChange,
  className = "",
  hrefFor,
}: {
  categories: { name: string; count?: number }[];
  value: string | null;
  onChange: (next: string | null) => void;
  className?: string;
  /** Чипы-ссылки на страницы категорий (каталог); без него — фильтр на месте (карта). */
  hrefFor?: (name: string | null) => string;
}) {
  const row = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const element = row.current;
    if (!element) return;
    const update = () =>
      setEdges({
        left: element.scrollLeft > 4,
        right: element.scrollLeft + element.clientWidth < element.scrollWidth - 4,
      });
    update();
    // Вертикальное колесо листает строку вбок — иначе на компьютере до последних категорий не добраться
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (element.scrollWidth <= element.clientWidth) return;
      event.preventDefault();
      element.scrollLeft += event.deltaY;
    };
    element.addEventListener("scroll", update, { passive: true });
    element.addEventListener("wheel", onWheel, { passive: false });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", update);
      element.removeEventListener("wheel", onWheel);
      observer.disconnect();
    };
  }, [categories.length]);

  // Выбранная категория всегда в поле зрения
  useEffect(() => {
    row.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [value]);

  const mask = `linear-gradient(90deg, ${edges.left ? "transparent" : "#000"} 0, #000 28px, #000 calc(100% - 28px), ${
    edges.right ? "transparent" : "#000"
  } 100%)`;

  return (
    <div
      ref={row}
      role="group"
      aria-label="Категории"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
      className={`no-scrollbar flex touch-pan-x gap-2 overflow-x-auto overscroll-x-contain ${className}`}
    >
      {[null, ...categories.map((item) => item.name)].map((name) => {
        const active = value === name;
        const count = name ? categories.find((item) => item.name === name)?.count : undefined;
        const chip = `shrink-0 rounded-full border-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-flame ${
          active ? "border-graphite bg-graphite text-paper" : "border-smoke bg-white/70 hover:border-graphite"
        }`;
        const content = (
          <>
            {name ?? "Все"}
            {count ? <span className={`ml-1.5 tabular-nums ${active ? "opacity-70" : "text-slate"}`}>{count}</span> : null}
          </>
        );
        if (hrefFor)
          return (
            <Link key={name ?? "all"} href={hrefFor(name)} aria-current={active ? "page" : undefined} data-active={active} className={chip}>
              {content}
            </Link>
          );
        return (
          <button
            key={name ?? "all"}
            type="button"
            onClick={() => onChange(active ? null : name)}
            aria-pressed={active}
            data-active={active}
            className={chip}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
