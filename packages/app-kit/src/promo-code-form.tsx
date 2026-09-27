import { promoErrorText, redeemPromoInputSchema, type PromoRedeemResult, type RedeemPromoInput } from "@loal/api";
import { FocusFirstError, fieldError, zodValidate } from "@loal/forms";
import { Button, FormField, FormStatus, Input } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState, type ReactNode } from "react";

const monthsWord = (n: number) =>
  n % 10 === 1 && n % 100 !== 11
    ? "месяц"
    : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)
      ? "месяца"
      : "месяцев";

/**
 * Поле «Промокод» на бесплатные месяцы подписки — у магазина и у держателя карты.
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
          setDone(`Промокод ${result.code} принят: +${result.months} ${monthsWord(result.months)} подписки.`);
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
