import { tariffPriceInputSchema, type MerchantTariffPlan, type TariffPriceInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Badge, Button, Card, FormField, FormStatus, Input } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useSetTariffPrice } from "../../entities/platform/api";
import { formatDateTime } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");

/** Что значит цена каждого тарифа — коротко, для агентства. */
const ABOUT: Record<string, { title: string; text: string; free: string }> = {
  loal: {
    title: "Только Loal",
    text: "Счёт магазину выставляет Loal по этой цене за месяц.",
    free: "Пока 0 — подписка не нужна: магазин принимает бонусы и виден в каталоге без оплаты, а кнопка счёта отвечает «доступ бесплатный».",
  },
  loal_octopay: {
    title: "Loal + OctōPAY",
    text: "Эту цену читает OctōPAY и сам ведёт подписку своих партнёров. Пока связь включена, Loal пускает магазин без подписки.",
    free: "0 — OctōPAY не выставляет счёт.",
  },
};

export function TariffPriceForm({ tariff }: { tariff: MerchantTariffPlan }) {
  const save = useSetTariffPrice();
  const [saved, setSaved] = useState(false);
  const about = ABOUT[tariff.code];
  const initialValues: TariffPriceInput = { priceKgs: tariff.priceKgs };

  return (
    <Card className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="display text-[1.6rem] leading-tight">{tariff.name ?? about?.title ?? tariff.code}</h2>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{tariff.code}</p>
        </div>
        <Badge tone={tariff.priceKgs === 0 ? "good" : "neutral"}>
          {tariff.priceKgs === 0 ? "Бесплатно" : `${money.format(tariff.priceKgs)} сом/мес`}
        </Badge>
      </div>
      {about && <p className="mt-3 max-w-[56ch] text-base leading-snug text-muted-foreground">{about.text}</p>}

      <Formik
        initialValues={initialValues}
        enableReinitialize
        validate={zodValidate(tariffPriceInputSchema)}
        onSubmit={async (values, helpers) => {
          helpers.setStatus(undefined);
          setSaved(false);
          try {
            await save.mutateAsync({ code: tariff.code, input: values });
            setSaved(true);
          } catch (error) {
            applyServerIssues(error, helpers, "Не удалось сохранить цену");
          } finally {
            helpers.setSubmitting(false);
          }
        }}
      >
        {(form) => {
          const value = Number(form.values.priceKgs);
          const hint =
            String(form.values.priceKgs).trim() !== "" && value === 0
              ? (about?.free ?? "0 — бесплатно.")
              : "Целые сомы за месяц. 0 — бесплатно.";
          return (
            <Form className="mt-5 flex flex-1 flex-col gap-4" noValidate onChange={() => setSaved(false)}>
              <FocusFirstError form={form} />
              <FormField label="Цена за месяц" hint={hint} error={fieldError(form, "priceKgs")}>
                {(parts) => (
                  <div className="relative max-w-[280px]">
                    <Input
                      {...parts}
                      name="priceKgs"
                      inputMode="numeric"
                      className="pr-20 text-xl tabular-nums"
                      value={String(form.values.priceKgs ?? "")}
                      onChange={form.handleChange}
                      onBlur={form.handleBlur}
                    />
                    <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-base text-muted-foreground">
                      сом/мес
                    </span>
                  </div>
                )}
              </FormField>
              <div className="mt-auto flex flex-wrap items-center gap-4">
                <Button type="submit" disabled={form.isSubmitting || !form.dirty}>
                  {form.isSubmitting ? "Сохраняем…" : "Сохранить цену"}
                </Button>
                <FormStatus message={formError(form)} />
                <FormStatus tone="success" message={saved && !form.dirty ? "Цена сохранена" : undefined} />
              </div>
              {tariff.updatedAt && (
                <p className="text-sm text-muted-foreground">Изменена {formatDateTime(tariff.updatedAt)}</p>
              )}
            </Form>
          );
        }}
      </Formik>
    </Card>
  );
}
