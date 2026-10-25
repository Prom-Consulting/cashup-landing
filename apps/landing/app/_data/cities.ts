/**
 * Города присутствия Loal. Пока город один — Бишкек; каркас готов к расширению:
 * добавить запись сюда и поставить `active: true`, и появятся городская страница
 * (`/{slug}`) и строка в sitemap. Все заведения витрины сейчас в Бишкеке, поэтому
 * счётчики на городской странице считаются по всему каталогу; когда у заведений
 * появится город, фильтр добавится здесь же.
 */
export type City = {
  slug: string;
  /** Именительный: «Бишкек». */
  name: string;
  /** Предложный с предлогом: «в Бишкеке» — для заголовков. */
  nameIn: string;
  /** Родительный: «Бишкека» — «заведения Бишкека». */
  nameOf: string;
  active: boolean;
};

export const CITIES: City[] = [
  { slug: "bishkek", name: "Бишкек", nameIn: "в Бишкеке", nameOf: "Бишкека", active: true },
  // Следующие города — по мере запуска:
  // { slug: "osh", name: "Ош", nameIn: "в Оше", nameOf: "Оша", active: false },
];

export const ACTIVE_CITIES = CITIES.filter((city) => city.active);

export const cityBySlug = (slug: string): City | undefined => ACTIVE_CITIES.find((city) => city.slug === slug);

export const cityPath = (slug: string) => `/${slug}`;

/** Основной город сети — на него опираются общие geo-тексты, пока он один. */
export const PRIMARY_CITY = ACTIVE_CITIES[0];
