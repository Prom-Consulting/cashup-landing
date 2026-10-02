import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import {
  ApiError,
  CLIENT_PAYMENT_STATUS_LABELS,
  clientPaymentInputSchema,
  clientPaymentOutcome,
  isSelfServicePayment,
  isOctopayIntegrationReady,
  merchantCabinetApi,
  type ClientPayment,
  type ClientPaymentInput,
} from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { formatPhone } from "@loal/ui/inputs";
import { Badge, Button, EmptyState, ErrorState, FormField, FormStatus, Icon, Input, Loading } from "@loal/ui/shadcn";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, Formik } from "formik";
import { useState } from "react";
import { Link } from "react-router";
import { useApi } from "./session";
import { WorkBranchPicker, useWorkBranch, type WorkBranch } from "./work-branch";

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
    // NFC/QR-оплаты появляются без действий кассира — перечитываем, пока экран открыт, и пустой тоже
    refetchInterval: 5000,
  });
}

/** Статус нужен и кассиру: без готовой связи OctōPAY создаст счёт без кнопки Loal. */
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
    return "Владелец магазина должен выбрать в кабинете OctōPAY банковский счёт в KGS для приёма оплат Loal и переподключить Loal новым кодом.";
  }
  if (reason === "KGS_BANK_ACCOUNT_NOT_PAYABLE") {
    return "Активный счёт в KGS пока не готов принимать оплату. Владелец должен проверить поддерживаемый банк, реквизиты и подключение счёта в OctōPAY.";
  }
  if (reason === "KGS_BANK_ACCOUNT_AMBIGUOUS") {
    return `Владелец магазина должен выбрать в OctōPAY банковский счёт в KGS для Loal и переподключить Loal новым кодом${
      activeAccounts === undefined ? "" : ` (сейчас активных: ${activeAccounts})`
    }.`;
  }
  if (reason === "LOAL_LINK_INACTIVE") {
    return "Владелец магазина должен включить приём бонусов в разделе «Интеграции → Бонусы Loal» кабинета OctōPAY.";
  }
  return "Владелец магазина должен подключить OctōPAY и включить приём бонусов.";
}

/** Ошибки выставления счёта — понятным языком; сырой ответ провайдера не показываем. */
function clientPaymentErrorText(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "BRANCH_REQUIRED") return "Выберите филиал, где вы сейчас работаете. Счёт не выставлен.";
    if (error.code === "OCTOPAY_NOT_READY") return "Связь с OctōPAY сейчас не готова — подсказка выше. Счёт не выставлен.";
    if (error.code === "OCTOPAY_INVOICE_LIMIT_REACHED")
      return "В OctōPAY исчерпан лимит счетов этого магазина. Владельцу нужно проверить тариф OctōPAY.";
    if (error.code === "IDEMPOTENCY_CONFLICT")
      return "Этот счёт уже выставлялся с другими данными. Обновите страницу и выставьте заново.";
    if (error.status === 502 || error.status === 503 || error.status === 504)
      return "OctōPAY не ответил. Нажмите «Выставить счёт» ещё раз — второй счёт не создастся.";
    if (error.status === 400 && /подписк/i.test(error.message))
      return "Подписка магазина не активна — счёт выставить нельзя. Её продлевает владелец.";
  }
  if (error instanceof TypeError) return "Нет связи. Нажмите «Выставить счёт» ещё раз — второй счёт не создастся.";
  return "Не удалось выставить счёт";
}

/**
 * Счёт клиенту через OctōPAY: на странице оплаты клиент сам выбирает, сколько бонусов Loal
 * использовать, а остаток оплачивает банком. Подписка и связь магазина должны быть активны.
 */
export function ClientPaymentForm({
  merchantId,
  setupHref,
  branches,
}: {
  merchantId: string;
  setupHref?: string;
  /** Филиалы, где человек может работать: при нескольких счёт запишется на выбранный. */
  branches?: WorkBranch[];
}) {
  // Remounting on a business switch guarantees that an idempotency key can
  // never be carried from one merchant to another.
  return <ClientPaymentFormAttempt key={merchantId} merchantId={merchantId} setupHref={setupHref} branches={branches} />;
}

function ClientPaymentFormAttempt({
  merchantId,
  setupHref,
  branches,
}: {
  merchantId: string;
  setupHref?: string;
  branches?: WorkBranch[];
}) {
  const work = useWorkBranch(branches, merchantId);
  const [branchMissing, setBranchMissing] = useState(false);
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
  const initialValues: ClientPaymentInput = { requestId, amount: "" };
  const integrationReady = Boolean(integration.data && isOctopayIntegrationReady(integration.data));

  return (
    <div className="flex flex-col gap-5">
      {integration.isPending && (
        <div role="status" className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
          Проверяем подключение OctōPAY…
        </div>
      )}
      {integration.isError && (
        <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          Не удалось проверить подключение OctōPAY. Обновите страницу и попробуйте ещё раз.
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
          if (work.needsChoice) {
            setBranchMissing(true);
            return helpers.setSubmitting(false);
          }
          try {
            // Филиал шлём, только когда выбирали из нескольких: единственный сервер ставит сам
            setIssued(await create.mutateAsync({ ...values, branchId: work.canSwitch ? work.branch?.id : undefined }));
            // A failed or uncertain request keeps the same key, so retrying can
            // recover the exact Octopay invoice. Rotate only after success.
            const nextRequestId = crypto.randomUUID();
            setRequestId(nextRequestId);
            helpers.resetForm({ values: { requestId: nextRequestId, amount: "" } });
          } catch (error) {
            if (error instanceof ApiError && error.code === "OCTOPAY_NOT_READY") {
              // Readiness may have changed since the form was rendered (for
              // example, the active KGS account was disabled in Octopay).
              // Keep the request id for a safe retry, but refresh the setup
              // guidance and disable submission until the link is ready again.
              await queryClient.invalidateQueries({ queryKey: ["merchant", merchantId, "octopay"] });
            }
            applyServerIssues(error, helpers, clientPaymentErrorText(error));
          } finally {
            helpers.setSubmitting(false);
          }
        }}
      >
        {(form) => (
          <Form noValidate className="flex flex-col gap-4">
            <FocusFirstError form={form} />
            <WorkBranchPicker work={work} invalid={branchMissing && work.needsChoice} />
            <div className="max-w-xl">
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
/** Разбивка по серверу: известные части — числами (0 — явно), неизвестные — словами, не догадкой. */
function Breakdown({ payment, outcome }: { payment: ClientPayment; outcome: string }) {
  // Старый ответ без этих полей — разбивку не показываем вовсе
  if (payment.bonusAmount === undefined && payment.bankAmount === undefined) return null;
  if (payment.bonusAmount != null && payment.bankAmount != null)
    return (
      <p className="text-sm tabular-nums">
        Баллами: <span className="font-semibold">{money.format(payment.bonusAmount)}</span> · Банком:{" "}
        <span className="font-semibold">{money.format(payment.bankAmount)} сом</span>
      </p>
    );
  return (
    <p className="text-sm text-muted-foreground">
      {outcome === "pending" || outcome === "finishing" ? "Разбивка ещё не подтверждена" : "Разбивка недоступна"}
    </p>
  );
}

/**
 * Счета клиенту и самостоятельные оплаты по NFC/QR. Обновляется сам раз в 5 секунд. Оплачен —
 * только по серверу (paid + fulfilled), а не по тому, что показал телефон покупателя.
 */
export function ClientPaymentList({ merchantId }: { merchantId: string }) {
  const payments = useClientPayments(merchantId);
  if (payments.isPending) return <Loading rows={3} />;
  // Ошибка без данных — экран ошибки; с данными — последнее известное и предупреждение
  if (payments.isError && !payments.data) return <ErrorState error={payments.error} onRetry={() => payments.refetch()} />;
  const list = payments.data ?? [];
  const now = Date.now();

  return (
    <div className="flex flex-col gap-3">
      {payments.isError && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted px-4 py-3 text-sm">
          <span>Не удалось обновить список — показываем последнее известное состояние.</span>
          <Button variant="outline" size="sm" onClick={() => payments.refetch()}>
            Повторить
          </Button>
        </div>
      )}
      {list.length === 0 ? (
        <EmptyState
          title="Счетов пока нет"
          description="Новые счета и оплаты покупателей по NFC/QR появятся здесь сами."
        />
      ) : (
        <ul className="flex flex-col">
          {list.map((payment) => {
            const outcome = clientPaymentOutcome(payment);
            const self = isSelfServicePayment(payment);
            const overdue = outcome === "pending" && payment.expiresAt && new Date(payment.expiresAt).getTime() < now;
            const label = overdue ? "срок оплаты истёк" : (CLIENT_PAYMENT_STATUS_LABELS[outcome] ?? outcome);
            const place = [payment.branchName, self ? payment.checkoutPointName : null].filter(Boolean).join(" · ");
            const title = self
              ? "Самостоятельная оплата"
              : payment.customerName || (payment.clientPhone ? formatPhone(payment.clientPhone) : "Счёт от сотрудника");
            return (
              <li
                key={payment.id}
                className="flex flex-col gap-1 border-t border-border py-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="flex flex-wrap items-center gap-2 text-lg">
                    {title}
                    {self && <Badge tone="neutral">NFC/QR</Badge>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {[
                      payment.createdAt ? dateTime.format(new Date(payment.createdAt)) : null,
                      // У самостоятельной оплаты нет сотрудника — не подставляем кассира
                      self ? null : payment.cashierName,
                      place || null,
                      payment.providerInvoiceId ? `№ ${payment.providerInvoiceId}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <Breakdown payment={payment} outcome={outcome} />
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge tone={outcome === "paid" ? "good" : "quiet"}>{label}</Badge>
                  <span className="text-lg font-bold tabular-nums">{money.format(payment.amount ?? 0)} сом</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
