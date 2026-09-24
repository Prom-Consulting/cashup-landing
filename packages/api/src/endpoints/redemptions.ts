import type { ApiClient } from "../http";
import { redemptionInputSchema, redemptionResultSchema, type RedemptionForm } from "../schemas/redemption";

/**
 * Списание бонусов с кассы. Магазин в адресе не передаётся: сервер берёт его из того,
 * где работает вошедший кассир. Работает в нескольких — нужен merchantId, иначе 400.
 */
export const redemptionsApi = (api: ApiClient) => ({
  /**
   * При любом отказе ничего не списано: 400 — процент выше потолка магазина,
   * 403 — подписка магазина неактивна, 404 — карты нет, 409 — не хватает баллов.
   */
  redeem: (input: RedemptionForm & { merchantId?: string }, maxPercent: number) =>
    api.request(redemptionResultSchema, "/v1/redemptions", {
      method: "POST",
      body: redemptionInputSchema(maxPercent).parse(input),
    }),
});
