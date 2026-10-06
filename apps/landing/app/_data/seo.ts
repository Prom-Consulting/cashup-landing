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
  beauty: { title: "Салоны красоты", about: "салоны красоты, барбершопы и студии" },
  shop: { title: "Магазины одежды", about: "магазины одежды, обуви и аксессуаров" },
  sport: { title: "Фитнес и спорт", about: "фитнес-клубы, залы и спортивные студии" },
  auto: { title: "Автосервисы", about: "автосервисы, шиномонтаж и автомойки" },
  home: { title: "Услуги для дома", about: "услуги для дома и ремонта" },
  skincare: { title: "Уходовая косметика", about: "магазины уходовой косметики" },
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
