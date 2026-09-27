"use client";

import type { PublicPartner } from "@loal/api";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { monogram } from "../_data/partners-api";

/** Категории берём из самих данных: бэкенд хранит их строкой и списка не навязывает. */
function useCategories(partners: PublicPartner[]) {
  return useMemo(() => {
    const counted = new Map<string, number>();
    for (const partner of partners) {
      if (!partner.category) continue;
      counted.set(partner.category, (counted.get(partner.category) ?? 0) + 1);
    }
    return [...counted.entries()].sort((a, b) => b[1] - a[1]);
  }, [partners]);
}

function matches(partner: PublicPartner, query: string) {
  const haystack = `${partner.name} ${partner.category ?? ""} ${partner.description ?? ""}`;
  return haystack.toLowerCase().includes(query.trim().toLowerCase());
}

function phoneHref(phone: string) {
  return `tel:+${phone.replace(/\D/g, "")}`;
}

function prettyPhone(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^996/, "");
  if (digits.length !== 9) return phone;
  return `+996 ${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
}

/**
 * Размер пузыря — не украшение, а смысл: чем большую часть чека заведение разрешает
 * закрыть бонусами, тем он крупнее. Без заданного процента — самый маленький.
 */
function diameter(partner: PublicPartner) {
  const percent = Math.min(partner.maxCoveragePercent ?? 0, 30);
  return Math.round(132 + (percent / 30) * 96);
}

/** Волна по высоте: соседние пузыри не стоят в одну линию, облако выглядит живым. */
const LIFT = [0, 44, 12, 60, 24, 52, 4, 36];

const chip = (active: boolean) =>
  `shrink-0 rounded-full border-2 px-5 py-3 text-lg transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-flame ${
    active ? "border-graphite bg-graphite text-paper" : "border-smoke bg-paper hover:border-graphite"
  }`;

function Face({ partner, className = "" }: { partner: PublicPartner; className?: string }) {
  const image = partner.photos[0] ?? partner.logoUrl;
  return image ? (
    // Фото лежат в нашем хранилище, оптимизация Next не нужна
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" className={`h-full w-full object-cover ${className}`} loading="lazy" />
  ) : (
    <span
      className={`brand-gradient display grid h-full w-full place-items-center text-[calc(var(--d)*0.3)] text-white ${className}`}
    >
      {monogram(partner.name)}
    </span>
  );
}

function Bubble({ partner, index, onOpen }: { partner: PublicPartner; index: number; onOpen: () => void }) {
  const style = {
    "--d": `${diameter(partner)}px`,
    "--lift": `${LIFT[index % LIFT.length]}px`,
    animationDelay: `${Math.min(index, 16) * 45}ms`,
  } as CSSProperties;

  return (
    <li
      style={style}
      className="bubble-in flex w-[calc(var(--d)*var(--s))] flex-col items-center [--s:0.62] sm:mt-[var(--lift)] sm:[--s:0.85] lg:[--s:1]"
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${partner.name}: подробнее`}
        className="group relative block aspect-square w-full rounded-full outline-none focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-flame"
      >
        <span className="block h-full w-full overflow-hidden rounded-full ring-4 ring-paper shadow-[0_12px_32px_rgb(22_21_21/0.14)] transition duration-300 group-hover:ring-4 group-hover:ring-flame motion-safe:group-hover:-translate-y-1">
          <Face partner={partner} className="transition duration-500 motion-safe:group-hover:scale-105" />
        </span>
        {partner.logoUrl && partner.photos[0] && (
          // Логотип поверх фото — как значок: так место узнают издалека
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={partner.logoUrl}
            alt=""
            className="absolute -bottom-1 -left-1 h-[30%] w-[30%] rounded-full border-4 border-cream bg-paper object-contain p-1"
            loading="lazy"
          />
        )}
        {partner.maxCoveragePercent ? (
          <span className="absolute top-[4%] -right-2 rounded-full bg-flame px-3 py-1.5 text-sm font-bold whitespace-nowrap text-white shadow-[0_6px_16px_rgb(255_93_52/0.35)] sm:text-base">
            до {partner.maxCoveragePercent}%
          </span>
        ) : null}
      </button>
      <span className="mt-3 line-clamp-2 text-center text-base leading-tight font-bold text-graphite sm:text-lg">
        {partner.name}
      </span>
      {partner.category && (
        <span className="mt-0.5 line-clamp-1 text-center text-sm text-slate">{partner.category}</span>
      )}
    </li>
  );
}

/** Честное пустое место: не выдуманные заведения, а приглашение подключить своё. */
function InviteBubble({ index }: { index: number }) {
  const style = { "--d": "150px", "--lift": `${LIFT[index % LIFT.length]}px` } as CSSProperties;
  return (
    <li
      style={style}
      className="flex w-[calc(var(--d)*var(--s))] flex-col items-center [--s:0.62] sm:mt-[var(--lift)] sm:[--s:0.85] lg:[--s:1]"
    >
      <Link
        href="/become-partner"
        className="grid aspect-square w-full place-items-center rounded-full border-2 border-dashed border-slate/50 text-[calc(var(--d)*var(--s)*0.3)] font-light text-slate transition-colors hover:border-flame hover:text-flame focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-flame"
      >
        <span aria-hidden="true">+</span>
        <span className="sr-only">Подключить своё заведение</span>
      </Link>
      <span className="mt-3 text-center text-base leading-tight font-bold text-graphite sm:text-lg">
        Ваше заведение
      </span>
      <span className="mt-0.5 text-center text-sm text-slate">подключить</span>
    </li>
  );
}

export function PartnerDialog({ partner, onClose }: { partner: PublicPartner | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (partner && !element.open) element.showModal();
    if (!partner && element.open) element.close();
  }, [partner]);

  const gallery = partner
    ? partner.photos.length > 0
      ? partner.photos
      : partner.logoUrl
        ? [partner.logoUrl]
        : []
    : [];

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(event) => event.target === dialog.current && onClose()}
      aria-labelledby="partner-dialog-title"
      className="partner-dialog m-auto w-[min(640px,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[32px] bg-paper p-0 text-graphite"
    >
      {partner && (
        <div>
          {gallery.length > 0 ? (
            <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto">
              {gallery.map((url) => (
                <li key={url} className="aspect-[4/3] w-full shrink-0 snap-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={partner.name} className="h-full w-full object-cover" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="brand-gradient display grid aspect-[16/9] place-items-center text-[5rem] text-white">
              {monogram(partner.name)}
            </div>
          )}

          <div className="flex flex-col gap-4 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                {partner.category && <p className="text-base text-slate">{partner.category}</p>}
                <h2 id="partner-dialog-title" className="display mt-1 text-[1.9rem] leading-tight">
                  {partner.name}
                </h2>
              </div>
              {partner.maxCoveragePercent ? (
                <p className="shrink-0 rounded-2xl bg-flame px-4 py-2 text-center text-white">
                  <span className="display block text-[1.6rem] leading-none">до {partner.maxCoveragePercent}%</span>
                  <span className="text-sm font-bold">чека бонусами</span>
                </p>
              ) : null}
            </div>

            {partner.description && <p className="text-lg leading-snug whitespace-pre-line">{partner.description}</p>}

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-lg">
              {partner.contactPhone && (
                <a
                  href={phoneHref(partner.contactPhone)}
                  className="font-bold text-flame-ink underline-offset-4 hover:underline"
                >
                  {prettyPhone(partner.contactPhone)}
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
                  На карте 2ГИС
                </a>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-3">
              <Link
                href="/#price"
                className="inline-flex items-center rounded-full bg-flame px-6 py-4 text-[1.1875rem] font-bold text-white transition-colors hover:bg-graphite"
              >
                Оформить карту Loal
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center rounded-full border-2 border-graphite px-6 py-4 text-lg font-medium transition-colors hover:bg-graphite hover:text-paper"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

/**
 * Каталог заведений — облако кругов сразу под заголовком, без рамок. Круг — лицо места: фото или логотип,
 * размер — сколько чека закрывают бонусы. Подробности открываются по клику.
 */
export function PartnersCatalog({
  partners,
  onOpen,
}: {
  partners: PublicPartner[];
  onOpen: (partner: PublicPartner) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const categories = useCategories(partners);

  const shown = useMemo(
    () => partners.filter((partner) => (!category || partner.category === category) && matches(partner, query)),
    [partners, category, query],
  );
  const filtering = Boolean(category || query.trim());

  return (
    <section aria-label="Заведения">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <label className="relative block w-full shrink-0 sm:max-w-[380px]">
          <span className="sr-only">Поиск по заведениям</span>
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 opacity-60"
          >
            <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Название или чем занимается"
            className="h-14 w-full rounded-full border-2 border-smoke bg-paper pr-5 pl-13 text-lg transition-colors outline-none placeholder:text-slate focus:border-graphite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-flame"
          />
        </label>

        {categories.length > 1 && (
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
            <button
              type="button"
              onClick={() => setCategory(null)}
              aria-pressed={category === null}
              className={chip(category === null)}
            >
              Все · {partners.length}
            </button>
            {categories.map(([name, count]) => (
              <button
                key={name}
                type="button"
                onClick={() => setCategory(name === category ? null : name)}
                aria-pressed={category === name}
                className={chip(category === name)}
              >
                {name} · {count}
              </button>
            ))}
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="py-20 text-center text-xl text-slate">
          Ничего не нашлось. Попробуйте другое слово или посмотрите все заведения.
        </p>
      ) : (
        <ul className="mx-auto mt-10 flex max-w-[1180px] flex-wrap items-start justify-center gap-x-6 gap-y-8 sm:mt-12 sm:gap-x-10 sm:gap-y-6">
          {shown.map((partner, index) => (
            <Bubble key={partner.id} partner={partner} index={index} onOpen={() => onOpen(partner)} />
          ))}
          {!filtering && <InviteBubble index={shown.length} />}
        </ul>
      )}

      <p className="mt-12 text-center text-base text-slate">
        Чем больше круг, тем большую часть чека там можно закрыть бонусами.
      </p>
    </section>
  );
}
