import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { partnerInvoiceInputSchema, type Invoice, type PartnerInvoiceInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { PhoneInput } from "@loal/ui/inputs";
import { Button, FormField, FormStatus, Icon, Input } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useInvoiceClient } from "../../entities/partner/api";

const money = new Intl.NumberFormat("ru-RU");

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
    >
      <Icon icon={copied ? Tick02Icon : Copy01Icon} />
      {copied ? "Скопировано" : "Скопировать ссылку"}
    </Button>
  );
}

/**
 * Счёт клиенту через OctōPAY. Когда он оплатит, бонусы спишутся с его карты
 * автоматически, без кассира: в журнале появится строка «Оплата через OctōPAY».
 */
export function InvoiceClientForm({ memberId }: { memberId: string }) {
  const invoice = useInvoiceClient(memberId);
  const [issued, setIssued] = useState<Invoice | null>(null);
  const initialValues: PartnerInvoiceInput = { clientPhone: "", amount: "" };

  return (
    <div className="flex flex-col gap-5">
      <Formik
        initialValues={initialValues}
        validate={zodValidate(partnerInvoiceInputSchema)}
        onSubmit={async (values, helpers) => {
          helpers.setStatus(undefined);
          setIssued(null);
          try {
            setIssued(await invoice.mutateAsync(values));
            helpers.resetForm();
          } catch (error) {
            applyServerIssues(error, helpers, "Не удалось выставить счёт");
          } finally {
            helpers.setSubmitting(false);
          }
        }}
      >
        {(form) => (
          <Form noValidate className="flex flex-col gap-4">
            <FocusFirstError form={form} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Телефон клиента"
                hint="По нему найдём его карту Loal."
                error={fieldError(form, "clientPhone")}
              >
                {(parts) => (
                  <PhoneInput
                    {...parts}
                    value={form.values.clientPhone}
                    onValueChange={(value) => form.setFieldValue("clientPhone", value)}
                    onBlur={() => form.setFieldTouched("clientPhone", true)}
                  />
                )}
              </FormField>
              <FormField label="Сумма, сом" error={fieldError(form, "amount")}>
                {(parts) => (
                  <Input
                    {...parts}
                    name="amount"
                    inputMode="decimal"
                    className="tabular-nums"
                    value={String(form.values.amount)}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </FormField>
            </div>
            <FormStatus message={formError(form)} />
            <div>
              <Button type="submit" disabled={form.isSubmitting}>
                {form.isSubmitting ? "Выставляем…" : "Выставить счёт"}
              </Button>
            </div>
          </Form>
        )}
      </Formik>

      {issued && (
        <div role="status" className="flex flex-col gap-3 rounded-2xl bg-muted p-4">
          <p className="text-lg">
            Счёт на <span className="font-bold tabular-nums">{money.format(issued.amount ?? 0)} сом</span> выставлен.
            Отправьте клиенту ссылку — после оплаты бонусы спишутся сами.
          </p>
          {issued.paymentUrl && (
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={issued.paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all text-base underline underline-offset-4"
              >
                {issued.paymentUrl}
              </a>
              <CopyLink url={issued.paymentUrl} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
