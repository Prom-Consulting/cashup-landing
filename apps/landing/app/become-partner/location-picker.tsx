"use client";

import { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { mapStyle } from "../_data/map-style";
import { CITY_CENTER } from "../_data/partner-coords";

export type Point = { lat: number; lng: number };

/** Метка заведения — тот же огонёк, что на карте партнёров. */
function pinElement() {
  const pin = document.createElement("div");
  pin.setAttribute("aria-hidden", "true");
  pin.style.cssText =
    "width:34px;height:34px;border-radius:999px 999px 999px 0;transform:rotate(-45deg);" +
    "background:linear-gradient(135deg,#FF4A3E,#FF5D34);border:3px solid #fff;" +
    "box-shadow:0 8px 20px rgb(255 74 62 / .45);cursor:grab";
  return pin;
}

const round = (value: number) => Math.round(value * 1e6) / 1e6;

/**
 * Точка заведения на карте: клик ставит метку, метку можно перетащить, «Где я» берёт
 * геопозицию телефона. Эти координаты уходят в витрину и ставят заведение на карту партнёров.
 */
export default function LocationPicker({
  value,
  onChange,
  disabled,
}: {
  value: Point | null;
  onChange: (point: Point | null) => void;
  disabled?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const change = useRef(onChange);
  change.current = onChange;
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  useEffect(() => {
    if (!container.current) return;
    const instance = new MapLibreMap({
      container: container.current,
      style: mapStyle,
      center: value ? [value.lng, value.lat] : CITY_CENTER,
      zoom: value ? 15.5 : 11.5,
      attributionControl: { compact: true },
      cooperativeGestures: true,
      locale: {
        "CooperativeGesturesHandler.WindowsHelpText": "Чтобы приблизить карту, зажмите Ctrl и прокрутите",
        "CooperativeGesturesHandler.MacHelpText": "Чтобы приблизить карту, зажмите ⌘ и прокрутите",
        "CooperativeGesturesHandler.MobileHelpText": "Двигайте карту двумя пальцами",
      },
    });
    instance.on("click", (event) => change.current({ lat: round(event.lngLat.lat), lng: round(event.lngLat.lng) }));
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
      marker.current = null;
    };
    // Карта создаётся один раз; точку дальше ведёт эффект ниже
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Метка следует за значением: из клика, перетаскивания, «Где я» или ссылки 2ГИС
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    if (!value) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    if (!marker.current) {
      marker.current = new Marker({ element: pinElement(), draggable: true, anchor: "bottom-left", offset: [-2, 2] })
        .setLngLat([value.lng, value.lat])
        .addTo(instance);
      marker.current.on("dragend", () => {
        const at = marker.current!.getLngLat();
        change.current({ lat: round(at.lat), lng: round(at.lng) });
      });
    } else {
      marker.current.setLngLat([value.lng, value.lat]);
    }
    const center = instance.getCenter();
    const far = Math.abs(center.lat - value.lat) > 0.01 || Math.abs(center.lng - value.lng) > 0.01;
    if (far) instance.easeTo({ center: [value.lng, value.lat], zoom: Math.max(instance.getZoom(), 15.5), duration: 700 });
  }, [value]);

  const locate = () => {
    setGeoError("");
    if (!navigator.geolocation) return setGeoError("Браузер не даёт геопозицию — поставьте точку на карте.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        change.current({ lat: round(position.coords.latitude), lng: round(position.coords.longitude) });
      },
      () => {
        setLocating(false);
        setGeoError("Нет доступа к геопозиции. Разрешите его в браузере или поставьте точку на карте.");
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border-2 border-smoke">
        <div ref={container} className="h-[300px] w-full sm:h-[340px]" aria-label="Карта: нажмите, чтобы отметить заведение" />
        {!value && (
          <p className="pointer-events-none absolute inset-x-3 top-3 rounded-full bg-paper/95 px-4 py-2 text-center text-sm font-medium shadow">
            Нажмите на карту там, где находится заведение
          </p>
        )}
        <div className="absolute right-3 bottom-8 flex flex-col gap-2">
          <button
            type="button"
            onClick={locate}
            disabled={disabled || locating}
            className="rounded-full bg-paper px-4 py-2.5 text-sm font-bold shadow-[0_8px_24px_rgb(22_21_21/0.18)] transition-colors hover:bg-graphite hover:text-paper disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                <circle cx="12" cy="12" r="3.2" fill="currentColor" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              {locating ? "Ищем…" : "Где я"}
            </span>
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        {value ? (
          <>
            <span className="font-medium">
              Точка выбрана · <span className="tabular-nums opacity-70">{value.lat.toFixed(5)}, {value.lng.toFixed(5)}</span>
            </span>
            <button type="button" disabled={disabled} onClick={() => change.current(null)} className="underline underline-offset-4">
              Убрать точку
            </button>
          </>
        ) : (
          <span className="opacity-70">Метку можно перетащить. Без точки заведение не появится на карте партнёров.</span>
        )}
      </div>
      {geoError && (
        <p role="alert" className="text-sm text-flame-ink">
          {geoError}
        </p>
      )}
    </div>
  );
}
