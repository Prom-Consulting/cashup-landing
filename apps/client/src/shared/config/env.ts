/** Публичная страница карты: токенов нет, только адрес API и сайта. */
export const API_URL = import.meta.env.VITE_API_URL ?? "https://loal.promconsult.pro";
export const SITE_URL = import.meta.env.VITE_SITE_URL ?? "https://loal.kg";

/** Ключ хранения не используется — входа у держателя карты нет. */
export const TOKEN_STORAGE_KEY = "loal.client.token";
