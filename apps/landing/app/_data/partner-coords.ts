import type { PublicPartner } from "@loal/api";

/** Центр Бишкека: [долгота, широта]. */
export const CITY_CENTER: [number, number] = [74.6059, 42.8746];

/**
 * Координаты заведения — из его же ссылки на 2ГИС. Своих координат витрина не отдаёт,
 * а в ссылке «поделиться» они есть: `…?m=74.59,42.87/16` или `…/geo/74.59,42.87`.
 * Нет пары чисел, похожих на Кыргызстан, — точки на карте нет: выдуманная хуже никакой.
 */
export function coordsOf(partner: PublicPartner): [number, number] | null {
  if (!partner.twogisUrl) return null;
  const numbers =
    decodeURIComponent(partner.twogisUrl)
      .match(/\d{2}\.\d{3,}/g)
      ?.map(Number) ?? [];
  for (let i = 0; i < numbers.length - 1; i += 1) {
    const [a, b] = [numbers[i]!, numbers[i + 1]!];
    if (a >= 69 && a <= 81 && b >= 39 && b <= 44) return [a, b];
    if (b >= 69 && b <= 81 && a >= 39 && a <= 44) return [b, a];
  }
  return null;
}
