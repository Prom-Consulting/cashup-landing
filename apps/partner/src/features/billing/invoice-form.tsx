import { ApiError, createInvoiceInputSchema, type CreateInvoiceInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, Input, Label } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useCreateInvoice } from "../../entities/merchant/api";

const initialValues = { amount: "", months: "1" } as unknown as CreateInvoiceInput;

/** Частые сроки — кнопками: набирать «3» руками незачем. */
const PRESETS = [1, 3, 6, 12];

/** Счёт на продление доступа: сумма и срок. */
export function InvoiceForm({ merchantId }: { merchantId: string }) {
  const createInvoice = useCreateInvoice(merchantId);

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(createInvoiceInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          await createInvoice.mutateAsync(values);
          helpers.resetForm();
          helpers.setStatus("Счёт выставлен — ссылка на оплату в списке ниже");
        } catch (error) {
          applyServerIssues(error, helpers);
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => {
        const months = String(form.values.months ?? "");
        return (
          <Form className="flex flex-col gap-5" noValidate>
            <FocusFirstError form={form} />
            <div className="grid gap-5 sm:grid-cols-[minmax(0,240px)_1fr]">
              <div>
                <Label htmlFor="amount">Сумма, сом</Label>
                <Input
                  id="amount"
                  name="amount"
                  inputMode="numeric"
                  placeholder="3000"
                  className="mt-2 tabular-nums"
                  value={String(form.values.amount ?? "")}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  invalid={Boolean(fieldError(form, "amount"))}
                />
                {fieldError(form, "amount") && (
                  <p className="mt-2 text-base text-destructive">{fieldError(form, "amount")}</p>
                )}
              </div>

              <div>
                <span className="text-base font-medium">Срок</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PRESETS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={months === String(value)}
                      onClick={() => form.setFieldValue("months", String(value))}
                      className={`h-12 rounded-2xl border-2 px-5 text-lg transition-colors ${
                        months === String(value)
                          ? "border-secondary bg-secondary text-secondary-foreground"
                          : "border-border bg-surface hover:border-foreground"
                      }`}
                    >
                      {value} мес.
                    </button>
                  ))}
                </div>
                {fieldError(form, "months") && (
                  <p className="mt-2 text-base text-destructive">{fieldError(form, "months")}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" disabled={form.isSubmitting}>
                {form.isSubmitting ? "Выставляем…" : "Выставить счёт"}
              </Button>
              {formError(form) && (
                <p role="status" className="text-base text-muted-foreground">
                  {formError(form)}
                </p>
              )}
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}
