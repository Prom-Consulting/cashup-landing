import { z } from "zod";
import type { ApiClient } from "../http";
import { invoiceSchema } from "../schemas/billing";
import {
  adminStickerOrderSchema,
  merchantStickerSchema,
  stickerOrderSchema,
  type StickerKind,
  type StickerStatus,
} from "../schemas/nfc-sticker";

/**
 * NFC-стикеры заведений. В кабинете партнёра (владелец) — свой заказ: статус, тип и разовая оплата.
 * У супер-админа — список всех заказов (по умолчанию оплаченных) для выгрузки на печать.
 */
export const nfcStickerApi = (api: ApiClient) => ({
  /** Цена и заказ стикера заведения (создаётся лениво для тарифа «Больше клиентов»). */
  get: (merchantId: string) =>
    api.request(merchantStickerSchema, `/admin/v1/merchants/${encodeURIComponent(merchantId)}/nfc-sticker`),

  /** Физический или цифровой (онлайн-магазин) — пока заказ не оплачен. */
  setKind: (merchantId: string, kind: StickerKind) =>
    api.request(stickerOrderSchema, `/admin/v1/merchants/${encodeURIComponent(merchantId)}/nfc-sticker`, {
      method: "PATCH",
      body: { kind },
    }),

  /** Разовый счёт OctōPAY за стикер: возвращает платёж с paymentUrl. */
  pay: (merchantId: string) =>
    api.request(invoiceSchema, `/admin/v1/merchants/${encodeURIComponent(merchantId)}/nfc-sticker/pay`, {
      method: "POST",
    }),

  /** Супер-админ: заказы стикеров, по умолчанию только оплаченные. */
  adminList: (status: StickerStatus | "all" = "paid") =>
    api.request(z.array(adminStickerOrderSchema), `/admin/v1/nfc-sticker-orders`, { query: { status } }),
});
