import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import {
  ApiError,
  CLIENT_PAYMENT_STATUS_LABELS,
  clientPaymentInputSchema,
  isOctopayIntegrationReady,
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
import { Link } from "react-router";
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

/** Статус нужен и кассиру: без готовой связи Octopay создаст счёт без кнопки Loal. */
function useOctopayReadiness(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["merchant", merchantId, "octopay"],
    queryFn: () => merchantCabinetApi(api).octopayIntegration(merchantId),
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

function octopaySetupHint(reason?: string | null, activeAccounts?: number) {
  if (reason === "KGS_BANK_ACCOUNT_REQUIRED") {
    return "В кабинете Octopay добавьте и активируйте один банковский счёт в KGS.";
  }
  if (reason === "KGS_BANK_ACCOUNT_NOT_PAYABLE") {
    return "Активный счёт в KGS пока не готов принимать оплату. Владелец должен проверить поддерживаемый банк, реквизиты и подключение счёта в Octopay.";
  }
  if (reason === "KGS_BANK_ACCOUNT_AMBIGUOUS") {
    return `В кабинете Octopay оставьте ровно один активный банковский счёт в KGS, готовый к оплате${
      activeAccounts === undefined ? "" : ` (сейчас активных: ${activeAccounts})`
    }.`;
  }
  if (reason === "LOAL_LINK_INACTIVE") {
    return "Владелец магазина должен включить приём бонусов в разделе «Интеграции → Бонусы Loal» кабинета Octopay.";
  }
  return "Владелец магазина должен подключить Octopay и включить приём бонусов.";
}

/**
 * Счёт клиенту через OctōPAY: на странице оплаты клиент сам выбирает, сколько бонусов Loal
 * использовать, а остаток оплачивает банком. Подписка и связь магазина должны быть активны.
 */
export function ClientPaymentForm({ merchantId, setupHref }: { merchantId: string; setupHref?: string }) {
  // Remounting on a business switch guarantees that an idempotency key can
  // never be carried from one merchant to another.
  return <ClientPaymentFormAttempt key={merchantId} merchantId={merchantId} setupHref={setupHref} />;
}

function ClientPaymentFormAttempt({ merchantId, setupHref }: { merchantId: string; setupHref?: string }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const integration = useOctopayReadiness(merchantId);
  const create = useMutation({
    mutationFn: (input: ClientPaymentInput) => merchantCabinetApi(api).createClientPayment(merchantId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientPaymentsKey(merchantId) }),
  });
  const [issued, setIssued] = useState<ClientPayment | null>(null);
  // Retry-safe identifier.
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const initialValues: ClientPaymentInput = { requestId, clientPhone: "", amount: "" };
  const integrationReady = Boolean(integration.data && isOctopayIntegrationReady(integration.data));

  return (
    <div className="flex flex-col gap-5">
      {integration.isPending && (
        <div role="status" className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
          Проверяем подключение Octopay…
        </div>
      )}
      {integration.isError && (
        <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          Не удалось проверить подключение Octopay. Обновите страницу и попробуйте ещё раз.
        </div>
      )}
      {integration.isSuccess && !integrationReady && (
        <div role="alert" className="rounded-2xl border border-border bg-muted p-4 text-sm">
          <p className="font-semibold text-foreground">Счета с бонусами Loal пока недоступны</p>
          <p className="mt-1 text-muted-foreground">
            {octopaySetupHint(
              integration.data.invoiceNotReadyReason,
              integration.data.activeKgsBankAccountCount,
            )}
            {setupHref && (
              <>
                {" "}
                <Link to={setupHref} className="font-medium text-foreground underline underline-offset-4">
                  Открыть настройки
                </Link>
              </>
            )}
          </p>
        </div>
      )}
      <Formik
        initialValues={initialValues}
        validate={zodValidate(clientPaymentInputSchema)}
        onSubmit={async (values, helpers) => {
          helpers.setStatus(undefined);
          setIssued(null);
          try {
            setIssued(await create.mutateAsync(values));
            // A failed or uncertain request keeps the same key, so retrying can
            // recover the exact Octopay invoice. Rotate only after success.
            const nextRequestId = crypto.randomUUID();
            setRequestId(nextRequestId);
            helpers.resetForm({ values: { requestId: nextRequestId, clientPhone: "", amount: "" } });
          } catch (error) {
            if (error instanceof ApiError && error.code === "OCTOPAY_NOT_READY") {
              // Readiness may have changed since the form was rendered (for
              // example, the active KGS account was disabled in Octopay).
              // Keep the request id for a safe retry, but refresh the setup
              // guidance and disable submission until the link is ready again.
              await queryClient.invalidateQueries({ queryKey: ["merchant", merchantId, "octopay"] });
            }
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
                      type="number"
                      inputMode="decimal"
                      min="0.01"
                      max="100000000"
                      step="0.01"
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
              <Button
                type="submit"
                size="lg"
                disabled={form.isSubmitting || integration.isPending || integration.isError || !integrationReady}
              >
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
            Отправьте клиенту ссылку — на странице оплаты он сможет выбрать бонусы Loal и оплатить остаток банком.
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
