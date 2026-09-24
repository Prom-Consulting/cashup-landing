import { z } from "zod";

/**
 * Кабинет держателя карты. Идентификатора в адресе нет: сервер читает человека
 * из токена, поэтому спросить про чужую карту нельзя в принципе.
 */
export const myCardSchema = z.looseObject({
  serialNumber: z.string(),
  status: z.string(),
  pointsBalance: z.number(),
  /** Готовый адрес страницы добавления карты в Wallet — собирать самим не надо. */
  walletUrl: z.string().nullish(),
  customer: z
    .looseObject({
      firstName: z.string().nullish(),
      lastName: z.string().nullish(),
      phone: z.string().nullish(),
    })
    .nullish(),
  /** null — подписку ни разу не покупали или она закончилась. */
  subscription: z
    .looseObject({
      status: z.string(),
      periodsTotal: z.number().nullish(),
      periodsGranted: z.number().nullish(),
      currentPeriodEnd: z.string().nullish(),
    })
    .nullish(),
});
export type MyCard = z.infer<typeof myCardSchema>;

/** Что было с баллами: трата, выдача подписки, сгорание остатка. */
export const historyKindSchema = z.enum(["spend", "grant", "burn", "other"]);
export type HistoryKind = z.infer<typeof historyKindSchema>;

export const HISTORY_KIND_LABELS: Record<HistoryKind, string> = {
  spend: "Потрачено",
  grant: "Начислено по подписке",
  burn: "Сгорело",
  other: "Изменение",
};

export const historyEntrySchema = z.looseObject({
  id: z.string(),
  kind: z.string(),
  amount: z.number(),
  balanceAfter: z.number().nullish(),
  createdAt: z.string(),
  /** null у всего, что платформа делает сама, и у удалённого заведения. */
  merchantName: z.string().nullish(),
  items: z
    .array(
      z.looseObject({
        productName: z.string().nullish(),
        price: z.number().nullish(),
        points: z.number().nullish(),
      }),
    )
    .default([]),
});
export type HistoryEntry = z.infer<typeof historyEntrySchema>;

export const historyPageSchema = z.looseObject({
  items: z.array(historyEntrySchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type HistoryPage = z.infer<typeof historyPageSchema>;

/** Оплата подписки человеком, у которого карты ещё нет: карта заводится по телефону. */
export const paySubscriptionByPhoneInputSchema = z.object({
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((digits) => digits.length >= 9, "Введите номер телефона"),
  firstName: z.string().trim().min(1, "Как вас зовут?"),
  months: z.coerce.number().int().min(1).max(24),
});
export type PaySubscriptionByPhoneInput = z.infer<typeof paySubscriptionByPhoneInputSchema>;
