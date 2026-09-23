import { z } from "zod";

/** Клиент магазина. Почти все поля необязательны: иногда известен только телефон. */
export const customerSchema = z.looseObject({
  id: z.string(),
  storeId: z.string(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  email: z.string().nullish(),
  phone: z.string().nullish(),
  externalRef: z.string().nullish(),
  createdAt: z.string(),
  archivedAt: z.string().nullish(),
});
export type Customer = z.infer<typeof customerSchema>;

export const customerPageSchema = z.looseObject({
  items: z.array(customerSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type CustomerPage = z.infer<typeof customerPageSchema>;

/**
 * Заведение клиента вручную. Хотя бы одно из полей должно быть заполнено,
 * иначе запись не отличить от пустой.
 */
export const createCustomerInputSchema = z
  .object({
    firstName: z.string().trim().max(60, "Слишком длинное имя").optional(),
    lastName: z.string().trim().max(60, "Слишком длинная фамилия").optional(),
    phone: z.string().trim().optional(),
    email: z.union([z.literal(""), z.email("Похоже, в почте опечатка")]).optional(),
  })
  .refine((v) => Boolean(v.firstName || v.lastName || v.phone || v.email), {
    message: "Заполните хотя бы имя или телефон",
    path: ["firstName"],
  });
export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

/** Выпуск карты: клиент, шаблон карты и программа лояльности. */
export const issueCardInputSchema = z.object({
  customerId: z.string().min(1, "Выберите клиента"),
  templateId: z.string().min(1, "Выберите шаблон карты"),
  programId: z.string().min(1, "Выберите программу"),
});
export type IssueCardInput = z.infer<typeof issueCardInputSchema>;

export const passTemplateSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  cardType: z.string().nullish(),
  status: z.string().nullish(),
  programId: z.string().nullish(),
});
export type PassTemplate = z.infer<typeof passTemplateSchema>;

export const loyaltyProgramSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  type: z.string().nullish(),
});
export type LoyaltyProgram = z.infer<typeof loyaltyProgramSchema>;
