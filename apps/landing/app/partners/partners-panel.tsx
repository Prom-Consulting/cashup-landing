"use client";

import type { PublicPartner } from "@loal/api";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { coordsOf } from "../_data/partner-coords";
import { monogram } from "../_data/partners-api";

const STORAGE_KEY = "loal.partners.panel";
const PANEL_WIDTH = 400;
const GAP = 24;

export type PanelLayout = { kind: "side"; right: number } | { kind: "sheet"; height: number };

function plural(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function matches(partner: PublicPartner, query: string) {
  const haystack = `${partner.name} ${partner.category ?? ""} ${partner.description ?? ""}`;
  return haystack.toLowerCase().includes(query.trim().toLowerCase());
}

function phoneHref(phone: string) {
  return `tel:+${phone.replace(/\D/g, "")}`;
}

function useDesktop() {
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return desktop;
}

function Grip() {
  return (
    <svg viewBox="0 0 12 20" aria-hidden="true" className="h-5 w-3 shrink-0 text-slate">
      {[3, 10, 17].flatMap((y) =>
        [2, 9].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="currentColor" />),
      )}
    </svg>
  );
}

function Avatar({ partner }: { partner: PublicPartner }) {
  const image = partner.photos[0] ?? partner.logoUrl;
  return (
    <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-[conic-gradient(from_210deg,var(--coral),var(--flame),var(--amber),var(--peach),var(--coral))] p-[3px]">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="h-full w-full rounded-full border-2 border-paper object-cover"
          loading="lazy"
        />
      ) : (
        <span className="brand-gradient display grid h-full w-full place-items-center rounded-full border-2 border-paper text-lg text-white">
          {monogram(partner.name)}
        </span>
      )}
    </span>
  );
}

/**
 * Список заведений прямо на карте. На компьютере — плавающая панель: её можно утащить
 * за заголовок куда удобно и свернуть, место запоминается. На телефоне — шторка снизу,
 * её тянут вверх и вниз. Выбор в списке и на карте — одно и то же.
 */
export function PartnersPanel({
  partners,
  selectedId,
  onHover,
  onPick,
  onOpen,
  onLayout,
}: {
  partners: PublicPartner[];
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onPick: (partner: PublicPartner) => void;
  onOpen: (partner: PublicPartner) => void;
  onLayout: (layout: PanelLayout) => void;
}) {
  const desktop = useDesktop();
  const panel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: GAP, y: GAP });
  const [sheet, setSheet] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ px: number; py: number; x: number; y: number; h: number } | null>(null);

  const categories = useMemo(() => {
    const counted = new Map<string, number>();
    for (const partner of partners)
      if (partner.category) counted.set(partner.category, (counted.get(partner.category) ?? 0) + 1);
    return [...counted.entries()].sort((a, b) => b[1] - a[1]);
  }, [partners]);
  const shown = useMemo(
    () => partners.filter((partner) => (!category || partner.category === category) && matches(partner, query)),
    [partners, category, query],
  );

  const bounds = () => panel.current?.parentElement?.getBoundingClientRect();
  const clamp = (x: number, y: number) => {
    const box = bounds();
    const width = panel.current?.offsetWidth ?? PANEL_WIDTH;
    if (!box) return { x, y };
    return {
      x: Math.min(Math.max(x, 12), Math.max(12, box.width - width - 12)),
      y: Math.min(Math.max(y, 12), Math.max(12, box.height - 96)),
    };
  };
  const sheetStops = () => {
    const height = bounds()?.height ?? 700;
    return { peek: 150, half: Math.round(height * 0.5), full: height - 16 };
  };

  // Место панели помним между заходами; экран сузился — возвращаем в пределы карты
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as {
        x: number;
        y: number;
        collapsed?: boolean;
      } | null;
      if (saved) {
        setPosition(clamp(saved.x, saved.y));
        setCollapsed(Boolean(saved.collapsed));
      }
    } catch {
      // Нет доступа к хранилищу — остаёмся в углу
    }
    const onResize = () => setPosition((current) => clamp(current.x, current.y));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remember = (next: { x: number; y: number }, nextCollapsed = collapsed) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, collapsed: nextCollapsed }));
    } catch {
      // Не запомнили — не страшно
    }
  };

  // Карта должна знать, какую часть экрана закрывает панель
  useEffect(() => {
    if (desktop) onLayout({ kind: "side", right: collapsed ? 0 : position.x + PANEL_WIDTH });
    else onLayout({ kind: "sheet", height: sheet ?? sheetStops().peek });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktop, collapsed, position.x, sheet]);

  // Выбрали точку на карте — строка в списке выезжает в поле зрения, шторка приоткрывается
  useEffect(() => {
    if (!selectedId) return;
    if (!desktop && (sheet ?? 0) < sheetStops().half) setSheet(sheetStops().half);
    if (desktop && collapsed) setCollapsed(false);
    requestAnimationFrame(() =>
      list.current
        ?.querySelector(`[data-id="${selectedId}"]`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, input, a")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      px: event.clientX,
      py: event.clientY,
      x: position.x,
      y: position.y,
      h: sheet ?? sheetStops().peek,
    };
    setDragging(true);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;
    if (desktop) setPosition(clamp(start.x + event.clientX - start.px, start.y + event.clientY - start.py));
    else {
      const stops = sheetStops();
      setSheet(Math.min(stops.full, Math.max(96, start.h - (event.clientY - start.py))));
    }
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    drag.current = null;
    setDragging(false);
    if (!start) return;
    if (desktop) return remember(position);
    // Шторка встаёт в ближайшее положение; короткое касание — переключает
    const stops = sheetStops();
    const moved = Math.abs(event.clientY - start.py) > 6;
    const current = sheet ?? stops.peek;
    const next = moved
      ? [stops.peek, stops.half, stops.full].reduce((best, stop) =>
          Math.abs(stop - current) < Math.abs(best - current) ? stop : best,
        )
      : current < stops.half
        ? stops.half
        : stops.peek;
    setSheet(next);
  };

  const style = {
    "--x": `${position.x}px`,
    "--y": `${position.y}px`,
    "--sheet-h": sheet ? `${sheet}px` : "150px",
  } as CSSProperties;

  return (
    <div
      ref={panel}
      style={style}
      className={`absolute inset-x-0 bottom-0 z-20 flex h-[var(--sheet-h)] flex-col overflow-hidden rounded-t-[28px] bg-paper/92 shadow-[0_-12px_40px_rgb(22_21_21/0.18)] backdrop-blur-xl md:inset-auto md:top-0 md:left-0 md:h-auto md:max-h-[calc(100%-48px)] md:w-[400px] md:translate-x-[var(--x)] md:translate-y-[var(--y)] md:rounded-[28px] md:shadow-[0_24px_60px_rgb(22_21_21/0.22)] ${
        dragging
          ? "select-none md:scale-[1.01] md:shadow-[0_32px_80px_rgb(22_21_21/0.3)]"
          : "transition-[height] duration-300 ease-out md:transition-shadow"
      }`}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`shrink-0 touch-none px-5 pt-3 pb-4 md:px-6 md:pt-5 ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <span aria-hidden="true" className="mx-auto mb-3 block h-1.5 w-11 rounded-full bg-smoke md:hidden" />
        <div className="flex items-start gap-3">
          <span className="mt-2 hidden md:block">
            <Grip />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="display text-[1.75rem] leading-[1.05] text-flame md:text-[2rem]">Где тратить бонусы</h1>
            <p className="mt-1 text-base text-slate">
              {partners.length > 0
                ? `${partners.length} ${plural(partners.length, "заведение", "заведения", "заведений")} в Бишкеке`
                : "Скоро здесь появятся заведения"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCollapsed(!collapsed);
              remember(position, !collapsed);
            }}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Развернуть список" : "Свернуть список"}
            className="hidden h-10 w-10 shrink-0 place-items-center rounded-full bg-cream text-xl transition-colors hover:bg-graphite hover:text-paper md:grid"
          >
            <span aria-hidden="true" className={`transition-transform ${collapsed ? "rotate-180" : ""}`}>
              ⌃
            </span>
          </button>
        </div>
      </div>

      <div className={`flex min-h-0 flex-1 flex-col ${collapsed ? "md:hidden" : ""}`}>
        {partners.length > 0 && (
          <div className="flex shrink-0 flex-col gap-3 px-5 pb-3 md:px-6">
            <label className="relative block">
              <span className="sr-only">Поиск по заведениям</span>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 opacity-55"
              >
                <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
                <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Название или чем занимается"
                className="h-12 w-full rounded-full border-2 border-smoke bg-white/80 pr-4 pl-11 text-base outline-none transition-colors placeholder:text-slate focus:border-graphite"
              />
            </label>
            {categories.length > 1 && (
              <div className="-mx-5 flex gap-2 overflow-x-auto px-5 md:-mx-6 md:px-6">
                {[null, ...categories.map(([name]) => name)].map((name) => {
                  const active = category === name;
                  return (
                    <button
                      key={name ?? "all"}
                      type="button"
                      onClick={() => setCategory(active ? null : name)}
                      aria-pressed={active}
                      className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "border-graphite bg-graphite text-paper"
                          : "border-smoke bg-white/70 hover:border-graphite"
                      }`}
                    >
                      {name ?? "Все"}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <ul ref={list} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 md:px-4">
          {shown.map((partner) => {
            const selected = partner.id === selectedId;
            const onMap = Boolean(coordsOf(partner));
            return (
              <li key={partner.id} data-id={partner.id} className="py-1">
                <div
                  className={`rounded-[22px] transition-colors ${selected ? "bg-white shadow-[0_8px_24px_rgb(22_21_21/0.1)] ring-2 ring-flame" : "hover:bg-white/70"}`}
                >
                  <button
                    type="button"
                    onMouseEnter={() => onHover(partner.id)}
                    onMouseLeave={() => onHover(null)}
                    onFocus={() => onHover(partner.id)}
                    onBlur={() => onHover(null)}
                    onClick={() => onPick(partner)}
                    aria-expanded={selected}
                    className="flex w-full items-center gap-3 rounded-[22px] p-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-flame"
                  >
                    <Avatar partner={partner} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-lg leading-tight font-bold">{partner.name}</span>
                      <span className="block truncate text-sm text-slate">
                        {[partner.category, onMap ? null : "без точки на карте"].filter(Boolean).join(" · ") ||
                          "Бишкек"}
                      </span>
                    </span>
                    {partner.maxCoveragePercent ? (
                      <span className="shrink-0 rounded-full bg-flame px-3 py-1 text-sm font-bold text-white">
                        до {partner.maxCoveragePercent}%
                      </span>
                    ) : null}
                  </button>

                  {selected && (
                    <div className="flex flex-col gap-3 px-4 pb-4">
                      {partner.description && (
                        <p className="line-clamp-3 text-base leading-snug text-graphite/85">{partner.description}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-base">
                        {partner.contactPhone && (
                          <a
                            href={phoneHref(partner.contactPhone)}
                            className="font-bold text-flame-ink underline-offset-4 hover:underline"
                          >
                            Позвонить
                          </a>
                        )}
                        {partner.instagramUrl && (
                          <a
                            href={partner.instagramUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="underline-offset-4 hover:underline"
                          >
                            Instagram
                          </a>
                        )}
                        {partner.twogisUrl && (
                          <a
                            href={partner.twogisUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="underline-offset-4 hover:underline"
                          >
                            Маршрут в 2ГИС
                          </a>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpen(partner)}
                        className="self-start rounded-full bg-flame px-5 py-2.5 text-base font-bold text-white transition-colors hover:bg-graphite"
                      >
                        Фото и подробности
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
          {partners.length > 0 && shown.length === 0 && (
            <li className="px-3 py-8 text-center text-base text-slate">Ничего не нашлось — попробуйте другое слово.</li>
          )}
        </ul>

        <Link
          href="/become-partner"
          className="flex shrink-0 items-center justify-between gap-3 border-t border-smoke/80 px-6 py-4 text-base font-bold transition-colors hover:bg-white/60"
        >
          {partners.length > 0 ? "Подключить своё заведение" : "Станьте первым — подключите заведение"}
          <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full bg-flame text-white">
            +
          </span>
        </Link>
      </div>
    </div>
  );
}
