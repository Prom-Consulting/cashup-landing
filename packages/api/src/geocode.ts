/**
 * Геокодинг через Nominatim (OpenStreetMap) — тот же источник, что и тайлы карты, без ключа.
 * Подсказки адреса при вводе и обратный геокодинг (точка на карте → адрес). Объём в кабинете
 * небольшой, запросы с задержкой — в рамках условий Nominatim. Привязка к Бишкеку/Кыргызстану.
 */
const NOMINATIM = "https://nominatim.openstreetmap.org";
// left,top,right,bottom (lon/lat) — рамка Бишкека, чтобы подсказки были локальными.
const BISHKEK_VIEWBOX = "74.45,42.95,74.78,42.78";

export type AddressHit = { short: string; full: string; lat: number; lng: number };

type NominatimAddress = {
  road?: string;
  pedestrian?: string;
  street?: string;
  neighbourhood?: string;
  house_number?: string;
};

function shortAddress(address: NominatimAddress | undefined, fallback: string): string {
  const road = address?.road ?? address?.pedestrian ?? address?.street ?? address?.neighbourhood;
  const house = address?.house_number;
  if (road) return house ? `${road}, ${house}` : road;
  return fallback.split(",").slice(0, 2).join(",").trim();
}

/** Подсказки адреса по тексту. Возвращает до 6 вариантов; пустой массив при коротком вводе или сбое. */
export async function searchAddress(query: string, signal?: AbortSignal): Promise<AddressHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = new URL(`${NOMINATIM}/search`);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "kg");
  url.searchParams.set("viewbox", BISHKEK_VIEWBOX);
  url.searchParams.set("limit", "6");
  url.searchParams.set("accept-language", "ru");
  try {
    const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!response.ok) return [];
    const data: unknown = await response.json();
    if (!Array.isArray(data)) return [];
    return data
      .map((item): AddressHit | null => {
        const lat = Number((item as { lat?: string }).lat);
        const lng = Number((item as { lon?: string }).lon);
        const full = String((item as { display_name?: string }).display_name ?? "");
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || !full) return null;
        return { short: shortAddress((item as { address?: NominatimAddress }).address, full), full, lat, lng };
      })
      .filter((hit): hit is AddressHit => hit !== null);
  } catch {
    return [];
  }
}

/** Адрес по координатам (клик/перетаскивание точки). `null` при сбое. */
export async function reverseGeocode(lat: number, lng: number, signal?: AbortSignal): Promise<string | null> {
  const url = new URL(`${NOMINATIM}/reverse`);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("zoom", "18");
  url.searchParams.set("accept-language", "ru");
  try {
    const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const data = (await response.json()) as { address?: NominatimAddress; display_name?: string };
    const short = shortAddress(data.address, data.display_name ?? "");
    return short || null;
  } catch {
    return null;
  }
}
