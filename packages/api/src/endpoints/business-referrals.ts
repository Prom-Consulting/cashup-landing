import type { ApiClient } from "../http";
import { businessReferralDashboardSchema } from "../schemas/business-referrals";

/**
 * «Приведи заведение» — кабинет реферера. Доступ только владельцу (admin); шлюз
 * сам подставляет заведение из токена. Дашборд до подключения — JSON null.
 */
export const businessReferralsApi = (api: ApiClient) => ({
  dashboard: (merchantId: string) =>
    api.request(businessReferralDashboardSchema.nullable(), `/admin/v1/merchants/${merchantId}/business-referrals`),

  enroll: (merchantId: string) =>
    api.request(businessReferralDashboardSchema, `/admin/v1/merchants/${merchantId}/business-referrals/enroll`, {
      method: "POST",
      body: {},
    }),
});
