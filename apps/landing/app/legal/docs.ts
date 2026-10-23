import userAgreement from "./_content/user-agreement";
import privacy from "./_content/privacy";
import programRules from "./_content/program-rules";
import dataConsent from "./_content/data-consent";

/**
 * Правовые документы Loal. Тексты — в _content (встроены в бандл из docs/additional),
 * title и description страниц — в app/_data/seo.ts (LEGAL_SEO). Здесь только то, что
 * показывает сама страница: короткая подпись для меню и заголовок h1. Порядок важен —
 * в нём документы идут в футере, на хабе /legal и в карте сайта.
 */
export type LegalSlug = "user-agreement" | "privacy" | "program-rules" | "data-consent";

export type LegalDoc = {
  slug: LegalSlug;
  /** Короткая подпись: футер, хаб, строка согласия при регистрации. */
  nav: string;
  /** Заголовок страницы (h1). */
  h1: string;
  /** Одно предложение о содержании — подводка на хабе /legal. */
  summary: string;
  text: string;
};

export const LEGAL_UPDATED = "22 октября 2026 года";

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "user-agreement",
    nav: "Пользовательское соглашение",
    h1: "Пользовательское соглашение Loal",
    summary: "Условия использования сервиса, подписки, бонусов и цифровой карты.",
    text: userAgreement,
  },
  {
    slug: "privacy",
    nav: "Политика конфиденциальности",
    h1: "Условия конфиденциальности Loal",
    summary: "Как мы собираем, храним и защищаем персональные данные.",
    text: privacy,
  },
  {
    slug: "program-rules",
    nav: "Правила программы",
    h1: "Правила программы лояльности Loal",
    summary: "Участие, использование бонусов, требования к партнёрам и модерация.",
    text: programRules,
  },
  {
    slug: "data-consent",
    nav: "Согласие на обработку ПД",
    h1: "Согласие на обработку персональных данных",
    summary: "Условия, на которых пользователь даёт согласие на обработку данных.",
    text: dataConsent,
  },
];

export const legalPath = (slug: LegalSlug) => `/legal/${slug}`;

export const legalDoc = (slug: string): LegalDoc | undefined => LEGAL_DOCS.find((doc) => doc.slug === slug);
