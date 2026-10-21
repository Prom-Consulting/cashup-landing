/**
 * Категории заведений. Новые добавляются только в конец своей группы, а `label` уже
 * существующих не меняется: он записан в профилях заведений. Список id повторяет бэкенд
 * (`partner-onboarding.controller.ts`, `storefront.schema.ts`). Бэкенд хранит категорию строкой, поэтому
 * список один на всех: форма заявки на лендинге, создание заведения в админке и витрина.
 * В профиль пишется `label` — по нему же каталог группирует и фильтрует.
 */
export const PARTNER_CATEGORIES = [
  { id: "cafe", label: "Кофейни и рестораны", one: "Кофейня" },
  { id: "teahouse", label: "Чайханы и национальная кухня", one: "Чайхана" },
  { id: "fastfood", label: "Фастфуд и шаурма", one: "Фастфуд" },
  { id: "bakery", label: "Пекарни и кондитерские", one: "Пекарня" },
  { id: "bar", label: "Бары и кальянные", one: "Бар" },
  { id: "catering", label: "Кейтеринг и доставка еды", one: "Кейтеринг" },
  { id: "grocery", label: "Продукты и супермаркеты", one: "Магазин продуктов" },
  { id: "halal", label: "Халал-товары", one: "Халал-магазин" },
  { id: "shop", label: "Магазины одежды", one: "Магазин" },
  { id: "shoes", label: "Обувь и сумки", one: "Магазин обуви" },
  { id: "kids", label: "Детские товары и одежда", one: "Детский магазин" },
  { id: "jewelry", label: "Ювелирные украшения и часы", one: "Ювелирный магазин" },
  { id: "skincare", label: "Уходовая косметика", one: "Уходовая косметика" },
  { id: "cosmetics", label: "Косметика и парфюмерия", one: "Магазин косметики" },
  { id: "beauty", label: "Салоны красоты", one: "Салон красоты" },
  { id: "barber", label: "Барбершопы", one: "Барбершоп" },
  { id: "nails", label: "Маникюр, брови и ресницы", one: "Студия маникюра" },
  { id: "spa", label: "Спа, массаж и сауны", one: "Спа" },
  { id: "sport", label: "Фитнес и спорт", one: "Фитнес" },
  { id: "sportshop", label: "Спорттовары", one: "Магазин спорттоваров" },
  { id: "clinic", label: "Клиники и стоматологии", one: "Клиника" },
  { id: "pharmacy", label: "Аптеки и оптика", one: "Аптека" },
  { id: "education", label: "Курсы и образование", one: "Учебный центр" },
  { id: "kidsclub", label: "Детские центры и кружки", one: "Детский центр" },
  { id: "entertainment", label: "Развлечения и отдых", one: "Развлечения" },
  { id: "gaming", label: "Компьютерные клубы", one: "Компьютерный клуб" },
  { id: "hotel", label: "Гостиницы и хостелы", one: "Гостиница" },
  { id: "travel", label: "Туризм и путешествия", one: "Турагентство" },
  { id: "electronics", label: "Электроника и гаджеты", one: "Магазин электроники" },
  { id: "repair", label: "Ремонт телефонов и техники", one: "Ремонт техники" },
  { id: "appliances", label: "Бытовая техника", one: "Бытовая техника" },
  { id: "furniture", label: "Мебель и интерьер", one: "Мебель" },
  { id: "building", label: "Стройматериалы и ремонт", one: "Стройматериалы" },
  { id: "household", label: "Хозтовары и бытовая химия", one: "Хозтовары" },
  { id: "home", label: "Услуги для дома", one: "Услуги" },
  { id: "cleaning", label: "Клининг и химчистка", one: "Клининг" },
  { id: "tailoring", label: "Ателье и ремонт одежды", one: "Ателье" },
  { id: "flowers", label: "Цветы и подарки", one: "Цветочный магазин" },
  { id: "books", label: "Книги и канцтовары", one: "Книжный магазин" },
  { id: "photo", label: "Фото, печать и полиграфия", one: "Фотостудия" },
  { id: "events", label: "Праздники и мероприятия", one: "Организация праздников" },
  { id: "pets", label: "Зоотовары и ветеринария", one: "Зоомагазин" },
  { id: "auto", label: "Автосервисы", one: "Автосервис" },
  { id: "carwash", label: "Автомойки", one: "Автомойка" },
  { id: "autoparts", label: "Автозапчасти", one: "Автозапчасти" },
  { id: "taxi", label: "Такси и перевозки", one: "Перевозки" },
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

/**
 * «Для кого» заведение — отдельное от категории поле витрины (можно отметить несколько).
 * Список повторяет бэкенд (`PARTNER_AUDIENCES`); по id фильтрует каталог.
 */
export const PARTNER_AUDIENCES = [
  { id: "men", label: "Мужское" },
  { id: "women", label: "Женское" },
  { id: "kids", label: "Для детей" },
  { id: "family", label: "Для семьи" },
] as const;
export type PartnerAudienceId = (typeof PARTNER_AUDIENCES)[number]["id"];

/** Только известные id и без повторов: старый или чужой ответ не ломает экран. */
export function partnerAudiences(value: readonly string[] | null | undefined): PartnerAudienceId[] {
  return PARTNER_AUDIENCES.filter((item) => value?.includes(item.id)).map((item) => item.id);
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
