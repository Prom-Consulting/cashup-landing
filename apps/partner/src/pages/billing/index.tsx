import { invoiceState } from "@loal/api";
import { Badge, Button, Card, EmptyState, ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { useCurrentStore } from "../../entities/session/model";
import { useInvoices, useSubscription } from "../../entities/store/api";
import { InvoiceForm } from "../../features/billing/invoice-form";
import { formatDate, formatDateTime } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");

/** Счета отвечают на вопрос «заплатили ли», подписка — «можно ли принимать бонусы». */
export function BillingPage() {
  const { storeId } = useCurrentStore();
  const subscription = useSubscription(storeId ?? "");
  const invoices = useInvoices(storeId ?? "");

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Оплата"
        description="Счёт — это оплата. Приём бонусов включает подписка: она продлевается после оплаты."
        action={
          subscription.data && (
            <Badge tone={subscription.data.isActive ? "good" : "warn"}>
              {subscription.data.isActive ? `доступ до ${formatDate(subscription.data.expiresAt)}` : "доступ закрыт"}
            </Badge>
          )
        }
      />

      <Card>
        <h2 className="text-xl font-bold">Новый счёт</h2>
        <p className="mt-2 max-w-[70ch] text-base text-muted-foreground">
          После оплаты через OctōPAY доступ продлевается сам — вручную ничего включать не нужно.
        </p>
        <div className="mt-5">{storeId && <InvoiceForm storeId={storeId} />}</div>
      </Card>

      {invoices.isPending && <Loading />}
      {invoices.isError && <ErrorState error={invoices.error} onRetry={() => invoices.refetch()} />}
      {invoices.isSuccess && invoices.data.length === 0 && (
        <EmptyState title="Счетов пока нет" description="Выставьте первый счёт — он появится здесь." />
      )}

      <div className="flex flex-col gap-3">
        {(invoices.data ?? []).map((invoice) => {
          const state = invoiceState(invoice);
          return (
            <Card key={invoice.id}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-3">
                    <span className="text-xl font-bold tabular-nums">
                      {invoice.amount ? `${money.format(invoice.amount)} сом` : "Счёт"}
                    </span>
                    {invoice.months ? (
                      <span className="text-lg text-muted-foreground">за {invoice.months} мес.</span>
                    ) : null}
                    <Badge tone={state.tone}>{state.label}</Badge>
                  </p>
                  <p className="mt-1 text-base text-muted-foreground">
                    {invoice.status === "paid" && invoice.paidAt
                      ? `оплачен ${formatDateTime(invoice.paidAt)}`
                      : `выставлен ${formatDateTime(invoice.createdAt)}`}
                  </p>
                </div>

                {state.payable && (
                  <Button asChild>
                    <a href={invoice.paymentUrl!} target="_blank" rel="noreferrer">
                      Оплатить
                    </a>
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
