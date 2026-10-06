"use client";

import type { PublicPartner } from "@loal/api";
import { Map as MapLibreMap, Marker, type MapOptions, type PaddingOptions } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { mapStyle as style } from "../_data/map-style";
import { CITY_CENTER, coordsOf } from "../_data/partner-coords";
import { monogram } from "../_data/partners-api";
import { fitLogo, partnerAvatar } from "./logo-fit";

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

  const spread = make("span", "loal-pin__spread");
  const drop = make("span", "loal-pin__drop");
  const lift = make("span", "loal-pin__lift");
  const face = make("span", "loal-pin__face");
  const image = partnerAvatar(partner);
  if (image) {
    const img = make("img", "loal-pin__img") as HTMLImageElement;
    img.crossOrigin = "anonymous";
    img.src = image;
    fitLogo(img);
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
  spread.append(drop);
  root.append(spread);
  return root;
}

// Точка — 64×80 px: ближе этого по любой оси карточки налезают друг на друга
const CLUSTER_PX = 78;
/** С этого приближения близкие точки больше не собираем — раскладываем веером. */
const SPREAD_ZOOM = 17;

/** Кружок «несколько заведений здесь»: число и лучший процент; клик приближает к ним. */
function clusterElement(group: PublicPartner[], onClick: () => void) {
  // Корень двигает MapLibre (transform), поэтому вид и анимации — во внутреннем слое
  const root = document.createElement("button");
  root.type = "button";
  root.className = "loal-cluster";
  const best = Math.max(0, ...group.map((partner) => partner.maxCoveragePercent ?? 0));
  root.setAttribute("aria-label", `${group.length} заведений рядом — приблизить`);
  const body = document.createElement("span");
  body.className = "loal-cluster__body";
  const count = document.createElement("span");
  count.className = "loal-cluster__count";
  count.textContent = String(group.length);
  body.append(count);
  if (best) {
    const badge = document.createElement("span");
    badge.className = "loal-cluster__badge";
    badge.textContent = `до ${best}%`;
    body.append(badge);
  }
  root.append(body);
  root.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
  return root;
}

export function PartnerMap({
  partners,
  activeId,
  selectedId,
  focusId,
  focusKey,
  padding,
  onSelect,
}: {
  partners: PublicPartner[];
  /** Подсвеченная точка: выбранная или та, над строкой которой держат курсор. */
  activeId: string | null;
  /** Выбранная точка: её группу не прячем в кружок. */
  selectedId: string | null;
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
  // Кружки группируют по выбранной точке, а не по наведению: наведение не должно
  // пересобирать карту (раньше от этого всё мигало)
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;
  const placedRef = useRef<{ partner: PublicPartner; coords: [number, number] }[]>([]);
  const clusters = useRef(new Map<string, Marker>());

  /**
   * Точки, которые на экране ближе CLUSTER_PX, собираем в один кружок с числом — карточки
   * больше не лезут друг на друга. Группу с выбранной точкой не прячем. Совсем вблизи
   * (или если адрес один на всех) раскладываем точки веером вокруг общего места.
   * Кружок с тем же составом не пересоздаём; точки уходят в кружок и выходят плавно (CSS).
   */
  const recluster = () => {
    const instance = map.current;
    if (!instance || markers.current.size === 0) return;
    const zoom = instance.getZoom();
    const items = placedRef.current
      .filter(({ partner }) => markers.current.has(partner.id))
      .map((item) => ({ ...item, point: instance.project(item.coords) }));
    const used = new Set<string>();
    const wanted = new Set<string>();
    for (const item of items) {
      if (used.has(item.partner.id)) continue;
      used.add(item.partner.id);
      const group = [item];
      for (const other of items) {
        if (used.has(other.partner.id)) continue;
        if (Math.hypot(other.point.x - item.point.x, other.point.y - item.point.y) < CLUSTER_PX) {
          group.push(other);
          used.add(other.partner.id);
        }
      }

      // Выбранное заведение не прячем в кружок: его группа раскрывается веером
      const spread =
        group.length > 1 &&
        (zoom >= SPREAD_ZOOM || group.some((member) => member.partner.id === selectedRef.current));
      const lng = group.reduce((sum, member) => sum + member.coords[0], 0) / group.length;
      const lat = group.reduce((sum, member) => sum + member.coords[1], 0) / group.length;
      const center = instance.project([lng, lat]);
      group.forEach((member, index) => {
        const element = markers.current.get(member.partner.id)!.getElement();
        const clustered = group.length > 1 && !spread;
        element.classList.toggle("is-clustered", clustered);
        // Прячась, точка стягивается к центру кружка; веером — расходится по кругу
        let dx = 0;
        let dy = 0;
        if (clustered) {
          dx = center.x - member.point.x;
          dy = center.y - member.point.y;
        } else if (spread) {
          const angle = (index / group.length) * Math.PI * 2 - Math.PI / 2;
          const radius = 34 + group.length * 6;
          dx = center.x - member.point.x + Math.cos(angle) * radius;
          dy = center.y - member.point.y + Math.sin(angle) * radius;
        }
        element.style.setProperty("--dx", `${dx.toFixed(1)}px`);
        element.style.setProperty("--dy", `${dy.toFixed(1)}px`);
      });
      if (group.length < 2 || spread) continue;

      const key = group
        .map((member) => member.partner.id)
        .sort()
        .join(",");
      wanted.add(key);
      const existing = clusters.current.get(key);
      if (existing) {
        existing.setLngLat([lng, lat]);
        continue;
      }
      const element = clusterElement(
        group.map((member) => member.partner),
        () => {
          const lngs = group.map((member) => member.coords[0]);
          const lats = group.map((member) => member.coords[1]);
          const same = Math.max(...lngs) - Math.min(...lngs) < 1e-5 && Math.max(...lats) - Math.min(...lats) < 1e-5;
          if (same)
            instance.easeTo({ center: [lng, lat], zoom: SPREAD_ZOOM, padding: paddingRef.current, duration: 600 });
          else
            instance.fitBounds(
              [
                [Math.min(...lngs), Math.min(...lats)],
                [Math.max(...lngs), Math.max(...lats)],
              ],
              { padding: paddingRef.current, maxZoom: SPREAD_ZOOM + 0.5, duration: reducedMotion() ? 0 : 700 },
            );
        },
      );
      clusters.current.set(key, new Marker({ element }).setLngLat([lng, lat]).addTo(instance));
    }

    // Распавшиеся кружки гаснут, а не исчезают рывком
    clusters.current.forEach((marker, key) => {
      if (wanted.has(key)) return;
      clusters.current.delete(key);
      const element = marker.getElement();
      element.classList.add("is-leaving");
      element.style.pointerEvents = "none";
      window.setTimeout(() => marker.remove(), reducedMotion() ? 0 : 220);
    });
  };
  const reclusterRef = useRef(recluster);
  reclusterRef.current = recluster;

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
      // Карта на весь экран: колесо и щипок тачпада масштабируют карту, а не страницу
      scrollZoom: true,
    } as MapOptions);
    instance.touchZoomRotate.disableRotation();
    instance.scrollZoom.setWheelZoomRate(1 / 300);
    instance.scrollZoom.setZoomRate(1 / 80);
    map.current = instance;
    instance.once("load", () => setReady(true));
    const onZoomEnd = () => reclusterRef.current();
    // Кружки собираются и распадаются прямо во время приближения, раз в кадр
    let frame = 0;
    const onZoom = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        reclusterRef.current();
      });
    };
    instance.on("zoom", onZoom);
    instance.on("zoomend", onZoomEnd);
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
      return coords ? [{ partner, coords: coords as [number, number] }] : [];
    });
    placedRef.current = placed;
    const still = reducedMotion();
    let cancelled = false;

    const drop = () => {
      if (cancelled) return;
      placed.forEach(({ partner, coords }, index) => {
        const element = pinElement(partner, index, () => select.current(partner));
        const marker = new Marker({ element, anchor: "bottom" }).setLngLat(coords).addTo(instance);
        markers.current.set(partner.id, marker);
      });
      reclusterRef.current();
      flyRef.current();
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
      clusters.current.forEach((marker) => marker.remove());
      clusters.current.clear();
    };
  }, [partners, ready]);

  useEffect(() => {
    markers.current.forEach((marker, id) => marker.getElement().classList.toggle("is-active", id === activeId));
  }, [activeId, partners, ready]);

  // Выбранное заведение вынимаем из кружка — его должно быть видно
  useEffect(() => reclusterRef.current(), [selectedId, partners, ready]);

  const focusRef = useRef(focusId);
  focusRef.current = focusId;
  // Подлёт к выбранному. Если точки ещё не упали (карту только открыли из каталога) —
  // подлетим сразу, как они появятся
  const flyToFocus = () => {
    const marker = focusRef.current ? markers.current.get(focusRef.current) : null;
    if (!marker || !map.current) return;
    map.current.flyTo({
      center: marker.getLngLat(),
      zoom: Math.max(map.current.getZoom(), 15.5),
      padding: paddingRef.current,
      duration: reducedMotion() ? 0 : 1100,
      essential: true,
    });
  };
  const flyRef = useRef(flyToFocus);
  flyRef.current = flyToFocus;

  useEffect(() => flyRef.current(), [focusId, focusKey]);

  // Кнопки масштабируют плавно и от центра; колесо и щипок — от точки под пальцем
  const zoomBy = (delta: number) => {
    const instance = map.current;
    if (!instance) return;
    const options = { duration: reducedMotion() ? 0 : 300 };
    if (delta > 0) instance.zoomIn(options);
    else instance.zoomOut(options);
  };

  return (
    <>
      <div className="absolute inset-0 touch-none">
        <div ref={container} className="map-osm h-full w-full" />
      </div>
      <div
        role="group"
        aria-label="Масштаб карты"
        className="absolute right-4 bottom-[calc(var(--sheet,0px)+1.5rem)] z-10 flex flex-col overflow-hidden rounded-full bg-paper shadow-[0_8px_24px_rgb(22_21_21/0.18)] md:right-6 md:bottom-8"
      >
        {[
          { label: "Приблизить", path: "M12 5v14M5 12h14", delta: 1 },
          { label: "Отдалить", path: "M5 12h14", delta: -1 },
        ].map((button, index) => (
          <button
            key={button.label}
            type="button"
            onClick={() => zoomBy(button.delta)}
            aria-label={button.label}
            className={`grid h-12 w-12 touch-manipulation place-items-center transition-colors outline-none hover:bg-cream focus-visible:bg-cream active:bg-smoke ${
              index === 0 ? "border-b border-smoke" : ""
            }`}
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
