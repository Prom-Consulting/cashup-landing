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
