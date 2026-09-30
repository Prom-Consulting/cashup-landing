import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import {
  CLIENT_PAYMENT_STATUS_LABELS,
  clientPaymentInputSchema,
  merchantCabinetApi,
  type ClientPayment,
  type ClientPaymentInput,
} from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { PhoneInput, formatPhone } from "@loal/ui/inputs";
import { Badge, Button, EmptyState, ErrorState, FormField, FormStatus, Icon, Input, Loading } from "@loal/ui/shadcn";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useApi } from "./session";

const money = new Intl.NumberFormat("ru-RU");
const dateTime = new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" });
const clientPaymentsKey = (merchantId: string) => ["client-payments", merchantId] as const;

/** Последние 100 счетов: владелец видит все, администратор филиала — своего, кассир — свои. */
export function useClientPayments(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: clientPaymentsKey(merchantId),
    queryFn: () => merchantCabinetApi(api).clientPayments(merchantId),
    enabled: Boolean(merchantId),
  });
}

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
 * Счёт клиенту через OctōPAY: клиент платит по ссылке, и бонусы на ту же сумму спишутся с его
 * карты сами — кассиру ничего подтверждать не нужно. Подписка магазина должна быть активна.
 */
export function ClientPaymentForm({ merchantId }: { merchantId: string }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: (input: ClientPaymentInput) => merchantCabinetApi(api).createClientPayment(merchantId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientPaymentsKey(merchantId) }),
  });
  const [issued, setIssued] = useState<ClientPayment | null>(null);
  const initialValues: ClientPaymentInput = { clientPhone: "", amount: "" };

  return (
    <div className="flex flex-col gap-5">
      <Formik
        initialValues={initialValues}
        validate={zodValidate(clientPaymentInputSchema)}
        onSubmit={async (values, helpers) => {
          helpers.setStatus(undefined);
          setIssued(null);
          try {
            setIssued(await create.mutateAsync(values));
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
                    name="clientPhone"
                    value={form.values.clientPhone}
                    onValueChange={(value) => form.setFieldValue("clientPhone", value)}
                    onBlur={() => form.setFieldTouched("clientPhone", true)}
                  />
                )}
              </FormField>
              <FormField label="Сумма" error={fieldError(form, "amount")}>
                {(parts) => (
                  <div className="relative">
                    <Input
                      {...parts}
                      name="amount"
                      inputMode="decimal"
                      className="pr-14 tabular-nums"
                      value={String(form.values.amount)}
                      onChange={form.handleChange}
                      onBlur={form.handleBlur}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-base text-muted-foreground">
                      сом
                    </span>
                  </div>
                )}
              </FormField>
            </div>
            <FormStatus message={formError(form)} />
            <div>
              <Button type="submit" size="lg" disabled={form.isSubmitting}>
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
                className="min-w-0 break-all text-base underline underline-offset-4"
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

/** Выставленные счета: кому, сколько, в каком состоянии; у владельца — ещё кто и где выставил. */
export function ClientPaymentList({ merchantId }: { merchantId: string }) {
  const payments = useClientPayments(merchantId);
  if (payments.isPending) return <Loading rows={3} />;
  if (payments.isError) return <ErrorState error={payments.error} onRetry={() => payments.refetch()} />;
  if (payments.data.length === 0) return <EmptyState title="Счетов пока не выставляли" />;

  return (
    <ul className="flex flex-col">
      {payments.data.map((payment) => {
        const status = payment.status ?? "";
        const who = [payment.cashierName, payment.branchName].filter(Boolean).join(" · ");
        return (
          <li
            key={payment.id}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-border py-3 first:border-t-0 first:pt-0"
          >
            <div className="min-w-0">
              <p className="text-lg">
                {payment.customerName || (payment.clientPhone ? formatPhone(payment.clientPhone) : "Клиент")}
              </p>
              <p className="text-sm text-muted-foreground">
                {payment.createdAt ? dateTime.format(new Date(payment.createdAt)) : ""}
                {who ? ` · ${who}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={status === "paid" ? "good" : "quiet"}>{CLIENT_PAYMENT_STATUS_LABELS[status] ?? status}</Badge>
              <span className="text-lg font-bold tabular-nums">{money.format(payment.amount ?? 0)} сом</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
