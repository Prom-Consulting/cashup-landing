import type { ApiClient } from "../http";
import { cashierOverviewSchema, cashierRedemptionPageSchema, type CashierRedemptionQuery } from "../schemas/cashier";

/** Кабинет кассира филиала: человек из токена, идентификатора в адресе нет. */
export const cashierApi = (api: ApiClient) => ({
  overview: () => api.request(cashierOverviewSchema, "/v1/cashier/overview"),

  /** Только свои списания; списывают тем же POST /v1/redemptions, что и касса. */
  redemptions: (query: CashierRedemptionQuery = {}) =>
    api.request(cashierRedemptionPageSchema, "/v1/cashier/redemptions", { query }),
});
