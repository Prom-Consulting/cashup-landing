import { z } from "zod";

/**
 * Выход партнёра из программы (docs/API.md, «Выход партнёра из программы»): владелец подаёт
 * заявку, агентство подтверждает (это обычное удаление магазина) или отклоняет с причиной.
 */
export const EXIT_REQUEST_STATUSES = ["pending", "approved", "rejected"] as const;
export type ExitRequestStatus = (typeof EXIT_REQUEST_STATUSES)[number];

export const EXIT_REQUEST_STATUS_LABELS: Record<ExitRequestStatus, string> = {
  pending: "Ждёт решения",
  approved: "Подтверждена",
  rejected: "Отклонена",
};

export const exitRequestSchema = z.looseObject({
  id: z.string(),
  merchantId: z.string(),
  /** Строкой: новый статус бэкенда не должен ронять экран. */
  status: z.string(),
  reason: z.string().nullish(),
  /** keep — уходит только из Loal, delete — из Loal и из OctōPAY. */
  octopay: z.string().nullish(),
  createdAt: z.string(),
  decidedAt: z.string().nullish(),
  decisionComment: z.string().nullish(),
  /** Дошло ли решение до владельца в WhatsApp; false — повторное решение отправит снова. */
  ownerNotified: z.boolean().nullish(),
  /** Только в списке агентства. */
  merchantName: z.string().nullish(),
  requestedBy: z
    .looseObject({ userId: z.string().nullish(), name: z.string().nullish(), phone: z.string().nullish() })
    .nullish(),
});
export type ExitRequest = z.infer<typeof exitRequestSchema>;

export const exitRequestInputSchema = z.object({
  reason: z.string().trim().max(1000, "Не длиннее 1000 символов"),
  octopay: z.enum(["keep", "delete"]).default("keep"),
});
export type ExitRequestInput = z.input<typeof exitRequestInputSchema>;

export const rejectExitInputSchema = z.object({
  comment: z.string().trim().min(1, "Напишите причину — её получит владелец").max(1000, "Не длиннее 1000 символов"),
});
export type RejectExitInput = z.infer<typeof rejectExitInputSchema>;
