"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { categories, categoryOne, partners, type PartnerCategory } from "../_data/partners";
import { PartnerMap } from "../_components/partner-map";
import { Button, Checkbox, SearchInput } from "../_components/ui/inputs";

type Filter = PartnerCategory | "all";

export function PartnersView() {
  const [filter, setFilter] = useState<Filter>("all");
  const [octopayOnly, setOctopayOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Hover highlighting is for mice only: on touch it would fight with tapping.
  const hoverable = () => window.matchMedia("(hover: hover)").matches;

  // On phones the map sits under the list, so picking a place scrolls to it.
  const selectAndShow = useCallback((id: string) => {
    setActiveId(id);
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    mapRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
    });
  }, []);

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
        <div className="flex flex-col gap-5 border-y-2 border-cream py-6 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:-mx-10 sm:px-10 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0"
            role="group"
            aria-label="Категории партнёров"
          >
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
              Все ({partners.length})
            </FilterChip>
            {categories.map((c) => (
              <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
                {c.label} ({counts[c.id]})
              </FilterChip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Checkbox checked={octopayOnly} onChange={setOctopayOnly}>
              Только с OctōPAY
            </Checkbox>
            <SearchInput
              value={query}
              onValueChange={setQuery}
              label="Поиск по названию или адресу"
              placeholder="Название или улица"
              className="w-full sm:flex-1 lg:w-64 lg:flex-none"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-10 sm:px-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <ol className="flex flex-col gap-4">
          {visible.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseEnter={() => hoverable() && setActiveId(p.id)}
                onMouseLeave={() => hoverable() && setActiveId((id) => (id === p.id ? null : id))}
                onFocus={() => hoverable() && setActiveId(p.id)}
                onClick={() => selectAndShow(p.id)}
                className={`flex w-full items-start gap-5 rounded-[24px] border-2 p-5 text-left transition-colors sm:p-6 ${
                  activeId === p.id ? "border-flame bg-cream/50" : "border-cream hover:border-amber"
                }`}
              >
                <span className="flex flex-col items-center gap-1">
                  <span className="display text-4xl text-flame sm:text-5xl">{p.percent}%</span>
                  <span className="text-xs font-medium opacity-70">бонусами</span>
                </span>
                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-xl font-bold">{p.name}</span>
                    {p.octopay && (
                      <span className="rounded-full bg-flame-ink px-2.5 py-0.5 text-xs font-bold text-paper">
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
            <li className="rounded-[24px] border-2 border-dashed border-cream p-8 text-center">
              <p className="text-xl font-bold">Здесь пока никого нет</p>
              <p className="mt-2 opacity-80">Снимите фильтры или поищите по другой улице.</p>
              <Button
                type="button"
                className="mt-5"
                onClick={() => {
                  setFilter("all");
                  setOctopayOnly(false);
                  setQuery("");
                }}
              >
                Показать всех
              </Button>
            </li>
          )}
        </ol>

        <div id="partner-map" ref={mapRef} className="scroll-mt-4 lg:sticky lg:top-6">
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
      className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
        active ? "border-graphite bg-graphite text-paper" : "border-cream hover:border-amber"
      }`}
    >
      {children}
    </button>
  );
}
