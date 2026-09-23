// Единые ссылки и контакты Loal. Оператор — Prom.Consulting, платежи идут через OctōPAY.

export const OCTOPAY_URL = "https://octopay.click/";
export const PROM_URL = "https://promconsulting.org";
export const EMAIL = "info@promconsult.pro";
export const PHONE = "+996 600 001 978";
export const PHONE_HREF = "tel:+996600001978";
export const PARTNER_MAIL = `mailto:${EMAIL}?subject=Подключение%20к%20Loal`;
export const CITY = "Бишкек, Кыргызстан";

// Домены: лендинг отдаётся статикой (SSG) для SEO, кабинеты — отдельные SPA на поддоменах.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://loal.promconsult.pro";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loal.kg";
export const PARTNER_APP_URL = process.env.NEXT_PUBLIC_PARTNER_APP_URL ?? "https://partner.loal.kg";
export const CLIENT_APP_URL = process.env.NEXT_PUBLIC_CLIENT_APP_URL ?? "https://client.loal.kg";
