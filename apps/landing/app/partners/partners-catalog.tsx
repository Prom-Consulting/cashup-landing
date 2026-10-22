"use client";

import { PARTNER_AUDIENCES, PARTNER_CATEGORIES, type PartnerAudienceId, type PublicPartner } from "@loal/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { searchPartners } from "../_data/partner-search";
import { categoryIdOf, categoryPath, partnerPath, plural } from "../_data/seo";
import { CategoryChips } from "./category-chips";
import { PartnerCard, PrimeCard } from "./partner-card";
import { SearchField, Suggestions, type SearchOption } from "./smart-search";

/**
 * Прайм — самое выгодное заведение с фото: оно задаёт тон всей витрине. Нет фото ни у кого —
 * просто самое выгодное. Порядок остальных — как отдал сервер.
 */
/**
 * Крупная карточка сверху. Пока нет платного продвижения — случайное заведение из всех при
 * каждом заходе. `roll` — число 0…1, выбранное в браузере; без него (HTML с сервера) — заведение
 * с наибольшим процентом.
 */
function pickPrime(partners: PublicPartner[], roll: number | null) {
  if (partners.length === 0) return null;
  if (roll !== null) return partners[Math.floor(roll * partners.length)] ?? partners[0]!;
  return partners.reduce((top, partner) => ((partner.maxCoveragePercent ?? 0) > (top.maxCoveragePercent ?? 0) ? partner : top));
}

/**
 * Каталог как на маркетплейсе: поиск и категории сверху, одна крупная карточка и сетка
 * заведений. Карта — второй вид, переключатель над сеткой.
 */
export function PartnersCatalog({
  partners,
  viewSwitch,
  category = null,
  heading = "Где тратить бонусы",
  intro,
  breadcrumbs,
}: {
  partners: PublicPartner[];
  viewSwitch?: React.ReactNode;
  /** Страница категории: сетка только её заведений, чип категории выбран. */
  category?: string | null;
  heading?: string;
  intro?: string;
  breadcrumbs?: React.ReactNode;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [audience, setAudience] = useState<PartnerAudienceId | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => {
    const counted = new Map<string, number>();
    for (const partner of partners)
      if (partner.category) counted.set(partner.category, (counted.get(partner.category) ?? 0) + 1);
    return [...counted.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [partners]);
  const allCategories = useMemo(
    () => [...new Set([...categories.map((item) => item.name), ...PARTNER_CATEGORIES.map((item) => item.label)])],
    [categories],
  );
  const count = (label: string) => partners.filter((partner) => partner.category === label).length;
  const result = useMemo(() => searchPartners(query, partners, allCategories), [query, partners, allCategories]);
  // «Для кого» — фильтр на месте; ряд появляется, когда хоть одно заведение его заполнило
  const audienceCounts = PARTNER_AUDIENCES.map((item) => ({
    ...item,
    count: partners.filter((partner) => partner.audiences?.includes(item.id)).length,
  })).filter((item) => item.count > 0);
  const filtering = Boolean(query.trim() || category || audience);
  const inCategory = category ? partners.filter((partner) => partner.category === category).length : partners.length;
  const shown = useMemo(
    () =>
      (query.trim() ? result.partners.map((hit) => hit.partner) : partners).filter(
        (partner) =>
          (!category || partner.category === category) && (!audience || Boolean(partner.audiences?.includes(audience))),
      ),
    [query, result, partners, category, audience],
  );
  // Случайный выбор — только после загрузки в браузере, иначе HTML сервера и первый рендер разойдутся
  const [roll, setRoll] = useState<number | null>(null);
  useEffect(() => setRoll(Math.random()), []);
  const prime = filtering ? null : pickPrime(partners, roll);
  const grid = prime ? shown.filter((partner) => partner.id !== prime.id) : shown;
  const topPercent = Math.max(0, ...partners.map((partner) => partner.maxCoveragePercent ?? 0));

  const options: SearchOption[] = useMemo(() => {
    if (!query.trim()) return allCategories.map((label) => ({ kind: "category", label, count: count(label) }));
    const found: SearchOption[] = [
      ...result.categories.map((hit) => ({ kind: "category" as const, label: hit.label, count: hit.count })),
      ...result.partners.slice(0, 6).map((hit) => ({ kind: "partner" as const, partner: hit.partner })),
    ];
    if (result.partners.length > 6) found.push({ kind: "all", count: result.partners.length });
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
      setQuery("");
      router.push(categoryPath(categoryIdOf({ category: option.label })));
    } else if (option.kind === "partner") router.push(partnerPath(option.partner));
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
    } else if (event.key === "Escape") closeSearch();
  };

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pt-6 pb-16 sm:px-6 md:pt-10">
      {breadcrumbs}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="max-w-[60ch]">
          <h1 className="display text-[2.25rem] leading-[1] text-flame sm:text-[3rem]">{heading}</h1>
          <p className="mt-2 text-lg text-slate">
            {inCategory > 0
              ? `${inCategory} ${plural(inCategory, "заведение", "заведения", "заведений")} в Бишкеке`
              : "Скоро здесь появятся заведения"}
          </p>
          {intro && <p className="mt-3 text-base leading-relaxed text-graphite/80">{intro}</p>}
        </div>
        {viewSwitch}
      </div>

      {partners.length > 0 && (
        <div className="sticky top-0 z-10 -mx-4 mt-6 flex flex-col gap-3 bg-cream/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
          <div className="relative max-w-[640px]">
            <SearchField
              inputRef={input}
              value={query}
              open={searching}
              activeIndex={activeIndex}
              onChange={(value) => {
                setQuery(value);
                setSearching(true);
              }}
              onFocus={() => setSearching(true)}
              onBlur={() => setSearching(false)}
              onKeyDown={onSearchKey}
            />
            {searching && (
              <div className="absolute inset-x-0 top-[calc(100%+8px)] z-20 flex max-h-[min(60vh,480px)] flex-col overflow-hidden rounded-[24px] bg-paper py-3 shadow-[0_24px_60px_rgb(22_21_21/0.22)]">
                <Suggestions
                  query={query}
                  result={result}
                  options={options}
                  activeIndex={activeIndex}
                  onHover={setActiveIndex}
                  onPick={choose}
                />
              </div>
            )}
          </div>
          {audienceCounts.length > 0 && (
            <div role="group" aria-label="Для кого" className="flex flex-wrap gap-2">
              {audienceCounts.map((item) => {
                const on = audience === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setAudience(on ? null : item.id)}
                    className={`rounded-full px-4 py-2 text-base font-semibold transition-colors ${
                      on ? "bg-graphite text-paper" : "bg-paper text-graphite hover:bg-smoke/40"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
          {categories.length > 0 && (
            <CategoryChips
              categories={category && !categories.some((item) => item.name === category) ? [...categories, { name: category }] : categories}
              value={category}
              onChange={() => undefined}
              hrefFor={(name) => (name ? categoryPath(categoryIdOf({ category: name })) : "/partners?view=catalog")}
              className="-mx-4 px-4 sm:-mx-6 sm:px-6"
            />
          )}
        </div>
      )}

      {prime && (
        // Проявляется, когда карточка выбрана: без скрипта видна сразу (noscript ниже)
        <div data-prime className={`mt-4 transition-opacity duration-300 ${roll === null ? "opacity-0" : "opacity-100"}`}>
          <noscript>
            <style>{"[data-prime]{opacity:1!important}"}</style>
          </noscript>
          <PrimeCard
            partner={prime}
            label={prime.maxCoveragePercent && prime.maxCoveragePercent === topPercent ? "Больше всего бонусами" : "В каталоге Loal"}
          />
        </div>
      )}

      {/* Число заведений категории уже под заголовком — здесь только результат поиска */}
      {query.trim() && (
        <p className="mt-4 text-base text-slate" aria-live="polite">
          {result.readAs && query.trim() ? `Ищем «${result.readAs}» · ` : ""}
          {shown.length > 0
            ? `${shown.length} ${plural(shown.length, "заведение", "заведения", "заведений")}`
            : "Ничего не нашлось"}
        </p>
      )}

      {grid.length > 0 && (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {grid.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </ul>
      )}

      {partners.length > 0 && shown.length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-4 rounded-[28px] bg-paper px-6 py-12 text-center">
          <p className="max-w-[44ch] text-lg text-slate">
            {category && !query.trim() && !audience
              ? `В «${category}» заведений пока нет — скоро появятся.`
              : "По этому запросу ничего нет. Попробуйте другое слово или категорию."}
          </p>
          <Link
            href="/partners?view=catalog"
            onClick={() => {
              setQuery("");
              setAudience(null);
            }}
            className="rounded-full bg-graphite px-6 py-3 text-base font-bold text-paper transition-colors hover:bg-flame"
          >
            Показать все заведения
          </Link>
        </div>
      )}

      <Link
        href="/become-partner"
        className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border-2 border-dashed border-smoke px-6 py-6 transition-colors hover:border-graphite sm:px-8"
      >
        <span>
          <span className="block text-xl font-bold">
            {partners.length > 0 ? "Ваше заведение тоже может быть здесь" : "Станьте первым заведением в каталоге"}
          </span>
          <span className="mt-1 block text-base text-slate">Регистрация бесплатная — кабинет открывается сразу.</span>
        </span>
        <span className="rounded-full bg-flame px-5 py-3 text-base font-bold text-white">Подключить заведение</span>
      </Link>
    </div>
  );
}
