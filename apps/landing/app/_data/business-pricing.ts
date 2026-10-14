// Тарифы бизнеса по ТЗ №5 (коды — как loalTariff на сервере). Держать равными экрану «Тарифы»
// в админке: публичного адреса цен нет, страница статическая.
export const BUSINESS_MONTHLY_PRICES = {
  more_clients: 300,
  even_more_clients: 8750,
  very_many_clients: 15700,
} as const;

export type BusinessTariff = keyof typeof BUSINESS_MONTHLY_PRICES;

const money = new Intl.NumberFormat("ru-RU");

export const formatSom = (value: number) => `${money.format(value)} сом`;

export function businessPrice(tariff: BusinessTariff): string {
  return formatSom(BUSINESS_MONTHLY_PRICES[tariff]);
}
