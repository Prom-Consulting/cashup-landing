"use client";

import type { PublicPartner } from "@loal/api";
import { useMemo, useState } from "react";
import { monogram } from "../_data/partners-api";

const money = new Intl.NumberFormat("ru-RU");

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
 * Каталог заведений. Карточка показывает то, что заведение само заполнило в кабинете:
 * фотографию, логотип, категорию, описание и ссылки, по которым его можно найти.
 */
export function PartnersCatalog({ partners }: { partners: PublicPartner[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const categories = useCategories(partners);

  const shown = useMemo(
    () => partners.filter((partner) => (!category || partner.category === category) && matches(partner, query)),
    [partners, category, query],
  );

  return (
    <>
      <div className="flex flex-col gap-5 border-b-2 border-smoke pb-8">
        <label className="relative block max-w-[460px]">
          <span className="sr-only">Поиск по заведениям</span>
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 opacity-55"
          >
            <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Название или чем занимается"
            className="h-14 w-full rounded-full border-2 border-smoke bg-paper pr-5 pl-13 text-lg transition-colors outline-none placeholder:text-slate focus:border-graphite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-flame"
          />
        </label>

        {categories.length > 0 && (
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
            <button
              type="button"
              onClick={() => setCategory(null)}
              aria-pressed={category === null}
              className={`shrink-0 rounded-full border-2 px-5 py-3 text-lg transition-colors ${
                category === null ? "border-graphite bg-graphite text-paper" : "border-smoke hover:border-graphite"
              }`}
            >
              Все ({partners.length})
            </button>
            {categories.map(([name, count]) => (
              <button
                key={name}
                type="button"
                onClick={() => setCategory(name === category ? null : name)}
                aria-pressed={category === name}
                className={`shrink-0 rounded-full border-2 px-5 py-3 text-lg transition-colors ${
                  category === name ? "border-graphite bg-graphite text-paper" : "border-smoke hover:border-graphite"
                }`}
              >
                {name} ({count})
              </button>
            ))}
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="py-16 text-center text-xl text-slate">
          Ничего не нашлось. Попробуйте другое слово или посмотрите все заведения.
        </p>
      ) : (
        <ul className="grid gap-6 py-10 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((partner) => (
            <li key={partner.id} className="flex flex-col overflow-hidden rounded-[32px] bg-paper">
              <div className="relative aspect-[16/10] bg-cream">
                {partner.photos[0] ? (
                  // Фотографии лежат в нашем хранилище, оптимизация не нужна
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={partner.photos[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="brand-gradient display grid h-full w-full place-items-center text-[3rem] text-white">
                    {monogram(partner.name)}
                  </span>
                )}

                {partner.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={partner.logoUrl}
                    alt=""
                    className="absolute bottom-4 left-4 h-16 w-16 rounded-full bg-paper object-contain p-2"
                    loading="lazy"
                  />
                )}

                {partner.maxCoveragePercent ? (
                  // Главное, что человек хочет знать о месте: какую часть чека закроют бонусы
                  <span className="absolute top-4 right-4 rounded-full bg-graphite px-4 py-2 text-base font-medium text-paper">
                    бонусами до {partner.maxCoveragePercent}%
                  </span>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col p-6">
                {partner.category && <p className="text-base text-slate">{partner.category}</p>}
                <h2 className="display mt-1 text-[1.6rem] leading-tight">{partner.name}</h2>
                {partner.description && (
                  <p className="mt-3 line-clamp-3 text-lg leading-snug text-slate">{partner.description}</p>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-5 text-lg">
                  {partner.contactPhone && (
                    <a
                      href={phoneHref(partner.contactPhone)}
                      className="text-flame-ink underline-offset-4 hover:underline"
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
              </div>
            </li>
          ))}
        </ul>
      )}

      {shown.length > 0 && (
        <p className="pb-4 text-lg text-slate">
          Показано {money.format(shown.length)} из {money.format(partners.length)}.
        </p>
      )}
    </>
  );
}
