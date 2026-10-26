import { z } from "zod";

/**
 * «Приведи заведение»: кабинет реферера (владелец заведения). Заведение приглашает
 * другое заведение; за оплатившее тариф приведённое — бесплатные месяцы тарифа.
 * Дашборд может быть null — реферальная программа ещё не подключена.
 */
export const businessReferralItemSchema = z.looseObject({
  name: z.string(),
  status: z.string(),
  joinedAt: z.string(),
  /** Приведённое заведение оплатило тариф — награда начислена. */
  rewarded: z.boolean(),
});
export type BusinessReferralItem = z.infer<typeof businessReferralItemSchema>;

export const businessReferralDashboardSchema = z.looseObject({
  code: z.string(),
  referralUrl: z.string(),
  isActive: z.boolean(),
  /** Сколько бесплатных месяцев тарифа даёт одно оплатившее приведённое заведение. */
  rewardMonths: z.number(),
  stats: z.looseObject({
    invited: z.number(),
    rewarded: z.number(),
    monthsEarned: z.number(),
  }),
  referrals: z.array(businessReferralItemSchema),
});
export type BusinessReferralDashboard = z.infer<typeof businessReferralDashboardSchema>;
