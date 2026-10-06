// Три способа подключения из ТЗ (раздел 2.3). Используются на главной и на странице «Стать партнёром».



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
      price: "0 сом",
      priceNote: "бесплатно на старте, пока набирается аудитория",
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
      title: "OctōPAY + лояльность",
      price: "0 $",
      priceNote: "абонентской платы за лояльность",
      points: [
        "Приём QR-платежей через OctōPAY",
        "Клиент сам решает, сколько бонусов потратить при оплате",
        "Счёт клиенту: кассир вводит только сумму",
        "Метка «оплата бонусами в OctōPAY» в каталоге",
        "Платите только комиссию с оборота",
      ],
      featured: true,
      cta: { label: "Подключить пакет", href: `${partnerUrl.split("#")[0]}?plan=bundle#form` },
    },
    {
      key: "octopay",
      title: "Только OctōPAY",
      price: "%",
      priceNote: "комиссия с оборота",
      points: ["Приём QR-платежей в Кыргызстане", "Деньги зачисляются на ваш счёт", "Без участия в программе Loal"],
      cta: { label: "Подключить OctōPAY", href: `${partnerUrl.split("#")[0]}?plan=octopay#form` },
    },
  ];
}
