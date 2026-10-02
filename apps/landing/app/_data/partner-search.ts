import { PARTNER_CATEGORIES, type PublicPartner } from "@loal/api";

/**
 * Поиск по каталогу, который понимает человека, а не только точное совпадение:
 * синонимы категорий («кофе», «стрижка», «шины»), опечатки, текст, набранный в
 * английской раскладке («rjat» → «кофе»), латиницу («kofe») и процент («30%»).
 */

/** Слова, по которым человек ищет категорию. Русские, кыргызские и английские. */
const CATEGORY_WORDS: Record<string, string[]> = {
  skincare: ["уходовая косметика", "косметика", "уход за кожей", "крем", "сыворотка", "skincare"],
  other: ["другое", "прочее", "other"],
  cafe: [
    "кофе",
    "кофейня",
    "кафе",
    "ресторан",
    "еда",
    "поесть",
    "обед",
    "ужин",
    "завтрак",
    "пицца",
    "бургер",
    "суши",
    "шаурма",
    "бар",
    "чай",
    "десерт",
    "выпечка",
    "пекарня",
    "фастфуд",
    "тамак",
    "ашкана",
    "coffee",
    "cafe",
    "food",
    "restaurant",
  ],
  beauty: [
    "красота",
    "салон",
    "стрижка",
    "парикмахер",
    "барбер",
    "маникюр",
    "ногти",
    "педикюр",
    "брови",
    "ресницы",
    "косметолог",
    "массаж",
    "спа",
    "визаж",
    "beauty",
    "barber",
    "spa",
    "nails",
  ],
  shop: [
    "одежда",
    "магазин",
    "обувь",
    "шопинг",
    "джинсы",
    "платье",
    "куртка",
    "аксессуары",
    "бутик",
    "кийим",
    "shop",
    "clothes",
    "store",
  ],
  sport: [
    "спорт",
    "фитнес",
    "зал",
    "тренажер",
    "йога",
    "бассейн",
    "бокс",
    "танцы",
    "тренировка",
    "sport",
    "gym",
    "fitness",
    "yoga",
  ],
  auto: [
    "авто",
    "машина",
    "автосервис",
    "сто",
    "шины",
    "шиномонтаж",
    "мойка",
    "автомойка",
    "масло",
    "запчасти",
    "ремонт авто",
    "унаа",
    "car",
    "auto",
    "wash",
  ],
  home: [
    "дом",
    "уборка",
    "клининг",
    "ремонт",
    "химчистка",
    "сантехник",
    "электрик",
    "мебель",
    "доставка",
    "услуги",
    "cleaning",
    "home",
    "repair",
  ],
};

const EN = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`";
const RU = "йцукенгшщзхъфывапролджэячсмитьбюё";

/** Набрали по-русски, забыв переключить раскладку: «rjat» → «кофе». */
export function fromEnglishLayout(text: string) {
  return text
    .toLowerCase()
    .split("")
    .map((char) => {
      const index = EN.indexOf(char);
      return index === -1 ? char : RU[index];
    })
    .join("");
}

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
  й: "i",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  ң: "n",
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
  ц: "c",
  ч: "ch",
  ш: "sh",
  щ: "sh",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

/** Один вид для сравнения: нижний регистр, латиница, без знаков. «Кофе» и «kofe» совпадут. */
function normalize(text: string) {
  return text
    .toLowerCase()
    .split("")
    .map((char) => TRANSLIT[char] ?? char)
    .join("")
    .replace(/[^a-z0-9%]+/g, " ")
    .replace(/([a-z])\1(?!\1)/g, "$1") // двойная буква — одна: «coffee» и «kofe», «pizza» и «pica»
    .replace(/c(?=[eiy])/g, "s")
    .replace(/[ck]/g, "k")
    .trim();
}

function words(text: string) {
  return normalize(text).split(" ").filter(Boolean);
}

/** Слова запроса: одна буква — не запрос, по ней совпадёт что угодно. */
function queryWords(text: string) {
  return words(text).filter((word) => word.length >= 2);
}

/** Сколько правок отделяет два слова, но не дальше предела — длинные слова не считаем зря. */
function distance(a: string, b: string, limit: number) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let best = i;
    for (let j = 1; j <= b.length; j += 1) {
      const value = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
      current.push(value);
      best = Math.min(best, value);
    }
    if (best > limit) return limit + 1;
    previous = current;
  }
  return previous[b.length]!;
}

/** Насколько слово запроса похоже на слово текста: 1 — точно, 0 — мимо. */
function wordScore(token: string, word: string) {
  if (word === token) return 1;
  if (word.startsWith(token)) return 0.9;
  if (token.length >= 3 && word.includes(token)) return 0.6;
  if (token.length < 4) return 0;
  // Опечатка: сравниваем с началом слова той же длины — «кофен» найдёт «кофейня»
  const limit = token.length >= 7 ? 2 : 1;
  const head = word.slice(0, token.length);
  return distance(token, head, limit) <= limit || distance(token, word, limit) <= limit ? 0.5 : 0;
}

function bestScore(token: string, text: string) {
  return words(text).reduce((best, word) => Math.max(best, wordScore(token, word)), 0);
}

export type CategoryHit = { label: string; count: number };
export type PartnerHit = { partner: PublicPartner; score: number };
export type SearchResult = {
  partners: PartnerHit[];
  categories: CategoryHit[];
  /** Запрос прочитан в другой раскладке — скажем об этом человеку. */
  readAs: string | null;
  minPercent: number | null;
};

const categoryWords = (label: string) => {
  const known = PARTNER_CATEGORIES.find((category) => category.label === label);
  return [label, ...(known ? [known.one, ...(CATEGORY_WORDS[known.id] ?? [])] : [])];
};

function run(query: string, partners: PublicPartner[], allCategories: string[]) {
  const percent = query.match(/(\d{1,3})\s*%/);
  const minPercent = percent ? Number(percent[1]) : null;
  const tokens = queryWords(query.replace(/(\d{1,3})\s*%/, " "));

  const categoryScore = (label: string) =>
    tokens.length === 0
      ? 0
      : Math.min(...tokens.map((token) => Math.max(...categoryWords(label).map((word) => bestScore(token, word)))));

  const categories = allCategories
    .map((label) => ({ label, score: categoryScore(label) }))
    .filter((item) => item.score >= 0.5)
    .sort((a, b) => b.score - a.score)
    .map(({ label }) => ({ label, count: partners.filter((partner) => partner.category === label).length }));

  const scored = partners
    .filter((partner) => minPercent === null || (partner.maxCoveragePercent ?? 0) >= minPercent)
    .map((partner) => {
      if (tokens.length === 0) return { partner, score: 1 };
      // Каждое слово запроса должно найтись: в названии дороже, в описании дешевле
      const perToken = tokens.map((token) =>
        Math.max(
          bestScore(token, partner.name) * 3,
          (partner.category
            ? categoryWords(partner.category).reduce((best, word) => Math.max(best, bestScore(token, word)), 0)
            : 0) * 2,
          bestScore(token, partner.description ?? ""),
        ),
      );
      const score = perToken.every((value) => value > 0) ? perToken.reduce((sum, value) => sum + value, 0) : 0;
      // Название начинается с запроса — первым
      return { partner, score: score + (normalize(partner.name).startsWith(tokens.join(" ")) ? 2 : 0) };
    })
    .filter((hit) => hit.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        // Искали по проценту — сначала те, где бонусами закрывают больше
        (minPercent !== null ? (b.partner.maxCoveragePercent ?? 0) - (a.partner.maxCoveragePercent ?? 0) : 0) ||
        a.partner.name.localeCompare(b.partner.name, "ru"),
    );

  return { partners: scored, categories, minPercent };
}

export function searchPartners(query: string, partners: PublicPartner[], allCategories: string[]): SearchResult {
  const trimmed = query.trim();
  const direct = run(trimmed, partners, allCategories);
  // Ничего не нашлось, а в запросе латиница — может, забыли переключить раскладку
  if (direct.partners.length === 0 && direct.categories.length === 0 && /[a-z]/i.test(trimmed)) {
    const switched = fromEnglishLayout(trimmed);
    const retry = run(switched, partners, allCategories);
    if (retry.partners.length > 0 || retry.categories.length > 0) return { ...retry, readAs: switched };
  }
  return { ...direct, readAs: null };
}

/** Где в названии совпало слово запроса — чтобы подсветить. */
export function highlight(text: string, query: string): { text: string; hit: boolean }[] {
  const needle = query
    .trim()
    .toLowerCase()
    .replace(/(\d{1,3})\s*%/, "")
    .trim();
  if (needle.length < 2) return [{ text, hit: false }];
  const index = text.toLowerCase().indexOf(needle);
  if (index === -1) return [{ text, hit: false }];
  return [
    { text: text.slice(0, index), hit: false },
    { text: text.slice(index, index + needle.length), hit: true },
    { text: text.slice(index + needle.length), hit: false },
  ].filter((part) => part.text);
}
