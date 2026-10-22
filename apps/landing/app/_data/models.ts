// Три способа подключения на странице «Стать партнёром».

export type Model = {
  key: string;
  title: string;
  priceNote: string;
  points: string[];
  featured?: boolean;
  cta: { label: string; href: string };
};

export function models(partnerUrl: string): Model[] {
  return [
    {
      key: "loyalty",
      title: "Больше клиентов",
      priceNote: "в месяц",
      points: [
        "Место в каталоге Loal и кабинет партнёра",
        "Сами задаёте максимальный % оплаты бонусами на месяц",
        "Приём бонусов по QR-коду карты",
        "Регистрация и кабинет — бесплатно",
      ],
      cta: { label: "Подключить лояльность", href: `${partnerUrl.split("#")[0]}?plan=loyalty#form` },
    },
    {
      key: "bundle",
      title: "Ещё больше клиентов",
      priceNote: "в месяц за лояльность и OctōPAY",
      points: [
        "Приём QR-платежей через OctōPAY",
        "Клиент сам решает, сколько бонусов потратить при оплате",
        "Счёт клиенту: кассир вводит только сумму",
        "Метка «оплата бонусами в OctōPAY» в каталоге",
        "Комиссия за платежи — по условиям OctōPAY",
      ],
      featured: true,
      cta: { label: "Подключить пакет", href: `${partnerUrl.split("#")[0]}?plan=bundle#form` },
    },
    {
      key: "octopay",
      title: "Только OctōPAY",
      priceNote: "комиссия с оборота",
      points: ["Приём QR-платежей в Кыргызстане", "Деньги зачисляются на ваш счёт", "Без участия в программе Loal"],
      cta: { label: "Подключить OctōPAY", href: `${partnerUrl.split("#")[0]}?plan=octopay#form` },
    },
  ];
}
