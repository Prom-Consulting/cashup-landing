import { coordsFrom2gis, type PublicPartner } from "@loal/api";

/** Центр Бишкека: [долгота, широта]. */
export const CITY_CENTER: [number, number] = [74.6059, 42.8746];

/**
 * Точка заведения: координаты из витрины, а у тех, кто их ещё не сохранил, — из ссылки
 * на 2ГИС. Нет ни того, ни другого — точки на карте нет.
 */
export function coordsOf(partner: PublicPartner): [number, number] | null {
  if (typeof partner.lat === "number" && typeof partner.lng === "number") return [partner.lng, partner.lat];
  const parsed = coordsFrom2gis(partner.twogisUrl);
  return parsed ? [parsed.lng, parsed.lat] : null;
}
