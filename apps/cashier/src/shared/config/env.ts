/** Адреса и ключи кабинета кассира. Значения подставляются при сборке образа. */
export const API_URL = import.meta.env.VITE_API_URL ?? "https://loal.promconsult.pro";
export const PARTNER_APP_URL = import.meta.env.VITE_PARTNER_APP_URL ?? "https://partner.loal.kg";

/** Свой ключ: на localhost кабинеты не должны делить один токен. */
export const TOKEN_STORAGE_KEY = "loal.cashier.token";
