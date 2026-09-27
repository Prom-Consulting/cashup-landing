"use client";

import type { PublicPartner } from "@loal/api";
import { Map as MapLibreMap, Marker, type MapOptions, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { CITY_CENTER, coordsOf } from "../_data/partner-coords";

// Карта на тайлах OpenStreetMap через MapLibre. Атрибуция OSM остаётся видимой — это условие лицензии.
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
    { id: "bg", type: "background", paint: { "background-color": "#fcf9f9" } },
    { id: "osm", type: "raster", source: "osm" },
  ],
};

const escape = (text: string) => text.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** Точка: процент, если заведение его задало, иначе первая буква названия. */
const pinHtml = (partner: PublicPartner) =>
  `<span class="map-pin map-pin--brand" title="${escape(partner.name)}">${
    partner.maxCoveragePercent ? `${partner.maxCoveragePercent}%` : escape(partner.name.slice(0, 1).toUpperCase())
  }</span>`;

export function PartnerMap({
  partners,
  onOpen,
}: {
  partners: PublicPartner[];
  onOpen: (partner: PublicPartner) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const openRef = useRef(onOpen);
  openRef.current = onOpen;

  useEffect(() => {
    if (!container.current) return;
    const instance = new MapLibreMap({
      container: container.current,
      style,
      center: CITY_CENTER,
      zoom: 12.3,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      // Колесо над картой на весь экран не должно воровать прокрутку страницы
      scrollZoom: false,
      cooperativeGestures: false,
    } as MapOptions);
    instance.touchZoomRotate.disableRotation();
    map.current = instance;
    instance.once("load", () => setReady(true));
    const observer = new ResizeObserver(() => instance.resize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !map.current) return;
    const placed = partners.flatMap((partner) => {
      const coords = coordsOf(partner);
      return coords ? [{ partner, coords }] : [];
    });
    const markers = placed.map(({ partner, coords }) => {
      const element = document.createElement("div");
      element.innerHTML = pinHtml(partner);
      element.addEventListener("click", () => openRef.current(partner));
      return new Marker({ element, anchor: "bottom" }).setLngLat(coords).addTo(map.current!);
    });
    // Все точки в кадре, но не под плашкой с заголовком: слева на широком экране, сверху на узком
    const wide = (container.current?.clientWidth ?? 0) >= 900;
    const padding = wide
      ? { top: 90, bottom: 90, left: 560, right: 110 }
      : { top: 360, bottom: 70, left: 50, right: 80 };
    if (placed.length > 1) {
      const lngs = placed.map((p) => p.coords[0]);
      const lats = placed.map((p) => p.coords[1]);
      map.current.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding, maxZoom: 14, duration: 0 },
      );
    } else if (placed.length === 1) map.current.jumpTo({ center: placed[0]!.coords, zoom: 14, padding });
    return () => markers.forEach((marker) => marker.remove());
  }, [partners, ready]);

  const zoomBy = (delta: number) => map.current?.easeTo({ zoom: map.current.getZoom() + delta, duration: 250 });

  return (
    <>
      <div className="absolute inset-0">
        <div ref={container} className="map-osm h-full w-full" />
      </div>
      <div className="absolute right-5 bottom-8 z-10 flex flex-col gap-2 sm:right-12">
        {[
          { label: "Приблизить", sign: "+", delta: 1 },
          { label: "Отдалить", sign: "−", delta: -1 },
        ].map((button) => (
          <button
            key={button.label}
            type="button"
            onClick={() => zoomBy(button.delta)}
            aria-label={button.label}
            className="grid h-12 w-12 place-items-center rounded-full bg-paper text-2xl leading-none font-bold shadow-[0_8px_24px_rgb(22_21_21/0.18)] transition-colors hover:bg-graphite hover:text-paper"
          >
            {button.sign}
          </button>
        ))}
      </div>
    </>
  );
}
