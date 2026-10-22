"use client";

import type { PublicPartner } from "@loal/api";
import { Map as MapLibreMap, Marker, type PaddingOptions } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
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
  root.style.setProperty("--i", String(Math.min(index, 5)));
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
  // Ножка веера: от настоящего адреса к отодвинутой метке — видно, где заведение на самом деле
  root.append(make("span", "loal-pin__leg"), spread);
  return root;
}

// Точка — 64×80 px: ближе этого по любой оси карточки налезают друг на друга
const CLUSTER_PX = 78;
/** Острие метки — на 13 px выше низа её коробки (64×80): сдвигаем, чтобы острие стояло ровно на адресе. */
const PIN_TIP_OFFSET: [number, number] = [0, 13];
/** Между остриями соседей в веере — не меньше этого: метка 64 px плюс плашка процента. */
const SPREAD_GAP_PX = 86;
/** С этого приближения близкие точки больше не собираем — раскладываем веером. */
const SPREAD_ZOOM = 17;
/** Веер вокруг выбранной точки — только вблизи, где соседей немного. */
const SPREAD_NEAR_ZOOM = 14;

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
  visible,
  partners,
  activeId,
  selectedId,
  focusId,
  focusKey,
  padding,
  onSelect,
}: {
  visible: boolean;
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
  const [hasSize, setHasSize] = useState(false);
  const [ready, setReady] = useState(false);
  // Браузер без WebGL2 (старый телефон, часть ботов): карты нет, остаётся каталог
  const [noMap, setNoMap] = useState(false);
  const select = useRef(onSelect);
  select.current = onSelect;
  const paddingRef = useRef(padding);
  paddingRef.current = padding;
  // Кружки группируют по выбранной точке, а не по наведению: наведение не должно
  // пересобирать карту (раньше от этого всё мигало)
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;
  const placed = useMemo(
    () =>
      partners.flatMap((partner) => {
        const coords = coordsOf(partner);
        return coords ? [{ partner, coords }] : [];
      }),
    [partners],
  );
  const placedRef = useRef(placed);
  placedRef.current = placed;
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
    // Выбранную точку в общий кружок не берём: на отдалении в одну группу попадал весь город,
    // и «веер» вокруг выбранной разворачивал кольцо из всех заведений
    const selected = items.find((item) => item.partner.id === selectedRef.current) ?? null;
    const groups: (typeof items)[] = [];
    for (const item of items) {
      if (item === selected || used.has(item.partner.id)) continue;
      used.add(item.partner.id);
      const group = [item];
      for (const other of items) {
        if (other === selected || used.has(other.partner.id)) continue;
        if (Math.hypot(other.point.x - item.point.x, other.point.y - item.point.y) < CLUSTER_PX) {
          group.push(other);
          used.add(other.partner.id);
        }
      }
      groups.push(group);
    }
    if (selected) {
      // Вблизи и среди нескольких соседей выбранная раскладывается веером вместе с ними; иначе стоит отдельно
      const near = groups.find(
        (group) =>
          group.length <= 5 &&
          group.some((member) => Math.hypot(member.point.x - selected.point.x, member.point.y - selected.point.y) < CLUSTER_PX),
      );
      if (near && zoom >= SPREAD_NEAR_ZOOM) near.push(selected);
      else groups.push([selected]);
    }
    for (const group of groups) {

      // Выбранное заведение не прячем в кружок: его группа раскрывается веером
      const spread =
        group.length > 1 && (zoom >= SPREAD_ZOOM || (selected !== null && group.includes(selected)));
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
          // Радиус такой, чтобы соседние метки не касались: хорда между ними ≥ SPREAD_GAP_PX
          const angle = (index / group.length) * Math.PI * 2 - Math.PI / 2;
          const radius = Math.max(44, SPREAD_GAP_PX / 2 / Math.sin(Math.PI / group.length));
          dx = center.x - member.point.x + Math.cos(angle) * radius;
          dy = center.y - member.point.y + Math.sin(angle) * radius;
        }
        const fanned = spread && Math.hypot(dx, dy) > 4;
        element.classList.toggle("is-spread", fanned);
        element.style.setProperty("--dx", `${dx.toFixed(1)}px`);
        element.style.setProperty("--dy", `${dy.toFixed(1)}px`);
        element.style.setProperty("--leg", `${Math.hypot(dx, dy).toFixed(1)}px`);
        element.style.setProperty("--leg-angle", `${Math.atan2(dy, dx).toFixed(4)}rad`);
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
            instance.easeTo({
              center: [lng, lat],
              zoom: SPREAD_ZOOM,
              padding: paddingRef.current,
              duration: reducedMotion() ? 0 : 320,
            });
          else
            instance.fitBounds(
              [
                [Math.min(...lngs), Math.min(...lats)],
                [Math.max(...lngs), Math.max(...lats)],
              ],
              { padding: paddingRef.current, maxZoom: SPREAD_ZOOM + 0.5, duration: reducedMotion() ? 0 : 320 },
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
      window.setTimeout(() => marker.remove(), reducedMotion() ? 0 : 120);
    });
  };
  const reclusterRef = useRef(recluster);
  reclusterRef.current = recluster;

  // Быстрое переключение вида может скрыть контейнер до загрузки JS карты.
  // Не создаём WebGL и не запрашиваем тайлы, пока карту действительно не открыли.
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      if (!element.clientWidth || !element.clientHeight) return;
      setHasSize(true);
      observer.disconnect();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasSize || !container.current) return;
    const points = placedRef.current;
    const lngs = points.map(({ coords }) => coords[0]);
    const lats = points.map(({ coords }) => coords[1]);
    let instance: MapLibreMap;
    try {
      instance = new MapLibreMap({
        container: container.current,
        style,
        // Сразу загружаем нужный район: без облёта и запросов тайлов промежуточных масштабов.
        center: CITY_CENTER,
        zoom: 12.2,
        ...(points.length > 0
          ? {
              bounds: [
                [Math.min(...lngs), Math.min(...lats)],
                [Math.max(...lngs), Math.max(...lats)],
              ] as [[number, number], [number, number]],
              fitBoundsOptions: { padding: paddingRef.current, maxZoom: points.length === 1 ? 15 : 14.5, duration: 0 },
            }
          : {}),
        // Храним уже просмотренные тайлы при переключении на каталог и обратно.
        maxTileCacheSize: 64,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
        // Карта на весь экран: колесо и щипок тачпада масштабируют карту, а не страницу
        scrollZoom: true,
      });
    } catch {
      setNoMap(true);
      return;
    }
    instance.touchZoomRotate.disableRotation();
    instance.scrollZoom.setWheelZoomRate(1 / 300);
    instance.scrollZoom.setZoomRate(1 / 80);
    map.current = instance;
    // HTML-меткам не нужны загруженные тайлы: показываем их сразу, даже на медленной сети.
    setReady(true);
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
    const observer = new ResizeObserver(() => {
      if (container.current?.clientWidth && container.current.clientHeight) instance.resize();
    });
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      instance.remove();
      map.current = null;
    };
  }, [hasSize]);

  // Метки доступны сразу; карта и её кэш остаются живыми при переключении вида.
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    placed.forEach(({ partner, coords }, index) => {
      const element = pinElement(partner, index, () => select.current(partner));
      const marker = new Marker({ element, anchor: "bottom", offset: PIN_TIP_OFFSET }).setLngLat(coords).addTo(instance);
      markers.current.set(partner.id, marker);
    });
    reclusterRef.current();
    flyRef.current();

    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current.clear();
      clusters.current.forEach((marker) => marker.remove());
      clusters.current.clear();
    };
  }, [placed, ready]);

  useEffect(() => {
    if (visible) map.current?.resize();
    else map.current?.stop();
  }, [visible]);

  useEffect(() => {
    markers.current.forEach((marker, id) => marker.getElement().classList.toggle("is-active", id === activeId));
  }, [activeId, partners, ready]);

  // Выбранное заведение вынимаем из кружка — его должно быть видно
  useEffect(() => reclusterRef.current(), [selectedId, partners, ready]);

  const focusRef = useRef(focusId);
  focusRef.current = focusId;
  // Если карту ещё загружаем, выбор выполнится сразу после создания меток.
  const flyToFocus = () => {
    const marker = focusRef.current ? markers.current.get(focusRef.current) : null;
    if (!marker || !map.current) return;
    map.current.easeTo({
      center: marker.getLngLat(),
      zoom: Math.max(map.current.getZoom(), 15.5),
      padding: paddingRef.current,
      duration: reducedMotion() ? 0 : 360,
    });
  };
  const flyRef = useRef(flyToFocus);
  flyRef.current = flyToFocus;

  useEffect(() => flyRef.current(), [focusId, focusKey]);

  // Кнопки масштабируют плавно и от центра; колесо и щипок — от точки под пальцем
  const zoomBy = (delta: number) => {
    const instance = map.current;
    if (!instance) return;
    const options = { duration: reducedMotion() ? 0 : 180 };
    if (delta > 0) instance.zoomIn(options);
    else instance.zoomOut(options);
  };

  return (
    <>
      <div className="absolute inset-0 touch-none">
        <div ref={container} className="map-osm h-full w-full" />
        {noMap && (
          <p className="absolute inset-0 grid place-items-center bg-cream p-6 text-center text-base font-medium">
            Этот браузер не показывает карту. Все заведения есть в «Каталоге».
          </p>
        )}
      </div>
      <div
        role="group"
        aria-label="Масштаб карты"
        className="absolute right-3 bottom-[min(calc(var(--sheet,0px)+0.75rem),calc(100%-11rem))] z-10 flex flex-col overflow-hidden rounded-full bg-paper shadow-[0_8px_24px_rgb(22_21_21/0.18)] md:right-6 md:bottom-8"
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
