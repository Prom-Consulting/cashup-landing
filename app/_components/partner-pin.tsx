"use client";

import type { CSSProperties } from "react";
import type { Partner } from "../_data/partners";

// Branded map pin: the partner percent sits inside the drop, OctōPAY partners get a filled mark.
export function PartnerPin({
  partner,
  active,
  onSelect,
  style,
  className = "",
}: {
  partner: Partner;
  active: boolean;
  onSelect: (id: string | null) => void;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-pin={partner.id}
      style={style}
      onClick={() => onSelect(active ? null : partner.id)}
      onMouseEnter={() => onSelect(partner.id)}
      onFocus={() => onSelect(partner.id)}
      aria-pressed={active}
      className={`group z-10 origin-bottom transition-transform duration-200 hover:scale-110 focus-visible:scale-110 ${
        active ? "z-20 scale-110" : ""
      } ${className}`}
    >
      <span className="sr-only">
        {partner.name}, {partner.address}, до {partner.percent}% бонусами
      </span>
      <span
        aria-hidden="true"
        className={`flex h-11 min-w-11 items-center justify-center rounded-full rounded-bl-md border-2 px-2 font-bold shadow-sm transition-colors ${
          active
            ? "border-graphite bg-graphite text-paper"
            : partner.octopay
              ? "border-flame bg-flame-ink text-paper"
              : "border-flame-ink bg-paper text-flame-ink"
        }`}
      >
        {partner.percent}%
      </span>
    </button>
  );
}
