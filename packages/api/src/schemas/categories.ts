/**
 * Категории заведений. Бэкенд хранит категорию строкой и списка не навязывает, поэтому
 * список один на всех: форма заявки на лендинге, создание заведения в админке и витрина.
 * В профиль пишется `label` — по нему же каталог группирует и фильтрует.
 */
export const PARTNER_CATEGORIES = [
  { id: "cafe", label: "Кофейни и рестораны", one: "Кофейня" },
  { id: "beauty", label: "Салоны красоты", one: "Салон красоты" },
  { id: "shop", label: "Магазины одежды", one: "Магазин" },
  { id: "sport", label: "Фитнес и спорт", one: "Фитнес" },
  { id: "auto", label: "Автосервисы", one: "Автосервис" },
  { id: "home", label: "Услуги для дома", one: "Услуги" },
  { id: "skincare", label: "Уходовая косметика", one: "Уходовая косметика" },
  { id: "other", label: "Другое", one: "Другое" },
] as const;

export type PartnerCategoryId = (typeof PARTNER_CATEGORIES)[number]["id"];

const TRANSLIT: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  ң: "ng",
  о: "o",
  ө: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ү: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

/** Адрес заведения в ссылках из названия: «Кофе Хаус» → `kofe-haus`. Кириллица, в том числе кыргызская, — латиницей. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .split("")
    .map((char) => TRANSLIT[char] ?? char)
    .join("")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}

/** Категория заведения по названию из витрины; своё название магазина — «Другое». */
export function partnerCategoryId(category: string | null | undefined): PartnerCategoryId {
  return PARTNER_CATEGORIES.find((item) => item.label === category)?.id ?? "other";
}

/** Короткий код заведения в адресе — первые 8 знаков id: адрес короткий, но однозначный. */
export const partnerCode = (id: string) => id.replace(/-/g, "").slice(0, 8).toLowerCase();

/**
 * Страница заведения на loal.kg: `/partners/shop/askarova-fc7761e1` — категория, название
 * латиницей и код. Одна формула для лендинга и кабинета партнёра («Ссылка на вас в Loal»).
 */
export function partnerPublicPath(partner: { id: string; name: string; category?: string | null }) {
  return `/partners/${partnerCategoryId(partner.category)}/${slugify(partner.name) || "zavedenie"}-${partnerCode(partner.id)}`;
}
