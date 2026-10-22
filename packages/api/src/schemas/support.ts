import { z } from "zod";

/**
 * Поддержка (docs/API.md, «Поддержка: вопросы магазинов»): владелец и администратор филиала
 * пишут агентству из кабинета, переписка — ветка сообщений. open — ждёт ответа агентства,
 * answered — агентство ответило, closed — закрыт. Новое сообщение магазина снова открывает ветку.
 */
export const SUPPORT_STATUSES = ["open", "answered", "closed"] as const;
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

/** Подписи со стороны магазина и агентства: одна и та же ветка читается по-разному. */
export const SUPPORT_STATUS_LABELS: Record<"merchant" | "agency", Record<SupportStatus, string>> = {
  merchant: { open: "Ждёт ответа", answered: "Есть ответ", closed: "Закрыт" },
  agency: { open: "Новый", answered: "Отвечено", closed: "Закрыт" },
};

export const supportSideSchema = z.enum(["merchant", "agency"]);
export type SupportSide = z.infer<typeof supportSideSchema>;

export const supportTicketSchema = z.looseObject({
  id: z.string(),
  merchantId: z.string(),
  subject: z.string(),
  /** Строкой: новый статус бэкенда не должен ронять экран. */
  status: z.string(),
  createdAt: z.string(),
  lastMessageAt: z.string(),
  /** Другая сторона написала после того, как вы открывали ветку. */
  unread: z.boolean().default(false),
  lastMessage: z
    .looseObject({ side: z.string(), body: z.string(), createdAt: z.string() })
    .nullish(),
  author: z.looseObject({ userId: z.string().nullish(), name: z.string().nullish(), phone: z.string().nullish() }).nullish(),
  /** Только у агентства. */
  merchantName: z.string().nullish(),
});
export type SupportTicket = z.infer<typeof supportTicketSchema>;

export const supportMessageSchema = z.looseObject({
  id: z.string(),
  side: z.string(),
  authorName: z.string().nullish(),
  body: z.string(),
  createdAt: z.string(),
});
export type SupportMessage = z.infer<typeof supportMessageSchema>;

export const supportThreadSchema = z.looseObject({
  ticket: supportTicketSchema,
  messages: z.array(supportMessageSchema),
  /** Ответ агентства: дошёл ли он автору в WhatsApp. */
  notified: z.boolean().nullish(),
});
export type SupportThread = z.infer<typeof supportThreadSchema>;

export const agencySupportListSchema = z.looseObject({
  items: z.array(supportTicketSchema),
  summary: z.looseObject({
    open: z.number().default(0),
    answered: z.number().default(0),
    closed: z.number().default(0),
    unread: z.number().default(0),
  }),
});
export type AgencySupportList = z.infer<typeof agencySupportListSchema>;

const messageSchema = z
  .string()
  .trim()
  .min(1, "Напишите сообщение")
  .max(4000, "Не длиннее 4000 символов");

export const supportTicketInputSchema = z.object({
  subject: z.string().trim().min(1, "Коротко опишите тему").max(120, "Тема — не длиннее 120 символов"),
  message: messageSchema,
});
export type SupportTicketInput = z.infer<typeof supportTicketInputSchema>;

export const supportReplyInputSchema = z.object({ message: messageSchema });
export type SupportReplyInput = z.infer<typeof supportReplyInputSchema>;
