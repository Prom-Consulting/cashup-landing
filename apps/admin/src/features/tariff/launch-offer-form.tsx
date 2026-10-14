import { BUSINESS_TARIFF_LABELS, isBusinessTariff, launchOfferInputSchema, type LaunchOffer, type LaunchOfferInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Badge, Button, Card, FormField, FormStatus, Input } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useSetLaunchOffer } from "../../entities/platform/api";

/**
 * Акция запуска (Доп. №5): первые места на двух нижних тарифах бесплатны столько-то месяцев.
 * Место получает заведение при регистрации (лендинг или анкета агентства); удалённое
 * освобождает место. Уже выданные месяцы смена срока не трогает.
 */
export function LaunchOfferForm({ offer }: { offer: LaunchOffer }) {
  const save = useSetLaunchOffer();
  const [saved, setSaved] = useState(false);
  const initialValues: LaunchOfferInput = { months: offer.months, seats: offer.seats };
  const taken = offer.taken ?? offer.seats - offer.left;
  const names = offer.tariffs.map((code) => (isBusinessTariff(code) ? `«${BUSINESS_TARIFF_LABELS[code].title}»` : code)).join(" и ");

  return (
    <Card className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="display text-[1.6rem] leading-tight">Бесплатно для первых заведений</h2>
          <p className="mt-1 max-w-[60ch] text-base leading-snug text-muted-foreground">
            Тарифы {names}: новое заведение получает бесплатные месяцы, пока есть места. На лендинге — «0 сом», зачёркнутая цена
            и счётчик мест.
          </p>
        </div>
        <Badge tone={offer.months > 0 && offer.left > 0 ? "good" : "quiet"}>
          {offer.months === 0 ? "Выключена" : offer.left > 0 ? `Осталось ${offer.left} из ${offer.seats}` : "Места закончились"}
        </Badge>
      </div>
      <p className="mt-3 text-base">
        Занято мест: <span className="font-bold tabular-nums">{taken}</span>
      </p>

      <Formik
        initialValues={initialValues}
        enableReinitialize
        validate={zodValidate(launchOfferInputSchema)}
        onSubmit={async (values, helpers) => {
          helpers.setStatus(undefined);
          setSaved(false);
          try {
            await save.mutateAsync(values);
            setSaved(true);
          } catch (error) {
            applyServerIssues(error, helpers, "Не удалось сохранить акцию");
          } finally {
            helpers.setSubmitting(false);
          }
        }}
      >
        {(form) => (
          <Form className="mt-5 flex flex-col gap-4" noValidate onChange={() => setSaved(false)}>
            <FocusFirstError form={form} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Сколько месяцев бесплатно"
                hint="0 — акция выключена. Уже выданные месяцы не меняются."
                error={fieldError(form, "months")}
              >
                {(parts) => (
                  <div className="relative max-w-[280px]">
                    <Input
                      {...parts}
                      name="months"
                      inputMode="numeric"
                      className="pr-16 text-xl tabular-nums"
                      value={String(form.values.months ?? "")}
                      onChange={form.handleChange}
                      onBlur={form.handleBlur}
                    />
                    <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-base text-muted-foreground">
                      мес.
                    </span>
                  </div>
                )}
              </FormField>
              <FormField label="Мест по акции" hint="Всего, вместе с занятыми." error={fieldError(form, "seats")}>
                {(parts) => (
                  <div className="relative max-w-[280px]">
                    <Input
                      {...parts}
                      name="seats"
                      inputMode="numeric"
                      className="pr-16 text-xl tabular-nums"
                      value={String(form.values.seats ?? "")}
                      onChange={form.handleChange}
                      onBlur={form.handleBlur}
                    />
                    <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-base text-muted-foreground">
                      мест
                    </span>
                  </div>
                )}
              </FormField>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" disabled={form.isSubmitting || !form.dirty}>
                {form.isSubmitting ? "Сохраняем…" : "Сохранить акцию"}
              </Button>
              <FormStatus message={formError(form)} />
              <FormStatus tone="success" message={saved && !form.dirty ? "Акция сохранена" : undefined} />
            </div>
          </Form>
        )}
      </Formik>
    </Card>
  );
}
