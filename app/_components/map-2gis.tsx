"use client";

import { useEffect, useRef, useState } from "react";
import { load } from "@2gis/mapgl";
import { CITY_CENTER, type Partner } from "../_data/partners";

// 2GIS map with branded HtmlMarkers. Runs only when NEXT_PUBLIC_2GIS_KEY is set;
// without a key 2GIS serves no tiles, so PartnerMap falls back to the stylised city plan.
// The 2GIS copyright control stays on: the licence forbids hiding it.

type MapInstance = {
  destroy: () => void;
  setCenter: (c: number[], opts?: object) => void;
  setZoom: (z: number, opts?: object) => void;
  getZoom: () => number;
  invalidateSize: () => void;
};
type MarkerInstance = { destroy: () => void; getContent: () => HTMLElement };

// Демо-ключ 2GIS MapGL. Ключ браузерный: он всё равно виден в коде страницы,
// защита делается ограничением по домену в Platform Manager.
// Боевой ключ можно подставить через NEXT_PUBLIC_2GIS_KEY в .env.local.
const DEMO_KEY = "31a80936-96f1-4fa3-97ae-33ced1869595";
const KEY = process.env.NEXT_PUBLIC_2GIS_KEY || DEMO_KEY;
const STYLE = process.env.NEXT_PUBLIC_2GIS_STYLE;

export const has2gisKey = Boolean(KEY);

const pinHtml = (p: Partner, active: boolean) => `
  <span class="map-pin ${active ? "map-pin--active" : p.octopay ? "map-pin--octopay" : "map-pin--plain"}">
    ${p.percent}%
  </span>`;

export function Map2gis({
  partners,
  activeId,
  onSelect,
  onFail,
}: {
  partners: Partner[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onFail: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapInstance | null>(null);
  const markers = useRef<Map<string, MarkerInstance>>(new Map());
  const api = useRef<Awaited<ReturnType<typeof load>> | null>(null);
  const [ready, setReady] = useState(false);

  // Map instance: created once, destroyed on unmount (StrictMode-safe via the cancelled flag).
  // 2GIS renders a grey "key is invalid" plate for an expired key, so the key is checked first
  // and the page falls back to the stylised city plan instead.
  useEffect(() => {
    let cancelled = false;
    const keyIsLive = fetch(`https://keys.api.2gis.com/public/v1/keys/${KEY}/services/mapgl-js-api`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => json?.result?.is_active === true)
      .catch(() => false);

    Promise.all([keyIsLive, load()])
      .then(([live, mapgl]) => {
        if (cancelled || !container.current) return;
        if (!live) {
          onFail();
          return;
        }
        api.current = mapgl;
        map.current = new mapgl.Map(container.current, {
          center: CITY_CENTER,
          zoom: 12.4,
          key: KEY!,
          ...(STYLE ? { style: STYLE } : {}),
          zoomControl: false,
          copyright: "bottomLeft",
          enableTrackResize: true,
          disableRotationByUserInteraction: true,
          disablePitchByUserInteraction: true,
        }) as unknown as MapInstance;
        setReady(true);
      })
      .catch(onFail);

    return () => {
      cancelled = true;
      markers.current.forEach((m) => m.destroy());
      markers.current.clear();
      map.current?.destroy();
      map.current = null;
    };
  }, [onFail]);

  // Markers follow the filtered list; only changed pins are recreated.
  useEffect(() => {
    if (!ready || !api.current || !map.current) return;
    const mapgl = api.current;
    const wanted = new Set(partners.map((p) => p.id));

    markers.current.forEach((marker, id) => {
      if (!wanted.has(id)) {
        marker.destroy();
        markers.current.delete(id);
      }
    });

    for (const p of partners) {
      const existing = markers.current.get(p.id);
      const active = activeId === p.id;
      if (existing) {
        existing.getContent().innerHTML = pinHtml(p, active);
        continue;
      }
      const el = document.createElement("div");
      el.innerHTML = pinHtml(p, active);
      el.addEventListener("click", () => onSelect(activeId === p.id ? null : p.id));
      el.addEventListener("mouseenter", () => onSelect(p.id));
      const marker = new mapgl.HtmlMarker(map.current as never, {
        coordinates: p.coords,
        html: el,
        anchor: [22, 44],
        labeling: { type: "none" },
      }) as unknown as MarkerInstance;
      markers.current.set(p.id, marker);
    }
  }, [partners, activeId, ready, onSelect]);

  // Centre on the partner the visitor is pointing at.
  useEffect(() => {
    const partner = partners.find((p) => p.id === activeId);
    if (!ready || !partner || !map.current) return;
    map.current.setCenter(partner.coords, { duration: 400 });
  }, [activeId, partners, ready]);

  const zoomBy = (delta: number) => {
    if (!map.current) return;
    map.current.setZoom(map.current.getZoom() + delta, { duration: 250 });
  };

  return (
    <>
      <div ref={container} className="absolute inset-0" />
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {[
          { label: "Приблизить", sign: "+", delta: 1 },
          { label: "Отдалить", sign: "−", delta: -1 },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            onClick={() => zoomBy(b.delta)}
            aria-label={b.label}
            className="grid h-11 w-11 place-items-center rounded-full border-2 border-forest bg-chalk text-2xl leading-none font-bold transition-colors hover:bg-forest hover:text-chalk"
          >
            {b.sign}
          </button>
        ))}
      </div>
    </>
  );
}
