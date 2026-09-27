import { z } from "zod";
import type { ApiClient } from "../http";
import {
  createPromoBody,
  promoCodeSchema,
  promoRedeemResultSchema,
  promoRedemptionSchema,
  redeemPromoInputSchema,
  type CreatePromoForm,
  type PromoAudience,
  type RedeemPromoInput,
  type UpdatePromoInput,
} from "../schemas/promo";

/** Промокоды: управляет агентство, применяют магазин (своя подписка) и клиент (подписка карты). */
export const promoApi = (api: ApiClient) => ({
  list: (query: { audience?: PromoAudience; includeDeleted?: boolean } = {}) =>
    api.request(z.array(promoCodeSchema), "/admin/v1/promo-codes", {
      query: { audience: query.audience, includeDeleted: query.includeDeleted ? "true" : undefined },
    }),

  /** Код уже есть — 409. Не прислать код — сервер сгенерирует LOAL-XXXXXX. */
  create: (values: CreatePromoForm) =>
    api.request(promoCodeSchema, "/admin/v1/promo-codes", { method: "POST", body: createPromoBody(values) }),

  /** months и audience не меняются — для них выпускают новый код. */
  update: (id: string, input: UpdatePromoInput) =>
    api.request(promoCodeSchema, `/admin/v1/promo-codes/${id}`, { method: "PATCH", body: input }),

  /** История применений остаётся; увидеть удалённый — ?includeDeleted=true. */
  remove: (id: string) => api.request(z.unknown(), `/admin/v1/promo-codes/${id}`, { method: "DELETE" }),

  redemptions: (id: string) => api.request(z.array(promoRedemptionSchema), `/admin/v1/promo-codes/${id}/redemptions`),

  /** Месяцы добавляются к подписке магазина. Применяет владелец или партнёр, кассиру 403. */
  redeemForMerchant: (merchantId: string, input: RedeemPromoInput) =>
    api.request(promoRedeemResultSchema, `/admin/v1/merchants/${merchantId}/promo-code`, {
      method: "POST",
      body: redeemPromoInputSchema.parse(input),
    }),

  /** Месяцы ложатся на подписку карты как оплаченные. Без карты — 404 «Сначала получите карту». */
  redeemForMe: (input: RedeemPromoInput) =>
    api.request(promoRedeemResultSchema, "/v1/me/promo-code", {
      method: "POST",
      body: redeemPromoInputSchema.parse(input),
    }),
});

/** Отказ применения — человеческим текстом (docs/FRONTEND_NEW_FEATURES.md, 2.4). */
export function promoErrorText(error: unknown): string {
  const status = (error as { status?: number })?.status;
  const message = (error as Error)?.message ?? "";
  if (status === 404 && /^Сначала получите карту/i.test(message)) return "Сначала получите карту";
  if (status === 404) return "Промокод не найден";
  if (status === 409) return "Вы уже использовали этот промокод";
  if (status === 502) return "Не получилось — попробуйте ещё раз. Код не засчитан.";
  if (status === 403) return "Применить промокод может владелец заведения или партнёр";
  return message || "Не удалось применить промокод";
}
