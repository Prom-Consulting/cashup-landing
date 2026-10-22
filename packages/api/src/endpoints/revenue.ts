import type { ApiClient } from "../http";
import { revenueReportSchema } from "../schemas/revenue";

/** Отчёт агентства: кто из заведений платит, кто на пробном периоде, кто открыт бесплатно. */
export const revenueApi = (api: ApiClient) => ({
  report: () => api.request(revenueReportSchema, "/admin/v1/revenue"),
});
