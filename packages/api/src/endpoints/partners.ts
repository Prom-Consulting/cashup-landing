import { z } from "zod";
import type { ApiClient } from "../http";
import {
  partnerMemberSchema,
  partnerPaymentPageSchema,
  publicPartnerSchema,
  type CreateEmployeeInput,
} from "../schemas/partner";
import { storeMemberSchema } from "../schemas/store";

/** Кабинет партнёра: свой QR, сотрудники и платежи, прошедшие через его сканер. */
export const partnersApi = (api: ApiClient) => ({
  me: (partnerMemberId: string) => api.request(partnerMemberSchema, `/admin/v1/members/${partnerMemberId}`),

  employees: (partnerMemberId: string) =>
    api.request(z.array(storeMemberSchema), `/admin/v1/members/${partnerMemberId}/employees`),

  addEmployee: (partnerMemberId: string, input: CreateEmployeeInput) =>
    api.request(storeMemberSchema, `/admin/v1/members/${partnerMemberId}/employees`, { method: "POST", body: input }),

  payments: (
    partnerMemberId: string,
    query: { page?: number; pageSize?: number; sort?: string; order?: string } = {},
  ) => api.request(partnerPaymentPageSchema, `/admin/v1/partners/${partnerMemberId}/payments`, { query }),

  /** Публичный список активных партнёров — для каталога на лендинге. */
  publicList: () => api.request(z.array(publicPartnerSchema), "/v1/public/partners", { anonymous: true }),
});
