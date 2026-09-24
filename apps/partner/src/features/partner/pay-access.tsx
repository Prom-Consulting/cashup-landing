import { buyMonthsInputSchema, type BuyMonthsInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, FormField, FormStatus, Input } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { usePayPartnerAccess } from "../../entities/partner/api";

/** Партнёр сам оплачивает свой доступ: счёт открывается на странице OctōPAY. */
export function PayAccessForm({ memberId }: { memberId: string }) {
  const pay = usePayPartnerAccess(memberId);
  return (
    <Formik<BuyMonthsInput>
      initialValues={{ months: 1 }}
      validate={zodValidate(buyMonthsInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          const invoice = await pay.mutateAsync(Number(values.months));
          if (invoice.paymentUrl) window.location.assign(invoice.paymentUrl);
          else helpers.setStatus("Счёт создан, но ссылки на оплату нет — напишите нам.");
        } catch (error) {
          applyServerIssues(error, helpers, "Не удалось создать счёт");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form noValidate className="flex flex-wrap items-start gap-3">
          <FocusFirstError form={form} />
          <FormField label="Месяцев" className="w-[140px]" error={fieldError(form, "months")}>
            {(parts) => (
              <Input
                {...parts}
                name="months"
                inputMode="numeric"
                value={String(form.values.months)}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </FormField>
          <Button type="submit" className="mt-8" disabled={form.isSubmitting}>
            {form.isSubmitting ? "Готовим счёт…" : "Перейти к оплате"}
          </Button>
          <div className="basis-full">
            <FormStatus message={formError(form)} />
          </div>
        </Form>
      )}
    </Formik>
  );
}
