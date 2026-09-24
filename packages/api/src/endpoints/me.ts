import type { ApiClient } from "../http";
import { historyPageSchema, myCardSchema } from "../schemas/me";

/** Кабинет держателя карты: своя карта и своя история, обе — по токену. */
export const meApi = (api: ApiClient) => ({
  /** 404 — карты ещё не выпускали; это не ошибка, а состояние экрана. */
  card: () => api.request(myCardSchema, "/v1/me/card"),

  history: (query: { page?: number; pageSize?: number } = {}) =>
    api.request(historyPageSchema, "/v1/me/history", { query }),
});
