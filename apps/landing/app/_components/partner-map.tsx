"use client";

import { useCallback, useState } from "react";
import type { Partner } from "../_data/partners";
import { Map2gis, use2gisMap } from "./map-2gis";
import { OsmMap } from "./osm-map";

// Map frame with the brand legend. 2GIS renders when its key is active; until then
// the OpenStreetMap map stands in (see osm-map.tsx).
export function PartnerMap({
  partners,
  activeId,
  onSelect,
}: {
  partners: Partner[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const active = partners.find((p) => p.id === activeId) ?? null;
  const [mapFailed, setMapFailed] = useState(false);
  const onFail = useCallback(() => setMapFailed(true), []);
  const use2gis = use2gisMap && !mapFailed;

  return (
    <div className="overflow-hidden rounded-[32px] border-2 border-graphite bg-paper">
      <div className="relative aspect-[4/5] sm:aspect-[4/3] lg:aspect-auto lg:h-[calc(100vh-13rem)] lg:min-h-[520px]">
        {use2gis ? (
          <Map2gis partners={partners} activeId={activeId} onSelect={onSelect} onFail={onFail} />
        ) : (
          <OsmMap partners={partners} activeId={activeId} onSelect={onSelect} />
        )}

        {active && (
          <div className="pointer-events-none absolute top-4 right-[4.5rem] left-4 rounded-2xl bg-graphite p-4 text-paper sm:top-auto sm:right-auto sm:bottom-4 sm:w-72">
            <p className="flex items-center gap-2 text-lg font-bold">
              {active.name}
              {active.octopay && (
                <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-flame-ink">OctōPAY</span>
              )}
            </p>
            <p className="mt-1 text-sm opacity-85">
              {active.address} · {active.hours}
            </p>
            <p className="display mt-2 text-3xl text-amber">до {active.percent}% бонусами</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t-2 border-cream px-5 py-4 text-sm">
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full rounded-bl-sm border-2 border-flame bg-flame-ink" />
          Списывает бонусы сам через OctōPAY
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full rounded-bl-sm border-2 border-flame-ink bg-paper" />
          Списывает по QR на кассе
        </span>
      </div>
    </div>
  );
}
