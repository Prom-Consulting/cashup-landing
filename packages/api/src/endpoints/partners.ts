import { z } from "zod";
import type { ApiClient } from "../http";
import { publicPartnerSchema } from "../schemas/merchant";
import { cardExampleSchema } from "../schemas/template";

/** Витрина участников для каталога на сайте: профиль целиком, без токена. */
export const partnersApi = (api: ApiClient) => ({
  publicList: () => api.request(z.array(publicPartnerSchema), "/v1/public/partners", { anonymous: true }),

  /**
   * Примеры карт: те, что агентство отметило витриной, а если таких нет — заготовки
   * библиотеки. Без полей и картинок заготовок — только вид.
   */
  cardExamples: () => api.request(z.array(cardExampleSchema), "/v1/public/card-examples", { anonymous: true }),
});
