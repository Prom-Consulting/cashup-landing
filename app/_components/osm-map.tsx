"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, Marker, type MapOptions, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { CITY_CENTER, type Partner } from "../_data/partners";

// Temporary live map on OpenStreetMap tiles, used while the 2GIS key is inactive.
// TODO: remove once the 2GIS key works — OSM's tile policy does not cover production traffic.
// Attribution stays visible: OSM requires it.

const style: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#fff8f6" } },
    { id: "osm", type: "raster", source: "osm" },
  ],
};

const pinHtml = (p: Partner, active: boolean) =>
  `<span class="map-pin ${active ? "map-pin--active" : p.octopay ? "map-pin--octopay" : "map-pin--plain"}">${p.percent}%</span>`;

export function OsmMap({
  partners,
  activeId,
  onSelect,
}: {
  partners: Partner[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markers = useRef<globalThis.Map<string, Marker>>(new globalThis.Map());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!container.current) return;
    const instance = new MapLibreMap({
      container: container.current,
      style,
      center: CITY_CENTER,
      zoom: 12.2,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    } as MapOptions);
    instance.touchZoomRotate.disableRotation();
    map.current = instance;
    instance.once("load", () => setReady(true));

    return () => {
      markers.current.forEach((m) => m.remove());
      markers.current.clear();
      instance.remove();
      map.current = null;
    };
  }, []);

  // Markers follow the filtered list; only changed pins are touched.
  useEffect(() => {
    if (!ready || !map.current) return;
    const wanted = new Set(partners.map((p) => p.id));

    markers.current.forEach((marker, id) => {
      if (!wanted.has(id)) {
        marker.remove();
        markers.current.delete(id);
      }
    });

    for (const p of partners) {
      const existing = markers.current.get(p.id);
      const active = activeId === p.id;
      if (existing) {
        existing.getElement().innerHTML = pinHtml(p, active);
        continue;
      }
      const el = document.createElement("div");
      el.innerHTML = pinHtml(p, active);
      el.addEventListener("click", () => onSelect(activeId === p.id ? null : p.id));
      el.addEventListener("mouseenter", () => onSelect(p.id));
      markers.current.set(
        p.id,
        new Marker({ element: el, anchor: "bottom" }).setLngLat(p.coords).addTo(map.current),
      );
    }
  }, [partners, activeId, ready, onSelect]);

  // Centre on the partner the visitor is pointing at.
  useEffect(() => {
    const partner = partners.find((p) => p.id === activeId);
    if (!ready || !partner || !map.current) return;
    map.current.easeTo({ center: partner.coords, duration: 400 });
  }, [activeId, partners, ready]);

  const zoomBy = (delta: number) => map.current?.easeTo({ zoom: map.current.getZoom() + delta, duration: 250 });

  return (
    <>
      {/* MapLibre's own CSS sets position on the container, so sizing lives on the wrapper */}
      <div className="absolute inset-0">
        <div ref={container} className="map-osm h-full w-full" />
      </div>
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
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
