import { ApiError, buyMonthsInputSchema, type BuyMonthsInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, formError, zodValidate } from "@loal/forms";
import { Button, Label } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { usePaySubscription } from "../../entities/me/api";

const MONTHS = [1, 3, 6, 12];

const initialValues = { months: 1 } as BuyMonthsInput;

/**
 * Продление подписки по уже выпущенной карте. Ссылку на оплату открываем в этой же
 * вкладке: после оплаты OctōPAY возвращает человека обратно, баланс уже обновлён.
 */
export function PaySubscriptionForm({ serial }: { serial: string }) {
  const pay = usePaySubscription(serial);

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(buyMonthsInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          const invoice = await pay.mutateAsync(values);
          if (invoice.paymentUrl) {
            window.location.assign(invoice.paymentUrl);
            return;
          }
          helpers.setStatus("Счёт создан, но ссылка на оплату не пришла. Напишите нам.");
        } catch (error) {
          applyServerIssues(
            error,
            helpers,
            error instanceof ApiError && error.isConflict
              ? "Подписка уже активна — оплачивать повторно не нужно."
              : undefined,
          );
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-4" noValidate>
          <FocusFirstError form={form} />
          <div>
            <Label>На сколько месяцев</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {MONTHS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={form.values.months === value}
                  onClick={() => form.setFieldValue("months", value)}
                  className={`h-12 rounded-2xl border-2 px-5 text-lg transition-colors ${
                    form.values.months === value
                      ? "border-secondary bg-secondary text-secondary-foreground"
                      : "border-border bg-surface hover:border-foreground"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {formError(form) && (
            <p role="alert" className="text-base font-medium text-destructive">
              {formError(form)}
            </p>
          )}

          <Button type="submit" size="lg" disabled={form.isSubmitting}>
            {form.isSubmitting ? "Готовим счёт…" : "Оплатить"}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
