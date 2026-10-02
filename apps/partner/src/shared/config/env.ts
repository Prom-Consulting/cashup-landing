/** Адреса и ключи кабинета партнёра. Значения подставляются при сборке образа. */
export const API_URL = import.meta.env.VITE_API_URL ?? "https://loal.promconsult.pro";
export const SITE_URL = import.meta.env.VITE_SITE_URL ?? "https://loal.kg";

export const TOKEN_STORAGE_KEY = "loal.partner.token";

/** Кабинет кассира филиала: кассиров партнёра отправляем туда. */
export const CASHIER_APP_URL = import.meta.env.VITE_CASHIER_APP_URL ?? "https://cashier.loal.kg";
