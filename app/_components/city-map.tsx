"use client";

import { CITY_CENTER, type Partner } from "../_data/partners";
import { PartnerPin } from "./partner-pin";

// Stylised Bishkek map in the brand palette. Used until a 2GIS key is configured,
// and as the fallback if the 2GIS script cannot load.

const BBOX = { minLon: 74.53, maxLon: 74.66, minLat: 42.83, maxLat: 42.9 };

export const project = (coords: [number, number]) => ({
  left: ((coords[0] - BBOX.minLon) / (BBOX.maxLon - BBOX.minLon)) * 100,
  top: ((BBOX.maxLat - coords[1]) / (BBOX.maxLat - BBOX.minLat)) * 100,
});

const avenues = [18, 32, 46, 60, 74, 88];
const streets = [12, 26, 40, 54, 68, 82, 94];

export function CityMap({
  partners,
  activeId,
  onSelect,
}: {
  partners: Partner[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const center = project(CITY_CENTER);

  return (
    <div className="absolute inset-0 overflow-hidden bg-blush/60">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
        {/* кварталы */}
        {avenues.map((x) => (
          <line key={`a${x}`} x1={x} y1="0" x2={x - 4} y2="100" stroke="var(--chalk)" strokeWidth="1.6" />
        ))}
        {streets.map((y) => (
          <line key={`s${y}`} x1="0" y1={y} x2="100" y2={y - 2} stroke="var(--chalk)" strokeWidth="1.2" />
        ))}
        {/* проспекты */}
        <line x1="0" y1="40" x2="100" y2="38" stroke="var(--chalk)" strokeWidth="3.4" />
        <line x1="46" y1="0" x2="40" y2="100" stroke="var(--chalk)" strokeWidth="3.4" />
        {/* парк */}
        <path d="M52 44h16v14H52z" fill="var(--bubblegum)" opacity="0.45" />
        <path d="M8 62h13v18H8z" fill="var(--bubblegum)" opacity="0.35" />
        {/* река Ала-Арча */}
        <path
          d="M30 -2C28 18 24 30 26 48 28 66 22 82 24 102"
          fill="none"
          stroke="var(--lilac)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>

      <p className="pointer-events-none absolute top-4 left-5 text-sm font-medium opacity-70">Бишкек</p>
      <p className="pointer-events-none absolute bottom-4 left-5 max-w-[22ch] text-xs opacity-60">
        Схема города. Точные адреса — в карточках партнёров.
      </p>

      <span
        aria-hidden="true"
        className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-forest/30"
        style={{ left: `${center.left}%`, top: `${center.top}%` }}
      />

      {partners.map((p) => {
        const pos = project(p.coords);
        return (
          <PartnerPin
            key={p.id}
            partner={p}
            active={activeId === p.id}
            onSelect={onSelect}
            style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
            className="absolute -translate-x-1/2 -translate-y-full"
          />
        );
      })}
    </div>
  );
}
