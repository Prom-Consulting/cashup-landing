import { z } from "zod";
import { getDeviceId } from "../device";
import type { ApiClient } from "../http";
import { referralCodeSchema } from "../schemas/auth";

/**
 * REF-01, публичная часть: отметить переход по ссылке приглашения. deviceId — тот же
 * постоянный, что потом уйдёт в регистрацию. 404 — код недействителен, 409 — ссылку
 * открыли с устройства самого пригласившего.
 */
export const referralsApi = (api: ApiClient) => ({
  visit: (code: string) =>
    api.request(z.unknown(), `/v1/public/referrals/${encodeURIComponent(referralCodeSchema.parse(code))}/visit`, {
      method: "POST",
      body: { deviceId: getDeviceId() },
      anonymous: true,
    }),
});
