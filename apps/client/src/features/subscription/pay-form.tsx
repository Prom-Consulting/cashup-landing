import { ApiError, buyMonthsInputSchema, type BuyMonthsInput } from "@loal/api";
import { fieldError, formError, zodValidate } from "@loal/forms";
import { Field } from "@loal/ui/field";
import { Button } from "@loal/ui/shadcn";
import { Select } from "@loal/ui/select";
import { Form, Formik } from "formik";
import { usePaySubscription } from "../../entities/card/api";

const options = [1, 3, 6, 12].map((months) => ({
  id: String(months),
  label: months === 1 ? "1 месяц" : months < 5 ? `${months} месяца` : `${months} месяцев`,
}));

const initialValues = { months: 1 } as BuyMonthsInput;

/**
 * Оплата подписки держателем карты. Ссылку на оплату открываем в этой же вкладке:
 * после оплаты OctōPAY возвращает человека обратно, и баланс уже обновлён.
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
          helpers.setStatus(
            error instanceof ApiError && error.isConflict
              ? "Подписка уже активна — оплачивать повторно не нужно."
              : error instanceof Error
                ? error.message
                : "Не удалось создать счёт",
          );
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-4" noValidate>
          <Field label="На сколько месяцев" error={fieldError(form, "months")}>
            {(parts) => (
              <Select
                {...parts}
                value={String(form.values.months)}
                options={options}
                onChange={(value) => form.setFieldValue("months", Number(value))}
              />
            )}
          </Field>

          {formError(form) && (
            <p role="alert" className="text-base font-medium text-destructive">
              {formError(form)}
            </p>
          )}

          <Button type="submit" disabled={form.isSubmitting}>
            {form.isSubmitting ? "Готовим счёт…" : "Оплатить подписку"}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
