import { publicMerchantTariffSchema, type PublicMerchantTariff } from "@loal/api";
import { z } from "zod";
import { API_URL } from "./site";

export type BusinessPlan = "loyalty" | "bundle";
export type BusinessPricing = PublicMerchantTariff[] | null;
export const TARIFF_CODE = { loyalty: "loal", bundle: "loal_octopay" } as const;

const money = new Intl.NumberFormat("ru-RU");

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
