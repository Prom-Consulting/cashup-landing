import { invoiceState } from "@loal/api";
import { PromoCodeForm, usePublicTariffs } from "@loal/app-kit";
import { Badge, Button, Card, EmptyState, ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { useCurrentMerchant } from "../../entities/session/model";
import { useInvoices, useRedeemMerchantPromo, useSubscription, useMerchant } from "../../entities/merchant/api";
import { InvoiceForm } from "../../features/billing/invoice-form";
import { formatDate, formatDateTime } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");

/** Счета отвечают на вопрос «заплатили ли», подписка — «можно ли принимать бонусы». */
export function BillingPage() {
  const { merchantId, canManage } = useCurrentMerchant();
  const subscription = useSubscription(merchantId ?? "");
  const invoices = useInvoices(merchantId ?? "");
  const redeemPromo = useRedeemMerchantPromo(merchantId ?? "");
  const merchant = useMerchant(merchantId ?? "");
  const prices = usePublicTariffs();
  const currentPrice = prices.isError ? undefined : prices.data?.find((item) => item.code === merchant.data?.loalTariff);
  const free = currentPrice?.priceKgs === 0;
  const paidActive = subscription.data ? (subscription.data.paidActive ?? subscription.data.isActive) : false;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Оплата"
        description="Счёт — это оплата. Приём бонусов включает подписка: она продлевается после оплаты."
        action={
          free ? (
            <Badge tone="good">Доступ бесплатный</Badge>
          ) : (
            <Badge tone={paidActive ? "good" : "warn"}>
              {paidActive ? `доступ до ${formatDate(subscription.data?.expiresAt)}` : "доступ закрыт"}
            </Badge>
          )
        }
      />

      {currentPrice && <Card>
        <h2 className="text-xl font-bold">{currentPrice.name}: {money.format(currentPrice.priceKgs)} сом/мес</h2>
        {currentPrice.freeOfferActive && <p className="mt-2 text-base text-muted-foreground">
          Осталось бесплатных мест: {currentPrice.freePlacesRemaining}. Когда лимит заполнится, цена для всех станет {money.format(currentPrice.regularPriceKgs)} сом/мес.
        </p>}
      </Card>}

      <Card>
        <h2 className="text-xl font-bold">Новый счёт</h2>
        <p className="mt-2 max-w-[70ch] text-base text-muted-foreground">
          После оплаты через OctōPAY доступ продлевается автоматически по вашему тарифу Loal.
        </p>
        <div className="mt-5">{merchantId && <InvoiceForm merchantId={merchantId} />}</div>
      </Card>

      {/* Кассиру сервер ответит 403 — поле ему не показываем */}
      {canManage && merchantId && (
        <Card>
          <h2 className="text-xl font-bold">Промокод</h2>
          <p className="mt-2 max-w-[70ch] text-base text-muted-foreground">
            Бесплатные месяцы добавятся к подписке магазина — после текущего срока, если он ещё идёт.
          </p>
          <div className="mt-5 max-w-[480px]">
            <PromoCodeForm redeem={(input) => redeemPromo.mutateAsync(input)} />
          </div>
        </Card>
      )}

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
