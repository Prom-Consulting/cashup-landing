import type { ApiClient } from "../http";
import { googleSaveLinkSchema, publicPassInfoSchema } from "../schemas/card";

/**
 * Карта клиента по серийному номеру. Входа у держателя карты нет: ссылка
 * сама по себе и есть доступ, поэтому серийный номер нельзя светить в поиске.
 */
export const passesApi = (api: ApiClient) => ({
  info: (serial: string) =>
    api.request(publicPassInfoSchema, `/v1/public/passes/${encodeURIComponent(serial)}/info`, { anonymous: true }),

  googleSaveLink: (serial: string) =>
    api.request(googleSaveLinkSchema, `/v1/public/passes/${encodeURIComponent(serial)}/google-save-link`, {
      anonymous: true,
    }),

  /** Файл .pkpass отдаётся браузеру напрямую — ссылку открывает сам пользователь. */
  appleWalletUrl: (baseUrl: string, serial: string) =>
    new URL(
      `v1/public/passes/${encodeURIComponent(serial)}`,
      baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
    ).toString(),
});
