// Approved monthly business prices. Keep in sync with core.merchant_tariffs.
export const BUSINESS_MONTHLY_PRICES = {
  loyalty: 8750,
  bundle: 9470,
} as const;

const money = new Intl.NumberFormat("ru-RU");

export function businessPrice(plan: keyof typeof BUSINESS_MONTHLY_PRICES): string {
  return `${money.format(BUSINESS_MONTHLY_PRICES[plan])} сом`;
}
