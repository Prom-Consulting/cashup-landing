import { z } from "zod";
import { storeMemberSchema } from "./store";

/** Партнёр умеет ровно одну операцию сканирования — начислять или списывать. */
export const scanOperationSchema = z.enum(["earn", "redeem"]);
export type ScanOperation = z.infer<typeof scanOperationSchema>;

export const partnerMemberSchema = storeMemberSchema.extend({
  enrollQrUrl: z.string().nullish(),
  partnerPaidUntil: z.string().nullish(),
});
export type PartnerMember = z.infer<typeof partnerMemberSchema>;

/** Публичный список активных партнёров — им пользуется каталог на лендинге. */
export const publicPartnerSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  paidUntil: z.string(),
});
export type PublicPartner = z.infer<typeof publicPartnerSchema>;

export const partnerPaymentRowSchema = z.looseObject({
  id: z.string(),
  customerName: z.string(),
  txType: scanOperationSchema,
  amount: z.number(),
  createdAt: z.string(),
});
export type PartnerPaymentRow = z.infer<typeof partnerPaymentRowSchema>;

export const partnerPaymentPageSchema = z.looseObject({
  items: z.array(partnerPaymentRowSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type PartnerPaymentPage = z.infer<typeof partnerPaymentPageSchema>;

export const createEmployeeInputSchema = z.object({
  userId: z.string().trim().min(1, "Укажите пользователя"),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeInputSchema>;
