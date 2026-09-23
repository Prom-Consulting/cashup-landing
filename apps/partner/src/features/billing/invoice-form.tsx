import { ApiError, createInvoiceInputSchema, type CreateInvoiceInput } from "@loal/api";
import { fieldError, formError, zodValidate } from "@loal/forms";
import { Field } from "@loal/ui/field";
import { Button, Spinner, TextInput } from "@loal/ui/inputs";
import { Form, Formik } from "formik";
import { useCreateInvoice } from "../../entities/store/api";

const initialValues = { amount: "", months: "1" } as unknown as CreateInvoiceInput;

/** Счёт на продление доступа: сумма и на сколько месяцев. */
export function InvoiceForm({ storeId }: { storeId: string }) {
  const createInvoice = useCreateInvoice(storeId);

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(createInvoiceInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          const invoice = await createInvoice.mutateAsync(values);
          helpers.resetForm();
          // Ссылку на оплату открывает сам человек: всплывающие окна браузер режет
          helpers.setStatus(invoice.paymentUrl ? "Счёт создан — ссылка на оплату в списке ниже" : "Счёт создан");
        } catch (error) {
          helpers.setStatus(
            error instanceof ApiError
              ? error.message
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
        <Form className="flex flex-col gap-4 sm:flex-row sm:items-end" noValidate>
          <Field label="Сумма, сом" error={fieldError(form, "amount")} className="flex-1">
            {(parts) => (
              <TextInput
                {...parts}
                name="amount"
                inputMode="numeric"
                value={String(form.values.amount ?? "")}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </Field>
          <Field label="Месяцев" error={fieldError(form, "months")} className="sm:w-[140px]">
            {(parts) => (
              <TextInput
                {...parts}
                name="months"
                inputMode="numeric"
                value={String(form.values.months ?? "")}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </Field>
          <Button type="submit" variant="outline" disabled={form.isSubmitting}>
            {form.isSubmitting ? <Spinner /> : "Выставить счёт"}
          </Button>
          {formError(form) && (
            <p role="status" className="text-base font-medium text-flame-ink sm:basis-full">
              {formError(form)}
            </p>
          )}
        </Form>
      )}
    </Formik>
  );
}
