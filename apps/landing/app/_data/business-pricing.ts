import { publicMerchantTariffSchema, type LoalTariff, type PublicMerchantTariff } from "@loal/api";
import { z } from "zod";
import { API_URL } from "./site";

export type BusinessTariff = LoalTariff;
export type BusinessPlan = BusinessTariff;
export type BusinessPricing = PublicMerchantTariff[] | null;
export const TARIFF_CODE = { more_clients: "more_clients", even_more_clients: "even_more_clients", very_many_clients: "very_many_clients" } as const;

const money = new Intl.NumberFormat("ru-RU");
export const formatSom = (value: number) => `${money.format(value)} сом`;

export function businessPrice(plan: BusinessPlan, pricing: BusinessPricing): string {
  const tariff = pricing?.find((item) => item.code === TARIFF_CODE[plan]);
  return tariff ? `${money.format(tariff.priceKgs)} сом` : "Уточняем цену";
}

export async function getBusinessPricing(signal?: AbortSignal): Promise<BusinessPricing> {
  try {
    const response = await fetch(`${API_URL.replace(/\/$/, "")}/v1/public/tariffs`, {
      cache: "no-store", signal: signal ?? AbortSignal.timeout(5_000),
    });
    if (!response.ok) return null;
    const parsed = z.array(publicMerchantTariffSchema).safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    // Never advertise an invented zero or an old hard-coded price during an outage.
    return null;
  }
}
