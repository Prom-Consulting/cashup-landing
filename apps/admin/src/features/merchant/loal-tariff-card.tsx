import { LOAL_TARIFFS, LOAL_TARIFF_LABELS, cashbackPercentInputSchema, isLoalTariff, type CashbackPercentInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, Card, FormField, FormStatus, Input, cn } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useCashbackPercent, useSetCashbackPercent, useSetLoalTariff } from "../../entities/merchant/api";

/**
 * Тариф Loal заведения и процент кэшбэка — только агентство. Тариф меняется без оплаты (срок
 * подписки прежний; супер-админы получат уведомление о замене стикера), процент — на следующие
 * покупки, начисленное не пересчитывается.
 */
export function LoalTariffCard({ merchantId, loalTariff }: { merchantId: string; loalTariff: string | null | undefined }) {
  const setTariff = useSetLoalTariff(merchantId);
  const percent = useCashbackPercent(merchantId);
  const setPercent = useSetCashbackPercent(merchantId);
  const [saved, setSaved] = useState(false);
  const current = isLoalTariff(loalTariff) ? loalTariff : null;

  return (
    <Card className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">Тариф Loal</h2>
        <p className="mt-1 max-w-[70ch] text-base text-muted-foreground">
          Смена здесь — без оплаты, срок подписки не меняется. Не забудьте заменить NFC-стикер в точке.
        </p>
      </div>
      <div role="radiogroup" aria-label="Тариф" className="grid gap-2 sm:grid-cols-3">
        {LOAL_TARIFFS.map((code) => (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={current === code}
            disabled={setTariff.isPending || current === code}
            onClick={() => setTariff.mutate(code)}
            className={cn(
              "flex flex-col rounded-2xl border-2 px-4 py-3 text-left transition-colors disabled:cursor-default",
              current === code ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30",
            )}
          >
            <span className="text-base font-bold">{LOAL_TARIFF_LABELS[code].title}</span>
            <span className="mt-0.5 text-sm text-muted-foreground">{LOAL_TARIFF_LABELS[code].about}</span>
          </button>
        ))}
      </div>
      <FormStatus message={setTariff.isError ? "Не удалось сменить тариф — попробуйте ещё раз." : undefined} />

      {percent.data && (
        <Formik
          initialValues={{ percent: percent.data.percent ?? "" } as CashbackPercentInput}
          enableReinitialize
          validate={zodValidate(cashbackPercentInputSchema)}
          onSubmit={async (values, helpers) => {
            helpers.setStatus(undefined);
            setSaved(false);
            try {
              await setPercent.mutateAsync(values);
              setSaved(true);
            } catch (error) {
              applyServerIssues(error, helpers, "Не удалось сохранить процент");
            } finally {
              helpers.setSubmitting(false);
            }
          }}
        >
          {(form) => (
            <Form className="flex flex-wrap items-end gap-4 border-t border-border pt-5" noValidate onChange={() => setSaved(false)}>
              <FocusFirstError form={form} />
              <FormField
                label="Кэшбэк клиенту, %"
                hint={
                  percent.data.effectivePercent === null
                    ? "На этом тарифе кэшбэка нет."
                    : `Пусто — по умолчанию (${percent.data.defaultPercent}%). Сейчас клиент получает ${percent.data.effectivePercent}%.`
                }
                error={fieldError(form, "percent")}
              >
                {(parts) => (
                  <Input
                    {...parts}
                    name="percent"
                    inputMode="numeric"
                    placeholder={String(percent.data.defaultPercent)}
                    className="w-[140px] text-xl tabular-nums"
                    value={String(form.values.percent ?? "")}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </FormField>
              <Button type="submit" variant="outline" disabled={form.isSubmitting || !form.dirty}>
                {form.isSubmitting ? "Сохраняем…" : "Сохранить процент"}
              </Button>
              <FormStatus message={formError(form)} />
              <FormStatus tone="success" message={saved && !form.dirty ? "Процент сохранён" : undefined} />
            </Form>
          )}
        </Formik>
      )}
    </Card>
  );
}
