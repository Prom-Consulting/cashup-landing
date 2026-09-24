import type { ApiClient } from "../http";
import { enrollInfoSchema, enrollInputSchema, enrollResultSchema, type EnrollInput } from "../schemas/enroll";

/**
 * Самостоятельная выдача карты по QR — без токена. Без идентификаторов в адресе
 * выдаётся карта платформы по умолчанию; с ними — названная явно.
 */
export const enrollApi = (api: ApiClient) => ({
  info: (templateId?: string) =>
    api.request(enrollInfoSchema, templateId ? `/v1/public/enroll/${templateId}` : "/v1/public/enroll", {
      anonymous: true,
    }),

  /** Если карта у человека уже есть, сервер вернёт её же, а не выпустит вторую. */
  enroll: (input: EnrollInput, target?: { templateId: string; programId: string }) =>
    api.request(
      enrollResultSchema,
      target ? `/v1/public/enroll/${target.templateId}/${target.programId}` : "/v1/public/enroll",
      { method: "POST", body: enrollInputSchema.parse(input), anonymous: true },
    ),
});
