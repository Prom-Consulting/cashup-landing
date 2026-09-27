"use client";

import type { PublicPartner } from "@loal/api";
import type { KeyboardEvent, RefObject } from "react";
import { highlight, type SearchResult } from "../_data/partner-search";
import { monogram } from "../_data/partners-api";

export type SearchOption =
  | { kind: "category"; label: string; count: number }
  | { kind: "partner"; partner: PublicPartner }
  | { kind: "all"; count: number };

const optionId = (index: number) => `partner-search-option-${index}`;

function plural(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "заведение";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "заведения";
  return "заведений";
}

/** Поле поиска — комбобокс: подсказки ниже выбираются стрелками, Enter и мышью. */
export function SearchField({
  inputRef,
  value,
  open,
  activeIndex,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  open: boolean;
  activeIndex: number;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="relative">
      <label htmlFor="partner-search" className="sr-only">
        Поиск по заведениям
      </label>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 opacity-55"
      >
        <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        id="partner-search"
        type="text"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={open}
        aria-controls="partner-search-options"
        aria-autocomplete="list"
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder="Кофе, стрижка, шины или 20%"
        className="h-12 w-full rounded-full border-2 border-smoke bg-white/80 pr-11 pl-11 text-base outline-none transition-colors placeholder:text-slate focus:border-graphite"
      />
      {value && (
        <button
          type="button"
          aria-label="Очистить поиск"
          // mousedown, а не click: иначе поле потеряет фокус раньше, чем очистится
          onMouseDown={(event) => {
            event.preventDefault();
            onChange("");
          }}
          className="absolute top-1/2 right-3 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-cream text-slate transition-colors hover:bg-graphite hover:text-paper"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
            <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

function Name({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlight(text, query).map((part, index) =>
        part.hit ? (
          <mark key={index} className="rounded bg-amber/40 px-0.5 text-inherit">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

/** Подсказки на месте списка: категории, заведения и «показать все». */
export function Suggestions({
  query,
  result,
  options,
  activeIndex,
  onHover,
  onPick,
}: {
  query: string;
  result: SearchResult;
  options: SearchOption[];
  activeIndex: number;
  onHover: (index: number) => void;
  onPick: (option: SearchOption) => void;
}) {
  const typed = query.trim().length > 0;
  const nothing = typed && result.partners.length === 0 && result.categories.length === 0;
  const row = (index: number, selected: boolean) =>
    `flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${
      selected ? "bg-white shadow-[0_6px_18px_rgb(22_21_21/0.08)] ring-2 ring-flame" : "hover:bg-white/70"
    }`;

  let index = -1;
  const sections: { title: string; items: SearchOption[] }[] = typed
    ? [
        { title: "Категории", items: options.filter((option) => option.kind === "category") },
        { title: "Заведения", items: options.filter((option) => option.kind !== "category") },
      ]
    : [{ title: "Что ищете?", items: options }];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 md:px-4">
      {result.readAs && (
        <p className="mx-3 mb-2 rounded-2xl bg-cream px-3 py-2 text-sm text-slate">
          Похоже, другая раскладка — ищем «<span className="font-bold text-graphite">{result.readAs}</span>»
        </p>
      )}
      {nothing && (
        <p className="mx-3 mb-2 text-base text-slate">По «{query.trim()}» ничего нет. Посмотрите по категориям:</p>
      )}

      <ul id="partner-search-options" role="listbox" aria-label="Подсказки поиска" className="flex flex-col gap-3">
        {sections
          .filter((section) => section.items.length > 0)
          .map((section) => (
            <li key={section.title} role="presentation">
              <p className="px-3 pb-1 text-sm font-bold text-slate">{section.title}</p>
              <ul role="presentation" className="flex flex-col gap-1">
                {section.items.map((option) => {
                  index += 1;
                  const current = index;
                  const selected = current === activeIndex;
                  const common = {
                    id: optionId(current),
                    role: "option" as const,
                    "aria-selected": selected,
                    onMouseEnter: () => onHover(current),
                    // mousedown: выбор срабатывает раньше, чем поле потеряет фокус
                    onMouseDown: (event: { preventDefault: () => void }) => {
                      event.preventDefault();
                      onPick(option);
                    },
                    className: row(current, selected),
                  };
                  if (option.kind === "category")
                    return (
                      <li key={`c-${option.label}`} {...common}>
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream">
                          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-flame">
                            <path
                              d="M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v6H4zM13 14h7v6h-7z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-base font-bold">{option.label}</span>
                          <span className="block text-sm text-slate">
                            {option.count > 0 ? `${option.count} ${plural(option.count)}` : "пока нет — скоро появятся"}
                          </span>
                        </span>
                      </li>
                    );
                  if (option.kind === "all")
                    return (
                      <li key="all" {...common}>
                        <span className="flex-1 text-base font-bold text-flame-ink">
                          Показать все результаты · {option.count}
                        </span>
                      </li>
                    );
                  const partner = option.partner;
                  const image = partner.photos[0] ?? partner.logoUrl;
                  return (
                    <li key={`p-${partner.id}`} {...common}>
                      <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[conic-gradient(from_210deg,var(--coral),var(--flame),var(--amber),var(--peach),var(--coral))] p-[2px]">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image}
                            alt=""
                            className="h-full w-full rounded-full border-2 border-paper object-cover"
                          />
                        ) : (
                          <span className="brand-gradient grid h-full w-full place-items-center rounded-full border-2 border-paper text-sm font-extrabold text-white">
                            {monogram(partner.name)}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-bold">
                          <Name text={partner.name} query={query} />
                        </span>
                        {partner.category && (
                          <span className="block truncate text-sm text-slate">{partner.category}</span>
                        )}
                      </span>
                      {partner.maxCoveragePercent ? (
                        <span className="shrink-0 rounded-full bg-flame px-2.5 py-0.5 text-xs font-bold text-white">
                          до {partner.maxCoveragePercent}%
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
      </ul>

      {!typed && (
        <p className="mx-3 mt-4 text-sm leading-snug text-slate">
          Ищите как удобно: «кофе», «стрижка», «шины», «20%» — с опечатками и в любой раскладке.
        </p>
      )}
    </div>
  );
}
