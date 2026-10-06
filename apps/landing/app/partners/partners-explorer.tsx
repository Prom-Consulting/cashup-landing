"use client";

import type { PublicPartner } from "@loal/api";
import type { PaddingOptions } from "maplibre-gl";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { partnerPath } from "../_data/seo";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PartnersCatalog } from "./partners-catalog";
import { PartnersPanel, type PanelLayout } from "./partners-panel";

// MapLibre работает только в браузере — на сервере вместо карты тёплая подложка
const PartnerMap = dynamic(() => import("./partner-map").then((module) => module.PartnerMap), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-cream" />,
});

type View = "catalog" | "map";

/** Вид помним в адресе (?view=map): ссылку на карту можно отправить, «назад» возвращает в каталог. */
function useView(): [View, (next: View) => void] {
  const [view, setViewState] = useState<View>("catalog");
  useEffect(() => {
    const read = () => setViewState(new URLSearchParams(window.location.search).get("view") === "map" ? "map" : "catalog");
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);
  const setView = (next: View) => {
    if (next === view) return;
    const url = new URL(window.location.href);
    if (next === "map") url.searchParams.set("view", "map");
    else url.searchParams.delete("view");
    window.history.pushState(null, "", url);
    setViewState(next);
    window.scrollTo({ top: 0 });
  };
  return [view, setView];
}

function ViewSwitch({ view, onChange, floating = false }: { view: View; onChange: (next: View) => void; floating?: boolean }) {
  return (
    <div
      role="group"
      aria-label="Как показать заведения"
      className={`inline-flex shrink-0 rounded-full p-1 ${floating ? "bg-paper/95 shadow-[0_8px_24px_rgb(22_21_21/0.18)] backdrop-blur" : "bg-paper ring-1 ring-smoke"}`}
    >
      {(
        [
          { value: "catalog", label: "Каталог", path: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
          { value: "map", label: "Карта", path: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" },
        ] as const
      ).map((item) => {
        const active = view === item.value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-base font-bold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-flame ${
              active ? "bg-graphite text-paper" : "text-graphite hover:bg-cream"
            }`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
              <path d={item.path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Каталог заведений: по умолчанию — витрина как на маркетплейсе, по желанию — карта Бишкека
 * со списком на ней. Карточка заведения открывается одинаково из обоих видов.
 */
export function PartnersExplorer({ partners }: { partners: PublicPartner[] }) {
  const [view, setView] = useView();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ id: string; at: number } | null>(null);
  const [layout, setLayout] = useState<PanelLayout>({ kind: "side", right: 424 });
  const section = useRef<HTMLElement>(null);

  const padding: PaddingOptions =
    layout.kind === "side"
      ? { top: 120, bottom: 90, left: layout.right + 60, right: 110 }
      : { top: 120, bottom: layout.height + 50, left: 40, right: 80 };

  const pick = (partner: PublicPartner) => {
    setSelectedId(partner.id);
    // Повторный выбор той же точки тоже подлетает к ней
    setFocus({ id: partner.id, at: Date.now() });
  };

  // Щипок над картой масштабирует карту, а не весь сайт: Safari (gesture*) и тачпад (ctrl + колесо)
  useEffect(() => {
    const element = section.current;
    if (view !== "map" || !element) return;
    const stop = (event: Event) => event.preventDefault();
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey && !(event.target as HTMLElement).closest(".maplibregl-canvas-container, .maplibregl-canvas"))
        event.preventDefault();
    };
    element.addEventListener("gesturestart", stop);
    element.addEventListener("gesturechange", stop);
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      element.removeEventListener("gesturestart", stop);
      element.removeEventListener("gesturechange", stop);
      element.removeEventListener("wheel", onWheel);
    };
  }, [view]);

  // Со страницы заведения «Показать на карте» — ?view=map&focus=<id>: карта сразу подлетает к нему
  useEffect(() => {
    if (view !== "map") return;
    const id = new URLSearchParams(window.location.search).get("focus");
    const partner = id ? partners.find((item) => item.id === id) : null;
    if (partner) pick(partner);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, partners]);

  if (view === "catalog")
    return (
      <div data-view="catalog">
        <PartnersCatalog partners={partners} viewSwitch={<ViewSwitch view={view} onChange={setView} />} />
      </div>
    );

  return (
    <section
      ref={section}
      data-view="map"
      aria-label="Карта заведений"
      style={{ "--sheet": layout.kind === "sheet" ? `${layout.height}px` : "0px" } as CSSProperties}
      className="relative h-[calc(100dvh-88px)] min-h-[520px] overflow-hidden [touch-action:pan-x_pan-y] bg-cream sm:h-[calc(100svh-100px)]"
    >
      <PartnerMap
        partners={partners}
        activeId={hoveredId ?? selectedId}
        focusId={focus ? `${focus.id}` : null}
        focusKey={focus?.at ?? 0}
        padding={padding}
        onSelect={pick}
      />
      <div className="absolute top-4 right-4 z-30 md:top-6 md:right-6">
        <ViewSwitch view={view} onChange={setView} floating />
      </div>
      <PartnersPanel
        partners={partners}
        selectedId={selectedId}
        onHover={setHoveredId}
        onPick={pick}
        onLayout={setLayout}
        onOpen={(partner) => router.push(partnerPath(partner))}
      />
    </section>
  );
}
