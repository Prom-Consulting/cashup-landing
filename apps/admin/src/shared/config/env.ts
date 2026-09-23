/**
 * Настройки сборки. Адреса приходят из переменных Vite и подставляются на этапе
 * сборки образа, дефолты — боевые, чтобы забытая переменная не роняла кабинет.
 */
export const API_URL = import.meta.env.VITE_API_URL ?? "https://loal.promconsult.pro";
export const SITE_URL = import.meta.env.VITE_SITE_URL ?? "https://loal.kg";

/** Свой ключ хранения токена: на localhost кабинеты делят один домен. */
export const TOKEN_STORAGE_KEY = "loal.admin.token";
