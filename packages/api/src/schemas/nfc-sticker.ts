import { z } from "zod";

export const stickerKindSchema = z.enum(["physical", "digital"]);
export type StickerKind = z.infer<typeof stickerKindSchema>;

export const stickerStatusSchema = z.enum(["pending", "paid", "cancelled"]);
export type StickerStatus = z.infer<typeof stickerStatusSchema>;

export const stickerOrderSchema = z.looseObject({
  id: z.string(),
  merchantId: z.string(),
  kind: stickerKindSchema,
  status: stickerStatusSchema,
  amountKgs: z.number(),
  createdAt: z.string(),
  paidAt: z.string().nullable(),
});
export type StickerOrder = z.infer<typeof stickerOrderSchema>;

/** Раздел «NFC-стикер» в кабинете партнёра: цена и заказ (null, если тариф не «more_clients»). */
export const merchantStickerSchema = z.looseObject({
  priceKgs: z.number(),
  order: stickerOrderSchema.nullable(),
});
export type MerchantSticker = z.infer<typeof merchantStickerSchema>;

/** Строка списка у супер-админа: заказ плюс заведение (для ссылки на каталог и печати). */
export const adminStickerOrderSchema = stickerOrderSchema.extend({
  merchantName: z.string(),
  category: z.string().nullable(),
});
export type AdminStickerOrder = z.infer<typeof adminStickerOrderSchema>;
