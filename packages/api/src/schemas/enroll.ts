import { z } from "zod";
import { phoneSchema } from "./auth";

/** Что показать на странице самостоятельной выдачи: название карты и подписи доп. полей. */
export const enrollInfoSchema = z.looseObject({
  templateId: z.string(),
  templateName: z.string(),
  customField1Label: z.string().nullish(),
  customField2Label: z.string().nullish(),
});
export type EnrollInfo = z.infer<typeof enrollInfoSchema>;

/**
 * Клиент заводит себе карту сам. Если карта у него уже есть, сервер вернёт её же,
 * а не выпустит вторую.
 */
export const enrollInputSchema = z.object({
  firstName: z.string().trim().min(1, "Введите имя").max(60, "Слишком длинное имя"),
  lastName: z.string().trim().min(1, "Введите фамилию").max(60, "Слишком длинная фамилия"),
  phone: phoneSchema,
  customField1: z.string().trim().max(120, "Не длиннее 120 символов").optional(),
  customField2: z.string().trim().max(120, "Не длиннее 120 символов").optional(),
  /** Партнёр, по чьему QR пришёл клиент: из ссылки ?via=… Чужой id сервер просто отбросит. */
  enrolledByMemberId: z.string().uuid().optional(),
});
export type EnrollInput = z.input<typeof enrollInputSchema>;

export const enrollResultSchema = z.looseObject({ serialNumber: z.string() });
