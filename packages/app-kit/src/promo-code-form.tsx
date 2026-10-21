import {
  bonusesText,
  monthsText,
  promoErrorText,
  redeemPromoInputSchema,
  type PromoRedeemResult,
  type RedeemPromoInput,
} from "@loal/api";
import { FocusFirstError, fieldError, zodValidate } from "@loal/forms";
import { Button, FormField, FormStatus, Input } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState, type ReactNode } from "react";

const until = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

function acceptedText(result: PromoRedeemResult): string {
  if (result.reward === "bonuses" && result.bonusAmount != null) {
    const date = result.expiresAt ? ` — потратьте до ${until.format(new Date(result.expiresAt))}` : "";
    return `Промокод ${result.code} принят: +${bonusesText(result.bonusAmount)} на карте${date}.`;
  }
  return `Промокод ${result.code} принят: +${monthsText(result.months ?? 0)} подписки.`;
}

/**
 * Поле «Промокод» на бесплатные месяцы подписки или бонусы — у магазина и у держателя карты.
 * Каждый код — один раз на магазин или человека; регистр неважен, сервер хранит заглавными.
 * `renderHint` показывает под полем подсказку к ошибке — например, «Купить подписку».
 */
export function PromoCodeForm({
  redeem,
  renderHint,
}: {
  redeem: (input: RedeemPromoInput) => Promise<PromoRedeemResult>;
  renderHint?: (errorText: string) => ReactNode;
}) {
  const [done, setDone] = useState<string>();
  const initialValues: RedeemPromoInput = { code: "" };

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(redeemPromoInputSchema)}
      onSubmit={async (values, helpers) => {
        setDone(undefined);
        try {
          const result = await redeem(values);
          helpers.resetForm();
          setDone(acceptedText(result));
        } catch (error) {
          helpers.setFieldError("code", promoErrorText(error));
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => {
        const error = fieldError(form, "code");
        return (
          <Form noValidate className="flex flex-col gap-3">
            <FocusFirstError form={form} />
            <FormField label="Промокод" error={error}>
              {(parts) => (
                <div className="flex gap-2">
                  <Input
                    {...parts}
                    name="code"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder="LOAL-7KX2QM"
                    className="font-mono uppercase"
                    value={form.values.code}
                    onChange={(event) => {
                      setDone(undefined);
                      void form.setFieldValue("code", event.target.value.toUpperCase());
                    }}
                    onBlur={form.handleBlur}
                  />
                  <Button type="submit" className="shrink-0" disabled={form.isSubmitting || !form.values.code.trim()}>
                    {form.isSubmitting ? "Проверяем…" : "Применить"}
                  </Button>
                </div>
              )}
            </FormField>
            {error && renderHint?.(error)}
            <FormStatus tone="success" message={done} />
          </Form>
        );
      }}
    </Formik>
  );
}
