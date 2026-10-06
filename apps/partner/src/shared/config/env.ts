/** Адреса и ключи кабинета партнёра. Значения подставляются при сборке образа. */
export const API_URL = import.meta.env.VITE_API_URL ?? "https://loal.promconsult.pro";
export const SITE_URL = import.meta.env.VITE_SITE_URL ?? "https://loal.kg";

export const TOKEN_STORAGE_KEY = "loal.partner.token";

/** Кабинет бизнеса в OctōPAY: переход из карточки связи и раздел интеграций, где берут код для Loal. */
export const OCTOPAY_APP_URL = (import.meta.env.VITE_OCTOPAY_APP_URL ?? "https://octopay.click").replace(/\/$/, "");
export const OCTOPAY_BUSINESS_URL = `${OCTOPAY_APP_URL}/business`;
export const OCTOPAY_INTEGRATIONS_URL = `${OCTOPAY_APP_URL}/business/integrations`;

/** Кабинет кассира филиала: кассиров партнёра отправляем туда. */
export const CASHIER_APP_URL = import.meta.env.VITE_CASHIER_APP_URL ?? "https://cashier.loal.kg";

/** Web client ID Google (тот же, что в GOOGLE_CLIENT_IDS бэкенда). Пусто — кнопок Google нет. */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || undefined;
