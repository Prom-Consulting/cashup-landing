import { ApiError, paySubscriptionByPhoneInputSchema, type PaySubscriptionByPhoneInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, Input, Label } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { usePaySubscriptionByPhone } from "../../entities/me/api";

const MONTHS = [1, 3, 6, 12];

const initialValues = { phone: "", firstName: "", months: 1 } as PaySubscriptionByPhoneInput;

/**
 * Первая карта: у человека её ещё нет. Карта заводится вместе со счётом, поэтому
 * достаточно имени и телефона — после оплаты она появится в Wallet.
 */
export function FirstCardForm({ phone }: { phone?: string | null }) {
  const pay = usePaySubscriptionByPhone();

  return (
    <Formik
      initialValues={{ ...initialValues, phone: phone ?? "" }}
      validate={zodValidate(paySubscriptionByPhoneInputSchema)}
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
          applyServerIssues(error, helpers);
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-4" noValidate>
          <FocusFirstError form={form} />
          <div>
            <Label htmlFor="firstName">Как вас зовут</Label>
            <Input
              id="firstName"
              name="firstName"
              className="mt-2"
              value={form.values.firstName}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              invalid={Boolean(fieldError(form, "firstName"))}
            />
            {fieldError(form, "firstName") && (
              <p className="mt-2 text-base text-destructive">{fieldError(form, "firstName")}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Телефон</Label>
            <Input
              id="phone"
              name="phone"
              inputMode="tel"
              className="mt-2 tabular-nums"
              value={form.values.phone}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              invalid={Boolean(fieldError(form, "phone"))}
            />
            {fieldError(form, "phone") && (
              <p className="mt-2 text-base text-destructive">{fieldError(form, "phone")}</p>
            )}
          </div>

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
            {form.isSubmitting ? "Готовим счёт…" : "Оформить карту"}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
