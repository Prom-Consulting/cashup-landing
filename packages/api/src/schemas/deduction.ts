import { z } from "zod";

/** Строка журнала — один товар в чеке, а не чек целиком (docs/API.md). */
export const deductionSchema = z.looseObject({
  id: z.string(),
  operationId: z.string().nullish(),
  customerName: z.string().nullish(),
  productName: z.string().nullish(),
  price: z.number().nullish(),
  coveragePercent: z.number().nullish(),
  points: z.number(),
  /**
   * onec — списание пришло из 1С магазина, scanner — из нашего приложения,
   * octopay — клиент оплатил счёт партнёра, и баллы списались сами.
   */
  channel: z.string().nullish(),
  createdAt: z.string(),
});
export type Deduction = z.infer<typeof deductionSchema>;

export const deductionPageSchema = z.looseObject({
  items: z.array(deductionSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type DeductionPage = z.infer<typeof deductionPageSchema>;

export const DEDUCTION_CHANNEL_LABELS: Record<string, string> = {
  onec: "1С",
  scanner: "Приложение",
  octopay: "Оплата через OctōPAY",
};
