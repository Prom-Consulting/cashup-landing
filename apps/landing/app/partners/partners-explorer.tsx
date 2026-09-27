"use client";

import type { PublicPartner } from "@loal/api";
import type { PaddingOptions } from "maplibre-gl";
import dynamic from "next/dynamic";
import { useState, type CSSProperties } from "react";
import { PartnerDialog } from "./partner-dialog";
import { PartnersPanel, type PanelLayout } from "./partners-panel";

// MapLibre работает только в браузере — на сервере вместо карты тёплая подложка
const PartnerMap = dynamic(() => import("./partner-map").then((module) => module.PartnerMap), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-cream" />,
});

/**
 * Каталог — карта Бишкека на весь экран, список заведений прямо на ней. Точка на карте
 * и строка в списке — одно и то же: выбор в одном месте подсвечивает и приближает другое.
 */
export function PartnersExplorer({ partners }: { partners: PublicPartner[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ id: string; at: number } | null>(null);
  const [opened, setOpened] = useState<PublicPartner | null>(null);
  const [layout, setLayout] = useState<PanelLayout>({ kind: "side", right: 424 });

  const padding: PaddingOptions =
    layout.kind === "side"
      ? { top: 90, bottom: 90, left: layout.right + 60, right: 110 }
      : { top: 70, bottom: layout.height + 50, left: 40, right: 80 };

  const pick = (partner: PublicPartner) => {
    setSelectedId(partner.id);
    // Повторный выбор той же точки тоже подлетает к ней
    setFocus({ id: partner.id, at: Date.now() });
  };

  return (
    <section
      aria-label="Карта заведений"
      style={{ "--sheet": layout.kind === "sheet" ? `${layout.height}px` : "0px" } as CSSProperties}
      className="relative h-[calc(100svh-88px)] min-h-[560px] overflow-hidden bg-cream sm:h-[calc(100svh-100px)]"
    >
      <PartnerMap
        partners={partners}
        activeId={hoveredId ?? selectedId}
        focusId={focus ? `${focus.id}` : null}
        focusKey={focus?.at ?? 0}
        padding={padding}
        onSelect={pick}
      />
      <PartnersPanel
        partners={partners}
        selectedId={selectedId}
        onHover={setHoveredId}
        onPick={pick}
        onOpen={setOpened}
        onLayout={setLayout}
      />
      <PartnerDialog partner={opened} onClose={() => setOpened(null)} />
    </section>
  );
}
