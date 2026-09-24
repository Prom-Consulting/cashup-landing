/**
 * Настройки сборки. Адреса приходят из переменных Vite и подставляются на этапе
 * сборки образа, дефолты — боевые, чтобы забытая переменная не роняла кабинет.
 */
export const API_URL = import.meta.env.VITE_API_URL ?? "https://loal.promconsult.pro";
export const SITE_URL = import.meta.env.VITE_SITE_URL ?? "https://loal.kg";
/** Кабинет клиента: на /c/<номер> держатель добавляет карту в Wallet — эту ссылку ему и отправляем. */
export const CLIENT_APP_URL = import.meta.env.VITE_CLIENT_APP_URL ?? "https://client.loal.kg";

export const cardPageUrl = (serial: string) => `${CLIENT_APP_URL.replace(/\/$/, "")}/c/${encodeURIComponent(serial)}`;

/** Свой ключ хранения токена: на localhost кабинеты делят один домен. */
export const TOKEN_STORAGE_KEY = "loal.admin.token";
