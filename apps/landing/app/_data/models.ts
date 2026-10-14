import { BUSINESS_MONTHLY_PRICES, LAUNCH_OFFER, type BusinessTariff } from "./business-pricing";

// Тарифы на странице «Стать партнёром» (Доп. №5): польза для бизнеса и чем тариф лучше
// более дешёвого, а не список технических фич.

export type Model = {
  key: BusinessTariff;
  title: string;
  /** Целые сомы в месяц. */
  priceKgs: number;
  /** Первые места бесплатны (LAUNCH_OFFER). */
  launchOffer: boolean;
  benefit: string;
  /** Чем лучше тарифа подешевле; у самого дешёвого нет. */
  better?: string;
  points: string[];
  featured?: boolean;
  cta: { label: string; href: string };
};

export function models(formUrl: string): Model[] {
  const href = (tariff: BusinessTariff) => `${formUrl.split("#")[0]}?tariff=${tariff}#form`;
  const free = (tariff: BusinessTariff) => LAUNCH_OFFER.tariffs.includes(tariff);
  return [
    {
      key: "cashback",
      title: "Больше клиентов",
      priceKgs: BUSINESS_MONTHLY_PRICES.cashback,
      launchOffer: free("cashback"),
      benefit:
        "Подключаетесь к потоку держателей Loal без скидки с чека. Клиенты получают у вас кэшбэк и возвращаются тратить бонусы в сети — точку узнают больше людей.",
      points: ["Клиенту — кэшбэк бонусами за покупку", "Место в каталоге и на карте Loal"],
      cta: { label: "Подключить", href: href("cashback") },
    },
    {
      key: "redeem",
      title: "Ещё больше клиентов",
      priceKgs: BUSINESS_MONTHLY_PRICES.redeem,
      launchOffer: free("redeem"),
      benefit:
        "Клиент с картой может оплатить часть покупки бонусами — ниже барьер зайти, выше шанс закрыть чек. Бонусы списываются сами.",
      better: "Чем лучше «Больше клиентов»: бонусы тратят у вас, а не только получают кэшбэк.",
      points: [
        "Оплата части чека бонусами — списание само",
        "Процент оплаты бонусами задаёте сами",
        "Место в каталоге и на карте Loal",
      ],
      cta: { label: "Подключить", href: href("redeem") },
    },
    {
      key: "full",
      title: "Очень много клиентов",
      priceKgs: BUSINESS_MONTHLY_PRICES.full,
      launchOffer: free("full"),
      benefit:
        "Полный цикл: у вас и тратят бонусы, и получают кэшбэк. Заведение выделено в каталоге и на карте, а раз в неделю — целый день повышенной видимости.",
      better: "Чем лучше «Ещё больше клиентов»: кэшбэк у вас и продвижение внутри Loal.",
      points: [
        "Оплата бонусами и кэшбэк сразу",
        "Выделенный значок в каталоге и на карте",
        "Раз в неделю — плашка в каталоге и топ своей категории",
      ],
      featured: true,
      cta: { label: "Подключить", href: href("full") },
    },
  ];
}
