import { cashbackSettingsInputSchema, type CashbackSettings, type CashbackSettingsInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, Card, FormField, FormStatus, Input } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useSetCashbackSettings } from "../../entities/platform/api";

const money = new Intl.NumberFormat("ru-RU");

/**
 * Кэшбэк на кассе (Доп. №5): «Больше клиентов» и «Очень много клиентов». Сумму покупки вводит
 * кассир, поэтому процент и дневной предел на клиента в одном заведении — у агентства.
 */
export function CashbackSettingsForm({ settings }: { settings: CashbackSettings }) {
  const save = useSetCashbackSettings();
  const [saved, setSaved] = useState(false);
  const initialValues: CashbackSettingsInput = { percent: settings.percent, dailyCap: settings.dailyCap };
  const example = Math.floor((1000 * settings.percent) / 100);

  return (
    <Card className="flex flex-col">
      <h2 className="display text-[1.6rem] leading-tight">Кэшбэк на кассе</h2>
      <p className="mt-1 max-w-[64ch] text-base leading-snug text-muted-foreground">
        Тарифы «Больше клиентов» и «Очень много клиентов»: кассир сканирует карту и вводит сумму покупки деньгами, клиент
        получает процент бонусами на 90 дней. Сейчас покупка на 1 000 сом даёт {money.format(example)} бонусов.
      </p>
      <Formik
        initialValues={initialValues}
        enableReinitialize
        validate={zodValidate(cashbackSettingsInputSchema)}
        onSubmit={async (values, helpers) => {
          helpers.setStatus(undefined);
          setSaved(false);
          try {
            await save.mutateAsync(values);
            setSaved(true);
          } catch (error) {
            applyServerIssues(error, helpers, "Не удалось сохранить кэшбэк");
          } finally {
            helpers.setSubmitting(false);
          }
        }}
      >
        {(form) => (
          <Form className="mt-5 flex flex-col gap-4" noValidate onChange={() => setSaved(false)}>
            <FocusFirstError form={form} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Процент от покупки" hint="Например, 5 — это 50 бонусов за 1 000 сом." error={fieldError(form, "percent")}>
                {(parts) => (
                  <div className="relative max-w-[280px]">
                    <Input
                      {...parts}
                      name="percent"
                      inputMode="decimal"
                      className="pr-12 text-xl tabular-nums"
                      value={String(form.values.percent ?? "")}
                      onChange={(event) => void form.setFieldValue("percent", event.target.value.replace(",", "."))}
                      onBlur={form.handleBlur}
                    />
                    <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-base text-muted-foreground">%</span>
                  </div>
                )}
              </FormField>
              <FormField
                label="Предел в день"
                hint="Больше этого один клиент в одном заведении за день не получит."
                error={fieldError(form, "dailyCap")}
              >
                {(parts) => (
                  <div className="relative max-w-[280px]">
                    <Input
                      {...parts}
                      name="dailyCap"
                      inputMode="numeric"
                      className="pr-24 text-xl tabular-nums"
                      value={String(form.values.dailyCap ?? "")}
                      onChange={form.handleChange}
                      onBlur={form.handleBlur}
                    />
                    <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-base text-muted-foreground">
                      бонусов
                    </span>
                  </div>
                )}
              </FormField>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" disabled={form.isSubmitting || !form.dirty}>
                {form.isSubmitting ? "Сохраняем…" : "Сохранить кэшбэк"}
              </Button>
              <FormStatus message={formError(form)} />
              <FormStatus tone="success" message={saved && !form.dirty ? "Кэшбэк сохранён" : undefined} />
            </div>
          </Form>
        )}
      </Formik>
    </Card>
  );
}
