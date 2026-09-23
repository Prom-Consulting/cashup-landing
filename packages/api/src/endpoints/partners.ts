import { z } from "zod";
import type { ApiClient } from "../http";
import { publicPartnerSchema } from "../schemas/merchant";

/** Витрина участников для каталога на сайте: профиль целиком, без токена. */
export const partnersApi = (api: ApiClient) => ({
  publicList: () => api.request(z.array(publicPartnerSchema), "/v1/public/partners", { anonymous: true }),
});
