import { Badge, Card, EmptyState, ErrorState, Loading } from "@loal/ui/shadcn";
import { PageHeader } from "@loal/ui/page";
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
              {subscription.data.isActive ? `до ${formatDate(subscription.data.expiresAt)}` : "не активна"}
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
      {invoices.isSuccess && invoices.data.length === 0 && <EmptyState title="Счетов пока нет" />}

      <div className="flex flex-col gap-3">
        {(invoices.data ?? []).map((invoice) => (
          <Card key={invoice.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xl font-bold tabular-nums">
                  {invoice.amount ? `${money.format(invoice.amount)} сом` : "Счёт"}
                  {invoice.months ? <span className="text-muted-foreground"> · {invoice.months} мес.</span> : null}
                </p>
                <p className="mt-1 text-base text-muted-foreground">
                  {formatDateTime(invoice.createdAt)}
                  {invoice.status ? ` · ${invoice.status}` : ""}
                </p>
              </div>
              {invoice.paymentUrl && (
                <a
                  href={invoice.paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-flame px-5 py-3 text-lg font-medium text-white transition-colors hover:bg-graphite"
                >
                  Оплатить
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
