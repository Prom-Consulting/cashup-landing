import { publicPartnerSchema, type PublicPartner } from "@loal/api";
import { z } from "zod";
import { API_URL } from "./site";

/**
 * Витрина участников для главной. Запрос идёт на сервере при сборке и обновляется
 * раз в пять минут: страница остаётся статической, а список — живым.
 *
 * Если шлюз недоступен, возвращаем пустой список: страница должна собираться и
 * открываться даже тогда, когда бэкенд лежит.
 */
export async function getPublicPartners(): Promise<PublicPartner[]> {
  try {
    const response = await fetch(`${API_URL.replace(/\/$/, "")}/v1/public/partners`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    const parsed = z.array(publicPartnerSchema).safeParse(await response.json());
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

/** Монограмма вместо логотипа: у многих заведений его ещё нет. */
export function monogram(name: string) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
  return letters.toUpperCase() || "?";
}
