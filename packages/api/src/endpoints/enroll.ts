import type { ApiClient } from "../http";
import { enrollInfoSchema, enrollInputSchema, enrollResultSchema, type EnrollInput } from "../schemas/enroll";

/**
 * Самостоятельная выдача карты по QR — без токена: карта платформы по умолчанию.
 */
export const enrollApi = (api: ApiClient) => ({
  info: (templateId?: string) =>
    api.request(enrollInfoSchema, templateId ? `/v1/public/enroll/${templateId}` : "/v1/public/enroll", {
      anonymous: true,
    }),

  /**
   * Карта платформы по умолчанию. Если карта у человека уже есть, сервер вернёт её же.
   * Выдачу «названной» программы (/enroll/{templateId}/{programId}) бэкенд убрал.
   */
  enroll: (input: EnrollInput) =>
    api.request(enrollResultSchema, "/v1/public/enroll", {
      method: "POST",
      body: enrollInputSchema.parse(input),
      anonymous: true,
    }),
});
