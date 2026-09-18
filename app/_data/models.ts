// Три способа подключения из ТЗ (раздел 2.3). Используются на главной и на странице «Стать партнёром».

import { OCTOPAY_URL } from "./site";

export type Model = {
  key: string;
  title: string;
  price: string;
  priceNote: string;
  points: string[];
  featured?: boolean;
  cta: { label: string; href: string };
};

export function models(partnerUrl: string): Model[] {
  return [
    {
      key: "loyalty",
      title: "Только лояльность",
      price: "30–50 $",
      priceNote: "в месяц, оплата через OctōPAY",
      points: [
        "Место в каталоге Loal и кабинет партнёра",
        "Сами задаёте максимальный % оплаты бонусами на месяц",
        "Приём бонусов по QR-коду карты",
        "Продление подписки в кабинете",
      ],
      cta: { label: "Подключить лояльность", href: partnerUrl },
    },
    {
      key: "bundle",
      title: "OctōPAY + лояльность",
      price: "0 $",
      priceNote: "абонентской платы за лояльность",
      points: [
        "Приём QR-платежей через OctōPAY",
        "Бонусы списываются и начисляются сами при оплате",
        "Метка «Больше бонусов» в каталоге",
        "Платите только комиссию с оборота",
      ],
      featured: true,
      cta: { label: "Подключить пакет", href: partnerUrl },
    },
    {
      key: "octopay",
      title: "Только OctōPAY",
      price: "%",
      priceNote: "комиссия с оборота",
      points: [
        "Приём QR-платежей в Кыргызстане",
        "Деньги зачисляются на ваш счёт",
        "Без участия в программе Loal",
      ],
      cta: { label: "Узнать об OctōPAY", href: OCTOPAY_URL },
    },
  ];
}

