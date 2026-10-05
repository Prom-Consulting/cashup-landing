// Единые ссылки и контакты Loal. Оператор — Prom.Consulting, платежи идут через OctōPAY.

export const OCTOPAY_URL = "https://octopay.click/";
export const PROM_URL = "https://promconsulting.org";
export const EMAIL = "info@promconsult.pro";
export const PHONE = "+996 776 822 226";
export const PHONE_HREF = "tel:+996776822226";
export const PARTNER_MAIL = `mailto:${EMAIL}?subject=Подключение%20к%20Loal`;
export const CITY = "Бишкек, Кыргызстан";

// Реквизиты юрлица. Название пишем как в документах — «LOAL», а не бренд «Loal».
export const LEGAL_NAME = "ОсОО «LOAL»";
export const LEGAL_INN = "01409202610283";
export const LEGAL_ADDRESS = "Кыргызская Республика, г. Бишкек, Свердловский район, ул. Ибраимова, 115";

// Домены: лендинг отдаётся статикой (SSG) для SEO, кабинеты — отдельные SPA на поддоменах.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://loal.promconsult.pro";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loal.kg";
export const PARTNER_APP_URL = process.env.NEXT_PUBLIC_PARTNER_APP_URL ?? "https://partner.loal.kg";
export const CLIENT_APP_URL = process.env.NEXT_PUBLIC_CLIENT_APP_URL ?? "https://client.loal.kg";
