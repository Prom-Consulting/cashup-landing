import { z } from "zod";

/**
 * Списание бонусов с кассы. Присылаем, что купили, почём и какую долю покрывают
 * баллы; сколько это в баллах, считает сервер: по позиции цена × процент / 100, вниз.
 */
export const purchasedItemInputSchema = z.object({
  productName: z.string().trim().min(1, "Что купили").max(200, "Не длиннее 200 символов"),
  price: z.coerce.number({ error: "Введите цену" }).positive("Цена больше нуля"),
  deductionPercent: z.coerce
    .number({ error: "Введите процент" })
    .int("Целое число процентов")
    .min(1, "Не меньше 1%")
    .max(100, "Не больше 100%"),
});

/** Предел процента на позицию зависит от магазина — схему собираем под него. */
export function redemptionInputSchema(maxPercent: number) {
  return z.object({
    cardSerialNumber: z.string().trim().min(1, "Введите номер карты"),
    /**
     * Свой номер операции: повтор с тем же номером не спишет второй раз, а вернёт
     * прежний ответ. Поэтому запрос можно смело повторять при обрыве связи.
     */
    operationId: z.string().trim().min(1, "Нужен номер операции").max(200, "Не длиннее 200 символов"),
    whatPurchased: z
      .array(
        purchasedItemInputSchema.extend({
          deductionPercent: purchasedItemInputSchema.shape.deductionPercent.max(
            maxPercent,
            `Не больше ${maxPercent}% на позицию`,
          ),
        }),
      )
      .min(1, "Добавьте хотя бы одну позицию")
      .max(50, "Не больше 50 позиций"),
    merchantId: z.string().optional(),
  });
}

export type RedemptionItemForm = { productName: string; price: number | string; deductionPercent: number | string };
export type RedemptionForm = { cardSerialNumber: string; operationId: string; whatPurchased: RedemptionItemForm[] };

export const redemptionResultSchema = z.looseObject({
  ok: z.boolean(),
  deducted: z.number(),
  balanceAfter: z.number(),
  /** Этот номер операции уже проводили: ничего не списано, баланс — текущий. */
  duplicate: z.boolean().nullish(),
});
export type RedemptionResult = z.infer<typeof redemptionResultSchema>;

/** Сколько баллов уйдёт с позиции — та же формула, что у сервера: вниз до целого. */
export function pointsForItem(price: number, percent: number) {
  if (!Number.isFinite(price) || !Number.isFinite(percent)) return 0;
  return Math.floor((price * percent) / 100);
}
