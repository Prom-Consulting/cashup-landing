"use client";

import type { PublicPartner } from "@loal/api";
import { Map as MapLibreMap, Marker, type MapOptions, type PaddingOptions, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { CITY_CENTER, coordsOf } from "../_data/partner-coords";
import { monogram } from "../_data/partners-api";

// OpenStreetMap через MapLibre, приглушённая до тёплого серого: на ней горят только
// оранжевые точки заведений. Атрибуция OSM остаётся видимой — это условие лицензии.
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
    { id: "bg", type: "background", paint: { "background-color": "#f4efed" } },
    {
      id: "osm",
      type: "raster",
      source: "osm",
      paint: {
        "raster-saturation": -0.82,
        "raster-contrast": -0.08,
        "raster-brightness-min": 0.1,
        "raster-opacity": 0.9,
      },
    },
  ],
};

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Точку собираем из элементов, а не строкой HTML: название и фото приходят от заведения. */
function pinElement(partner: PublicPartner, index: number, onClick: () => void) {
  const make = (tag: string, className: string) => {
    const element = document.createElement(tag);
    element.className = className;
    return element;
  };
  const root = make("button", "loal-pin") as HTMLButtonElement;
  root.type = "button";
  root.style.setProperty("--i", String(index));
  root.setAttribute(
    "aria-label",
    `${partner.name}${partner.maxCoveragePercent ? `, до ${partner.maxCoveragePercent}% бонусами` : ""}`,
  );
  root.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });

  const drop = make("span", "loal-pin__drop");
  const lift = make("span", "loal-pin__lift");
  const face = make("span", "loal-pin__face");
  const image = partner.photos[0] ?? partner.logoUrl;
  if (image) {
    const img = make("img", "loal-pin__img") as HTMLImageElement;
    img.src = image;
    img.alt = "";
    img.decoding = "async";
    face.append(img);
  } else {
    const letters = make("span", "loal-pin__img");
    letters.textContent = monogram(partner.name);
    face.append(letters);
  }
  lift.append(make("span", "loal-pin__halo"), make("span", "loal-pin__tail"), face);
  if (partner.maxCoveragePercent) {
    const badge = make("span", "loal-pin__badge");
    badge.textContent = `${partner.maxCoveragePercent}%`;
    lift.append(badge);
  }
  drop.append(make("span", "loal-pin__ripple"), lift);
  root.append(drop);
  return root;
}

export function PartnerMap({
  partners,
  activeId,
  focusId,
  focusKey,
  padding,
  onSelect,
}: {
  partners: PublicPartner[];
  /** Подсвеченная точка: выбранная или та, над строкой которой держат курсор. */
  activeId: string | null;
  /** К какой точке подлететь: меняется при выборе в списке. */
  focusId: string | null;
  /** Меняется при каждом выборе — чтобы повторный клик по той же точке тоже подлетал. */
  focusKey: number;
  /** Где панель со списком — туда карта точки не ставит. */
  padding: PaddingOptions;
  onSelect: (partner: PublicPartner) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markers = useRef(new Map<string, Marker>());
  const [ready, setReady] = useState(false);
  const select = useRef(onSelect);
  select.current = onSelect;
  const paddingRef = useRef(padding);
  paddingRef.current = padding;

  useEffect(() => {
    if (!container.current) return;
    const instance = new MapLibreMap({
      container: container.current,
      style,
      // Начинаем с города целиком — потом облёт к заведениям
      center: CITY_CENTER,
      zoom: 10.6,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      // Колесо над картой на весь экран не должно воровать прокрутку страницы
      scrollZoom: false,
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

  // Облёт к заведениям, и только потом точки падают на карту — по очереди
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    const placed = partners.flatMap((partner) => {
      const coords = coordsOf(partner);
      return coords ? [{ partner, coords }] : [];
    });
    const still = reducedMotion();
    let cancelled = false;

    const drop = () => {
      if (cancelled) return;
      placed.forEach(({ partner, coords }, index) => {
        const element = pinElement(partner, index, () => select.current(partner));
        const marker = new Marker({ element, anchor: "bottom" }).setLngLat(coords).addTo(instance);
        markers.current.set(partner.id, marker);
      });
    };

    if (placed.length === 0) {
      instance.easeTo({ zoom: 12.2, duration: still ? 0 : 1600 });
    } else {
      const lngs = placed.map((item) => item.coords[0]);
      const lats = placed.map((item) => item.coords[1]);
      instance.once("moveend", drop);
      instance.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        {
          padding: paddingRef.current,
          maxZoom: placed.length === 1 ? 15 : 14.5,
          duration: still ? 0 : 2200,
          curve: 1.6,
        },
      );
    }

    return () => {
      cancelled = true;
      instance.off("moveend", drop);
      markers.current.forEach((marker) => marker.remove());
      markers.current.clear();
    };
  }, [partners, ready]);

  useEffect(() => {
    markers.current.forEach((marker, id) => marker.getElement().classList.toggle("is-active", id === activeId));
  }, [activeId, partners, ready]);

  useEffect(() => {
    const marker = focusId ? markers.current.get(focusId) : null;
    if (!marker || !map.current) return;
    map.current.flyTo({
      center: marker.getLngLat(),
      zoom: Math.max(map.current.getZoom(), 15),
      padding: paddingRef.current,
      duration: reducedMotion() ? 0 : 1100,
      essential: true,
    });
  }, [focusId, focusKey]);

  const zoomBy = (delta: number) => map.current?.easeTo({ zoom: map.current.getZoom() + delta, duration: 250 });

  return (
    <>
      <div className="absolute inset-0">
        <div ref={container} className="map-osm h-full w-full" />
      </div>
      <div className="absolute right-5 bottom-[calc(var(--sheet,0px)+2rem)] z-10 flex flex-col gap-2 md:bottom-8 md:right-8">
        {[
          { label: "Приблизить", path: "M12 5v14M5 12h14", delta: 1 },
          { label: "Отдалить", path: "M5 12h14", delta: -1 },
        ].map((button) => (
          <button
            key={button.label}
            type="button"
            onClick={() => zoomBy(button.delta)}
            aria-label={button.label}
            className="grid h-12 w-12 place-items-center rounded-full bg-paper shadow-[0_8px_24px_rgb(22_21_21/0.18)] transition-colors hover:bg-graphite hover:text-paper"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
              <path d={button.path} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </button>
        ))}
      </div>
    </>
  );
}
