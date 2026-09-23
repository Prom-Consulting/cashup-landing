import { z } from "zod";

/** Статус магазина на платформе. */
export const storeStatusSchema = z.enum(["active", "suspended", "trial"]);
export type StoreStatus = z.infer<typeof storeStatusSchema>;

/** Этап внутренней работы над магазином — от оплаты до запуска. */
export const storeWorkflowStatusSchema = z.enum(["paid", "brief", "design", "approval", "build", "done"]);
export type StoreWorkflowStatus = z.infer<typeof storeWorkflowStatusSchema>;

export const WORKFLOW_STATUS_ORDER: StoreWorkflowStatus[] = ["paid", "brief", "design", "approval", "build", "done"];

export const WORKFLOW_STATUS_LABELS: Record<StoreWorkflowStatus, string> = {
  paid: "Оплачено",
  brief: "Бриф",
  design: "Дизайн",
  approval: "Согласование",
  build: "Сертификаты и сборка",
  done: "Готово",
};

export const STORE_STATUS_LABELS: Record<StoreStatus, string> = {
  active: "Работает",
  suspended: "Приостановлен",
  trial: "Пробный",
};

/** issuer — сам Loal, он выпускает карты; merchant — заведение, принимающее их. */
export const storeKindSchema = z.enum(["issuer", "merchant"]);
export type StoreKind = z.infer<typeof storeKindSchema>;

export const storeSchema = z.looseObject({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  kind: storeKindSchema,
  status: storeStatusSchema,
  workflowStatus: storeWorkflowStatusSchema,
  contactEmail: z.string().nullish(),
  contactPhone: z.string().nullish(),
  logoUrl: z.string().nullish(),
  createdAt: z.string(),
  subscriptionPaidUntil: z.string().nullish(),
});
export type Store = z.infer<typeof storeSchema>;

export const storeMemberSchema = z.looseObject({
  id: z.string(),
  storeId: z.string(),
  userId: z.string(),
  role: z.enum(["admin", "staff", "partner", "partner_employee"]),
  permissions: z.record(z.string(), z.boolean()).default({}),
  branchId: z.string().nullish(),
  invitedAt: z.string().nullish(),
  acceptedAt: z.string().nullish(),
  partnerBonusAmount: z.number().nullish(),
  partnerBonusMaxPerCustomer: z.number().nullish(),
});
export type StoreMember = z.infer<typeof storeMemberSchema>;

export const storeInviteSchema = z.looseObject({
  id: z.string(),
  storeId: z.string(),
  code: z.string(),
  createdAt: z.string().nullish(),
  redeemedAt: z.string().nullish(),
});
export type StoreInvite = z.infer<typeof storeInviteSchema>;
