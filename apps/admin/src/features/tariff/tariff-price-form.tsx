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
    title: "Больше клиентов",
    text: "Счёт магазину выставляет Loal по этой цене за месяц.",
    free: "Пока 0 — подписка не нужна: магазин принимает бонусы и виден в каталоге без оплаты, а кнопка счёта отвечает «доступ бесплатный».",
  },
  loal_octopay: {
    title: "Ещё больше клиентов",
    text: "Эту цену читает OctōPAY и сам ведёт подписку своих партнёров. Пока связь включена, Loal пускает магазин без подписки.",
    free: "0 — OctōPAY не выставляет счёт.",
  },
};

export function TariffPriceForm({ tariff }: { tariff: MerchantTariffPlan }) {
  const save = useSetTariffPrice();
  const [saved, setSaved] = useState(false);
  const about = ABOUT[tariff.code];
  const initialValues: TariffPriceInput = {
    priceKgs: tariff.regularPriceKgs ?? tariff.priceKgs,
    freeMerchantLimit: tariff.freeMerchantLimit ?? 0,
  };

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
              <FormField label="Цена после заполнения бесплатных мест" hint={hint} error={fieldError(form, "priceKgs")}>
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
              <FormField
                label="Лимит бесплатных мест"
                hint="0 — без акции. Пока число подключённых заведений меньше лимита, тариф бесплатный для всех. При достижении лимита все переходят на цену выше."
                error={fieldError(form, "freeMerchantLimit")}
              >
                {(parts) => (
                  <Input {...parts} name="freeMerchantLimit" inputMode="numeric" className="max-w-[280px]"
                    value={String(form.values.freeMerchantLimit ?? 0)} onChange={form.handleChange} onBlur={form.handleBlur} />
                )}
              </FormField>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                Подключено заведений: {tariff.enrolledMerchants ?? 0}. Осталось бесплатных мест: {tariff.freePlacesRemaining ?? 0}.
                {" "}Учитываются подтверждённые заведения, каждое один раз на тариф. Отключение не возвращает место.
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-4">
                <Button type="submit" disabled={form.isSubmitting || !form.dirty}>
                  {form.isSubmitting ? "Сохраняем…" : "Сохранить тариф"}
                </Button>
                <FormStatus message={formError(form)} />
                <FormStatus tone="success" message={saved && !form.dirty ? "Тариф сохранён" : undefined} />
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
