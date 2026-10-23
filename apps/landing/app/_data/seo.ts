import {
  PARTNER_CATEGORIES,
  partnerCategoryId,
  partnerCode,
  partnerPublicPath,
  type PartnerCategoryId,
  type PublicPartner,
} from "@loal/api";

/**
 * SEO лендинга в одном месте: адреса страниц заведений и категорий, шаблоны title и
 * description (по образцу docs/SEO: своя пара на каждую страницу, шаблоны — на однотипные).
 * Title без хвоста «— Loal»: его добавляет шаблон в app/layout.tsx.
 */

export const CITY_NAME = "Бишкек";
const CITY_IN = "в Бишкеке";

/** Падежи и тексты категорий: title и подводка страницы категории. */
export const CATEGORY_SEO: Record<PartnerCategoryId, { title: string; about: string }> = {
  cafe: { title: "Кофейни и рестораны", about: "кофейни, рестораны и кафе" },
  teahouse: { title: "Чайханы и национальная кухня", about: "чайханы и заведения национальной кухни" },
  fastfood: { title: "Фастфуд и шаурма", about: "фастфуд, шаурма и бургерные" },
  bakery: { title: "Пекарни и кондитерские", about: "пекарни, кондитерские и торты на заказ" },
  bar: { title: "Бары и кальянные", about: "бары, пабы и кальянные" },
  catering: { title: "Кейтеринг и доставка еды", about: "кейтеринг, доставка еды и обеды для офисов" },
  grocery: { title: "Продукты и супермаркеты", about: "продуктовые магазины и супермаркеты" },
  halal: { title: "Халал-товары", about: "халал-магазины и товары" },
  shop: { title: "Магазины одежды", about: "магазины одежды, обуви и аксессуаров" },
  shoes: { title: "Обувь и сумки", about: "магазины обуви и сумок" },
  kids: { title: "Детские товары и одежда", about: "магазины детской одежды и товаров" },
  jewelry: { title: "Ювелирные украшения и часы", about: "ювелирные магазины и салоны часов" },
  skincare: { title: "Уходовая косметика", about: "магазины уходовой косметики" },
  cosmetics: { title: "Косметика и парфюмерия", about: "магазины косметики и парфюмерии" },
  beauty: { title: "Салоны красоты", about: "салоны красоты, барбершопы и студии" },
  barber: { title: "Барбершопы", about: "барбершопы и мужские стрижки" },
  nails: { title: "Маникюр, брови и ресницы", about: "студии маникюра, бровей и ресниц" },
  spa: { title: "Спа, массаж и сауны", about: "спа, массажные салоны и сауны" },
  sport: { title: "Фитнес и спорт", about: "фитнес-клубы, залы и спортивные студии" },
  sportshop: { title: "Спорттовары", about: "магазины спортивных товаров и экипировки" },
  clinic: { title: "Клиники и стоматологии", about: "клиники, стоматологии и медицинские центры" },
  pharmacy: { title: "Аптеки и оптика", about: "аптеки и салоны оптики" },
  education: { title: "Курсы и образование", about: "учебные центры, курсы и репетиторы" },
  kidsclub: { title: "Детские центры и кружки", about: "детские центры, кружки и развивающие занятия" },
  entertainment: { title: "Развлечения и отдых", about: "развлечения: кино, квесты, боулинг и игровые" },
  gaming: { title: "Компьютерные клубы", about: "компьютерные и игровые клубы" },
  hotel: { title: "Гостиницы и хостелы", about: "гостиницы, хостелы и апартаменты" },
  travel: { title: "Туризм и путешествия", about: "турагентства и туры" },
  electronics: { title: "Электроника и гаджеты", about: "магазины электроники, телефонов и гаджетов" },
  repair: { title: "Ремонт телефонов и техники", about: "сервисы ремонта телефонов и техники" },
  appliances: { title: "Бытовая техника", about: "магазины бытовой техники" },
  furniture: { title: "Мебель и интерьер", about: "магазины мебели и товаров для интерьера" },
  building: { title: "Стройматериалы и ремонт", about: "магазины стройматериалов и ремонтные бригады" },
  household: { title: "Хозтовары и бытовая химия", about: "магазины хозтоваров и бытовой химии" },
  home: { title: "Услуги для дома", about: "услуги для дома и ремонта" },
  cleaning: { title: "Клининг и химчистка", about: "клининговые компании и химчистки" },
  tailoring: { title: "Ателье и ремонт одежды", about: "ателье, пошив и ремонт одежды" },
  flowers: { title: "Цветы и подарки", about: "цветочные магазины и подарки" },
  books: { title: "Книги и канцтовары", about: "книжные магазины и канцтовары" },
  photo: { title: "Фото, печать и полиграфия", about: "фотостудии, печать и полиграфия" },
  events: { title: "Праздники и мероприятия", about: "организация праздников, декор и ведущие" },
  pets: { title: "Зоотовары и ветеринария", about: "зоомагазины и ветеринарные клиники" },
  auto: { title: "Автосервисы", about: "автосервисы, шиномонтаж и автомойки" },
  carwash: { title: "Автомойки", about: "автомойки и детейлинг" },
  autoparts: { title: "Автозапчасти", about: "магазины автозапчастей и автотоваров" },
  taxi: { title: "Такси и перевозки", about: "такси, грузоперевозки и доставка" },
  other: { title: "Другие заведения", about: "сервисы, клиники, магазины и другие заведения" },
};

/** Категория заведения по названию из витрины; своё название магазина — «Другое». */
export const categoryIdOf = (partner: Pick<PublicPartner, "category">): PartnerCategoryId => partnerCategoryId(partner.category);

export function categoryLabel(id: PartnerCategoryId) {
  return PARTNER_CATEGORIES.find((item) => item.id === id)!.label;
}

export const categoryPath = (id: PartnerCategoryId) => `/partners/${id}`;

export { partnerCode };

/** `/partners/shop/askarova-fc7761e1` — формула общая с кабинетом партнёра (@loal/api). */
export const partnerPath = (partner: Pick<PublicPartner, "id" | "name" | "category">) => partnerPublicPath(partner);

/** Код из последнего сегмента адреса; название и категория могли смениться — ищем по коду. */
export function findByPathSegment(partners: PublicPartner[], segment: string) {
  const code = /([0-9a-f]{8})$/i.exec(segment)?.[1]?.toLowerCase();
  return code ? (partners.find((partner) => partnerCode(partner.id) === code) ?? null) : null;
}

/** Description — до 160 знаков, обрезаем по слову, без висящих знаков. */
export function clip(text: string, max = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/[\s,.;:—-]+\S*$/, "")}…`;
}

const percentText = (partner: PublicPartner) =>
  partner.maxCoveragePercent ? `до ${partner.maxCoveragePercent}% покупки можно оплатить бонусами Loal` : "принимает бонусы Loal";

// ── Шаблон: карточка заведения ───────────────────────────────────────────────
// Title: {Название} в Бишкеке — оплата бонусами до N%
// Description: {Название} в Бишкеке — {категория}. До N% покупки можно оплатить бонусами Loal. Адрес: …. {Описание}
export function partnerTitle(partner: PublicPartner) {
  return partner.maxCoveragePercent
    ? `${partner.name} ${CITY_IN} — оплата бонусами до ${partner.maxCoveragePercent}%`
    : `${partner.name} ${CITY_IN} — оплата бонусами`;
}

export function partnerDescription(partner: PublicPartner) {
  // Один магазин — «магазин», а не «магазины одежды»; своё название категории — как есть
  const known = PARTNER_CATEGORIES.find((item) => item.label === partner.category);
  const kind =
    known && known.id !== "other" ? known.one.toLowerCase() : partner.category && !known ? partner.category.toLowerCase() : "партнёр Loal";
  const parts = [
    `${partner.name} ${CITY_IN} — ${kind}.`,
    `${percentText(partner).replace(/^./, (char) => char.toUpperCase())}.`,
    partner.address ? `Адрес: ${partner.address}.` : "",
    partner.description ?? "",
  ];
  return clip(parts.filter(Boolean).join(" "));
}

// ── Шаблон: категория ────────────────────────────────────────────────────────
// Title: {Категория} в Бишкеке — где платить бонусами Loal
// Description: {Категория} Бишкека, которые принимают бонусы Loal: N заведений. Процент оплаты бонусами, адреса и карта.
export function categoryTitle(id: PartnerCategoryId) {
  return `${CATEGORY_SEO[id].title} ${CITY_IN} — где платить бонусами Loal`;
}

export function categoryDescription(id: PartnerCategoryId, count: number) {
  const many = count > 0 ? `: ${count} ${plural(count, "заведение", "заведения", "заведений")}` : "";
  return clip(
    `${capitalize(CATEGORY_SEO[id].about)} Бишкека, которые принимают бонусы Loal${many}. Сколько процентов покупки можно оплатить бонусами, адреса, контакты и карта.`,
  );
}

// ── Основные страницы ────────────────────────────────────────────────────────
export const PAGE_SEO = {
  home: {
    title: "Loal — бонусы по подписке для покупок в Бишкеке",
    description:
      "Подписка Loal: 990 сом за 30 дней, карта в Apple Wallet или Google Wallet и 15 000 бонусов. Ими закрывается часть покупки у партнёров в Бишкеке.",
  },
  partners: {
    title: "Где тратить бонусы Loal в Бишкеке — каталог заведений",
    description:
      "Каталог заведений Бишкека, которые принимают бонусы Loal: магазины одежды, кофейни, салоны, сервисы. Сколько процентов покупки закрывают бонусы, адреса и карта.",
  },
  business: {
    title: "Loal Corporate — программа лояльности для бизнеса в Бишкеке",
    description:
      "Подключите заведение к бонусной сети Loal: бесплатная регистрация, кабинет партнёра, свой процент оплаты бонусами, доступ сотрудникам и отчёт по операциям.",
  },
  about: {
    title: "О компании Loal — бонусная сеть по подписке в Бишкеке",
    description:
      "Как устроена бонусная сеть Loal в Бишкеке: покупатели получают 15 000 бонусов на 30 дней, заведения сами решают, какую часть чека закрывают бонусы.",
  },
  legal: {
    title: "Правовые документы Loal — соглашение, конфиденциальность, правила",
    description:
      "Правовые документы Loal: пользовательское соглашение, условия конфиденциальности, правила программы лояльности и согласие на обработку персональных данных.",
  },
} as const;

/** Title и description правовых страниц — по одной паре на документ (ключ — slug из app/legal/docs.ts). */
export const LEGAL_SEO = {
  "user-agreement": {
    title: "Пользовательское соглашение — Loal",
    description:
      "Пользовательское соглашение Loal: условия использования цифрового сервиса, подписки, получения и использования бонусов и цифровой карты. Действующая редакция.",
  },
  "privacy": {
    title: "Политика конфиденциальности — Loal",
    description:
      "Как Loal собирает, обрабатывает, хранит и защищает персональные данные участников программы лояльности, и какие права есть у пользователя. Действующая редакция.",
  },
  "program-rules": {
    title: "Правила программы лояльности — Loal",
    description:
      "Правила программы Loal: участие, начисление и использование бонусов, требования к партнёрам, допустимым категориям и модерация предложений. Действующая редакция.",
  },
  "data-consent": {
    title: "Согласие на обработку персональных данных — Loal",
    description:
      "Согласие на обработку персональных данных пользователей программы лояльности Loal: цели, перечень данных, сроки и права субъекта. Редакция от 22 октября 2026 года.",
  },
} as const;

export function plural(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const capitalize = (text: string) => text.replace(/^./, (char) => char.toUpperCase());

/** Open Graph одной строкой: у каждой страницы свой адрес, заголовок и описание. */
export function openGraph(path: string, title: string, description: string, image?: string | null) {
  return {
    url: path,
    type: "website" as const,
    locale: "ru_RU",
    siteName: "Loal",
    title,
    description,
    images: image
      ? [{ url: image, alt: title }]
      : [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Loal — бонусы по подписке" }],
  };
}
