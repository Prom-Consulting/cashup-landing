// Тарифы бизнеса по Доп. №5. Держать равными core.merchant_tariffs: цены здесь — для
// статической страницы, счётчик мест и актуальные цены страница дочитывает с сервера.
export const BUSINESS_MONTHLY_PRICES = {
  cashback: 300,
  redeem: 8750,
  full: 15700,
} as const;

export type BusinessTariff = keyof typeof BUSINESS_MONTHLY_PRICES;

/** Акция запуска: первые места на двух нижних тарифах бесплатны. Сервер отдаёт живые числа. */
export const LAUNCH_OFFER = {
  seats: 200,
  months: 36,
  tariffs: ["cashback", "redeem"] as BusinessTariff[],
};

const money = new Intl.NumberFormat("ru-RU");

export const formatSom = (value: number) => `${money.format(value)} сом`;

export function businessPrice(tariff: BusinessTariff): string {
  return formatSom(BUSINESS_MONTHLY_PRICES[tariff]);
}
