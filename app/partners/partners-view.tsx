"use client";

import { useMemo, useState } from "react";
import { categories, categoryOne, partners, type PartnerCategory } from "../_data/partners";
import { PartnerMap } from "../_components/partner-map";

type Filter = PartnerCategory | "all";

export function PartnersView() {
  const [filter, setFilter] = useState<Filter>("all");
  const [octopayOnly, setOctopayOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return partners.filter(
      (p) =>
        (filter === "all" || p.category === filter) &&
        (!octopayOnly || p.octopay) &&
        (q === "" || `${p.name} ${p.address} ${p.district} ${p.note}`.toLowerCase().includes(q)),
    );
  }, [filter, octopayOnly, query]);

  const counts = useMemo(
    () =>
      categories.reduce<Record<string, number>>(
        (acc, c) => ({ ...acc, [c.id]: partners.filter((p) => p.category === c.id).length }),
        {},
      ),
    [],
  );

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        <div className="flex flex-col gap-5 border-y-2 border-blush py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Категории партнёров">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
              Все ({partners.length})
            </FilterChip>
            {categories.map((c) => (
              <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
                {c.label} ({counts[c.id]})
              </FilterChip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-3 font-medium">
              <input
                type="checkbox"
                checked={octopayOnly}
                onChange={(e) => setOctopayOnly(e.target.checked)}
                className="h-5 w-5 accent-[var(--magenta-ink)]"
              />
              Только с OctōPAY
            </label>
            <label className="flex-1 lg:flex-none">
              <span className="sr-only">Поиск по названию или адресу</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Название или улица"
                className="w-full rounded-full border-2 border-blush px-5 py-2.5 focus-visible:border-magenta focus-visible:outline-none lg:w-64"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-10 sm:px-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <ol className="flex flex-col gap-4">
          {visible.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseEnter={() => setActiveId(p.id)}
                onMouseLeave={() => setActiveId((id) => (id === p.id ? null : id))}
                onFocus={() => setActiveId(p.id)}
                onClick={() => setActiveId(p.id)}
                className={`flex w-full items-start gap-5 rounded-[24px] border-2 p-5 text-left transition-colors sm:p-6 ${
                  activeId === p.id ? "border-magenta bg-blush/50" : "border-blush hover:border-bubblegum"
                }`}
              >
                <span className="flex flex-col items-center gap-1">
                  <span className="display text-4xl text-magenta sm:text-5xl">{p.percent}%</span>
                  <span className="text-xs font-medium opacity-70">бонусами</span>
                </span>
                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-xl font-bold">{p.name}</span>
                    {p.octopay && (
                      <span className="rounded-full bg-magenta-ink px-2.5 py-0.5 text-xs font-bold text-chalk">
                        OctōPAY
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block opacity-80">{p.note}</span>
                  <span className="mt-3 block text-sm">
                    {categoryOne(p.category)} · {p.address} · {p.hours}
                  </span>
                </span>
              </button>
            </li>
          ))}

          {visible.length === 0 && (
            <li className="rounded-[24px] border-2 border-dashed border-blush p-8 text-center">
              <p className="text-xl font-bold">Здесь пока никого нет</p>
              <p className="mt-2 opacity-80">Снимите фильтры или поищите по другой улице.</p>
              <button
                type="button"
                onClick={() => {
                  setFilter("all");
                  setOctopayOnly(false);
                  setQuery("");
                }}
                className="mt-5 rounded-[10px] bg-magenta-ink px-6 py-3 font-bold text-chalk transition-colors hover:bg-forest"
              >
                Показать всех
              </button>
            </li>
          )}
        </ol>

        <div className="lg:sticky lg:top-6">
          <PartnerMap partners={visible} activeId={activeId} onSelect={setActiveId} />
        </div>
      </div>
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-colors ${
        active ? "border-forest bg-forest text-chalk" : "border-blush hover:border-bubblegum"
      }`}
    >
      {children}
    </button>
  );
}
