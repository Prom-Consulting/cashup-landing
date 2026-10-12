"use client";

import { PARTNER_CATEGORIES, type PublicPartner } from "@loal/api";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { coordsOf } from "../_data/partner-coords";
import { highlight, searchPartners } from "../_data/partner-search";
import { monogram } from "../_data/partners-api";
import { CategoryChips } from "./category-chips";
import { SearchField, Suggestions, type SearchOption } from "./smart-search";
import { fitLogo, partnerAvatar } from "./logo-fit";

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

function useDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return desktop;
}

/** Логотип квадратной плиткой, как в справочниках: в круге логотипы теряют края. */
function Avatar({ partner }: { partner: PublicPartner }) {
  const image = partnerAvatar(partner);
  return (
    <span aria-hidden="true" className="grid h-[52px] w-[52px] shrink-0 place-items-center overflow-hidden rounded-[14px] border border-smoke bg-white">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={fitLogo}
          src={image}
          alt={`Логотип ${partner.name}`}
          crossOrigin="anonymous"
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="brand-gradient display grid h-full w-full place-items-center text-lg text-white">
          {monogram(partner.name)}
        </span>
      )}
    </span>
  );
}

/**
 * Список заведений рядом с картой. На компьютере — колонка слева на всю высоту, как в
 * справочниках; на телефоне — шторка снизу, её тянут вверх и вниз. Выбор в списке и на карте —
 * одно и то же; подробности выбранного — в карточке места поверх карты.
 */
export function PartnersPanel({
  partners,
  selectedId,
  onHover,
  onPick,
  onLayout,
}: {
  partners: PublicPartner[];
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onPick: (partner: PublicPartner) => void;
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
  // Все категории — и те, где заведений ещё нет: по ним тоже ищут
  const allCategories = useMemo(
    () => [...new Set([...categories.map(([name]) => name), ...PARTNER_CATEGORIES.map((item) => item.label)])],
    [categories],
  );
  const count = (label: string) => partners.filter((partner) => partner.category === label).length;
  const result = useMemo(() => searchPartners(query, partners, allCategories), [query, partners, allCategories]);
  const shown = useMemo(
    () =>
      (query.trim() ? result.partners.map((hit) => hit.partner) : partners).filter(
        (partner) => !category || partner.category === category,
      ),
    [query, result, partners, category],
  );

  // Поиск: пока поле в фокусе, на месте списка — подсказки
  const input = useRef<HTMLInputElement>(null);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const options: SearchOption[] = useMemo(() => {
    if (!query.trim()) return allCategories.map((label) => ({ kind: "category", label, count: count(label) }));
    const found: SearchOption[] = [
      ...result.categories.map((hit) => ({ kind: "category" as const, label: hit.label, count: hit.count })),
      ...result.partners.slice(0, 6).map((hit) => ({ kind: "partner" as const, partner: hit.partner })),
    ];
    if (result.partners.length > 6) found.push({ kind: "all", count: result.partners.length });
    // Ничего не нашлось — предлагаем категории, а не пустоту
    return found.length > 0 ? found : allCategories.map((label) => ({ kind: "category", label, count: count(label) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, result, allCategories]);
  useEffect(() => setActiveIndex(query.trim() ? 0 : -1), [query]);

  const closeSearch = () => {
    setSearching(false);
    input.current?.blur();
  };
  const choose = (option: SearchOption) => {
    if (option.kind === "category") {
      setCategory(option.label);
      setQuery("");
    } else if (option.kind === "partner") {
      setQuery("");
      onPick(option.partner);
    }
    closeSearch();
  };
  const onSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setSearching(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => (options.length ? (current + step + options.length) % options.length : -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = options[activeIndex];
      if (option && searching) choose(option);
      else closeSearch();
    } else if (event.key === "Escape") {
      closeSearch();
    }
  };

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
    const peek = Math.min(232, Math.round(height * 0.45));
    return { peek, half: Math.max(peek, Math.round(height * 0.6)), full: Math.max(peek, height - 56) };
  };

  // Поворот телефона и клавиатура меняют доступную высоту, даже без window.resize.
  useEffect(() => {
    const parent = panel.current?.parentElement;
    if (!parent) return;
    const resize = () => {
      if (!parent.clientHeight) return;
      setPosition((current) => clamp(current.x, current.y));
      const stops = sheetStops();
      setSheet((current) => Math.min(stops.full, Math.max(stops.peek, current ?? stops.peek)));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktop]);

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
    const element = panel.current;
    if (!element) return;
    const update = () => {
      if (desktop) onLayout({ kind: "side", right: element.offsetWidth });
      else onLayout({ kind: "sheet", height: element.offsetHeight });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktop, collapsed, position.x, onLayout]);

  // Выбрали точку на карте — строка в списке выезжает в поле зрения, шторка приоткрывается
  useEffect(() => {
    if (!selectedId) return;
    // Телефон: шторка опускается — над ней карточка места и сама точка на карте
    if (!desktop) setSheet(sheetStops().peek);
    const frame = requestAnimationFrame(() => {
      const element = list.current;
      const row = element?.querySelector<HTMLElement>(`[data-id="${selectedId}"]`);
      if (element && row) element.scrollTop += row.getBoundingClientRect().top - element.getBoundingClientRect().top;
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // Колонку на компьютере не таскают — тянется только шторка на телефоне
    if (desktop || (event.target as HTMLElement).closest("button, input, a")) return;
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
    "--sheet-h": sheet ? `${sheet}px` : "232px",
  } as CSSProperties;

  return (
    <div
      ref={panel}
      style={style}
      className={`absolute inset-x-0 bottom-0 z-20 flex h-[var(--sheet-h)] max-h-[calc(100%-56px)] flex-col overflow-hidden rounded-t-[24px] bg-paper pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgb(22_21_21/0.14)] md:inset-y-0 md:right-auto md:left-0 md:h-full md:max-h-none md:w-[400px] md:rounded-none md:border-r md:border-smoke md:pb-0 md:shadow-[8px_0_32px_rgb(22_21_21/0.08)] ${
        dragging
          ? "select-none"
          : "transition-[height] duration-180 ease-out motion-reduce:transition-none"
      }`}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`shrink-0 touch-none px-4 pt-2 pb-3 md:px-6 md:pt-5 ${searching ? "hidden md:block" : ""} ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <span aria-hidden="true" className="mx-auto mb-2 block h-1 w-11 rounded-full bg-smoke md:hidden" />
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="display text-[1.375rem] leading-[1.1] text-graphite md:text-[1.75rem]">Где тратить бонусы</h1>
            <p className="mt-1 text-sm text-slate md:text-base">
              {partners.length > 0
                ? `${partners.length} ${plural(partners.length, "заведение", "заведения", "заведений")} в Бишкеке`
                : "Скоро здесь появятся заведения"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!desktop) {
                const stops = sheetStops();
                setSheet((sheet ?? stops.peek) > stops.peek ? stops.peek : stops.full);
                return;
              }
              setCollapsed(!collapsed);
              remember(position, !collapsed);
            }}
            aria-expanded={desktop ? !collapsed : (sheet ?? 0) > sheetStops().peek}
            aria-label={(desktop ? collapsed : (sheet ?? 0) <= sheetStops().peek) ? "Развернуть список" : "Свернуть список"}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cream transition-colors outline-none hover:bg-graphite hover:text-paper focus-visible:ring-3 focus-visible:ring-flame md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className={`h-5 w-5 transition-transform duration-150 ${(desktop ? !collapsed : (sheet ?? 0) > sheetStops().peek) ? "rotate-180" : ""}`}
            >
              <path
                d="m6 15 6-6 6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className={`flex min-h-0 flex-1 flex-col ${collapsed ? "md:hidden" : ""}`}>
        {partners.length > 0 && (
          <div className={`flex shrink-0 flex-col gap-3 px-4 pb-3 md:px-6 ${searching ? "pt-3 md:pt-0" : ""}`}>
            <SearchField
              inputRef={input}
              value={query}
              open={searching}
              activeIndex={activeIndex}
              onChange={(value) => {
                setQuery(value);
                setSearching(true);
              }}
              onFocus={() => {
                setSearching(true);
                // На телефоне подсказкам нужно место — шторка раскрывается
                if (!desktop) setSheet(sheetStops().full);
              }}
              onBlur={() => setSearching(false)}
              onKeyDown={onSearchKey}
            />
            {(categories.length > 0 || category) && !searching && (desktop || (sheet ?? 0) > sheetStops().peek) && (
              <CategoryChips
                categories={[...new Set([...categories.map(([name]) => name), ...(category ? [category] : [])])].map(
                  (name) => ({ name }),
                )}
                value={category}
                onChange={setCategory}
                className="-mx-4 px-4 md:-mx-6 md:px-6"
              />
            )}
          </div>
        )}

        {searching && partners.length > 0 ? (
          <Suggestions
            query={query}
            result={result}
            options={options}
            activeIndex={activeIndex}
            onHover={setActiveIndex}
            onPick={choose}
          />
        ) : (
          <ul ref={list} className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-3 pb-3 md:px-4">
            {result.readAs && query.trim() && (
              <li className="px-3 pb-2 text-sm text-slate">
                Показаны результаты для «<span className="font-bold text-graphite">{result.readAs}</span>»
              </li>
            )}
            {shown.map((partner) => {
              const selected = partner.id === selectedId;
              const onMap = Boolean(coordsOf(partner));
              return (
                <li key={partner.id} data-id={partner.id}>
                  <button
                    type="button"
                    onMouseEnter={() => onHover(partner.id)}
                    onMouseLeave={() => onHover(null)}
                    onFocus={() => onHover(partner.id)}
                    onBlur={() => onHover(null)}
                    onClick={() => onPick(partner)}
                    aria-pressed={selected}
                    className={`relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-flame ${
                      selected ? "bg-cream" : "hover:bg-cream/60"
                    }`}
                  >
                    {/* Выбранная строка — полоска слева, а не рамка: список остаётся спокойным */}
                    {selected && <span aria-hidden="true" className="absolute top-3 bottom-3 left-0 w-1 rounded-full bg-flame" />}
                    <Avatar partner={partner} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base leading-tight font-bold">
                        {highlight(partner.name, query).map((part, index) =>
                          part.hit ? (
                            <mark key={index} className="rounded bg-amber/40 px-0.5 text-inherit">
                              {part.text}
                            </mark>
                          ) : (
                            <span key={index}>{part.text}</span>
                          ),
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-slate">{partner.category ?? "Бишкек"}</span>
                      <span className="block truncate text-[0.8125rem] text-slate/80">
                        {partner.address ?? (onMap ? "Бишкек" : "Без точки на карте")}
                      </span>
                    </span>
                    {partner.maxCoveragePercent ? (
                      <span className="shrink-0 rounded-lg bg-flame/10 px-2 py-1 text-sm font-extrabold text-flame-ink tabular-nums">
                        {partner.maxCoveragePercent}%
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
            {partners.length > 0 && shown.length === 0 && (
              <li className="flex flex-col items-center gap-3 px-3 py-8 text-center">
                <p className="text-base text-slate">
                  {category && !query.trim()
                    ? `В «${category}» заведений пока нет — скоро появятся.`
                    : "Ничего не нашлось — попробуйте другое слово или категорию."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCategory(null);
                    setQuery("");
                  }}
                  className="rounded-full bg-graphite px-5 py-2.5 text-sm font-bold text-paper transition-colors hover:bg-flame"
                >
                  Показать все заведения
                </button>
              </li>
            )}
            <li className="mt-3 border-t border-smoke pt-3 md:hidden">
              <Link href="/become-partner" className="flex min-h-11 items-center justify-center rounded-full bg-flame px-4 text-sm font-bold text-white">
                Добавить своё заведение
              </Link>
            </li>
          </ul>
        )}

        <Link
          href="/become-partner"
          className="hidden shrink-0 items-center justify-between gap-3 border-t border-smoke/80 px-6 py-4 text-base font-bold transition-colors hover:bg-white/60 md:flex"
        >
          {partners.length > 0 ? "Подключить своё заведение" : "Станьте первым — подключите заведение"}
          <span
            aria-hidden="true"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-flame text-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          </span>
        </Link>
      </div>
    </div>
  );
}
