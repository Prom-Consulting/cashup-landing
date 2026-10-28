import { CheckmarkCircle02Icon, NfcIcon } from "@hugeicons/core-free-icons";
import { Badge, Button, Card, ErrorState, Icon, Loading, PageHeader } from "@loal/ui/shadcn";
import { useState } from "react";
import { useCurrentMerchant } from "../../entities/session/model";
import { useNfcSticker, usePayNfcSticker, useSetStickerKind } from "../../entities/nfc-sticker/api";

const money = new Intl.NumberFormat("ru-RU");

/**
 * NFC-стикер заведения (тариф «Больше клиентов»): подписка бесплатна, стикер оплачивается один раз.
 * По нему клиенты узнают магазин; онлайн-магазину — цифровой стикер. Оплата — разовый счёт OctōPAY.
 */
export function NfcStickerPage() {
  const { merchantId } = useCurrentMerchant();
  const sticker = useNfcSticker(merchantId ?? "");
  const setKind = useSetStickerKind(merchantId ?? "");
  const pay = usePayNfcSticker(merchantId ?? "");
  const [payError, setPayError] = useState<string | null>(null);

  const startPayment = async () => {
    setPayError(null);
    try {
      const invoice = await pay.mutateAsync();
      if (invoice.paymentUrl) window.location.href = invoice.paymentUrl;
      else setPayError("Счёт создан, но ссылка на оплату не пришла. Обновите страницу.");
    } catch {
      setPayError("Не удалось создать счёт. Попробуйте ещё раз через минуту.");
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="NFC-стикер"
        description="По стикеру клиенты узнают ваш магазин и начисляют бонусы. Подписка «Больше клиентов» бесплатна — стикер оплачивается один раз."
      />

      {sticker.isPending ? (
        <Card className="p-6">
          <Loading rows={3} />
        </Card>
      ) : sticker.isError ? (
        <Card className="p-6">
          <ErrorState error={sticker.error} onRetry={() => sticker.refetch()} />
        </Card>
      ) : !sticker.data?.order ? (
        <Card className="p-6">
          <p className="text-base text-muted-foreground">
            NFC-стикер нужен на тарифе «Больше клиентов». Ваш тариф другой — подписка уже включает приём бонусов.
          </p>
        </Card>
      ) : (
        (() => {
          const { order, priceKgs } = sticker.data;
          const paid = order.status === "paid";
          return (
            <Card className="flex flex-col gap-6 p-6">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-flame/10 text-flame-ink">
                  <Icon icon={NfcIcon} size={24} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xl font-bold">
                      {money.format(order.amountKgs || priceKgs)} сом
                    </span>
                    {paid ? (
                      <Badge tone="good">
                        <Icon icon={CheckmarkCircle02Icon} size={16} />
                        Оплачен
                      </Badge>
                    ) : (
                      <Badge tone="warn">Ожидает оплаты</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-base text-muted-foreground">
                    Разовый платёж за стикер. Онлайн-магазину выдаётся цифровой стикер — печатать ничего не нужно.
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-base font-medium">Тип стикера</p>
                <div className="flex flex-wrap gap-2">
                  {(["physical", "digital"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      disabled={paid || setKind.isPending}
                      aria-pressed={order.kind === k}
                      onClick={() => setKind.mutate(k)}
                      className={`rounded-full border-2 px-4 py-2 text-base font-semibold transition-colors disabled:opacity-60 ${
                        order.kind === k ? "border-primary bg-surface" : "border-border hover:border-foreground/40"
                      }`}
                    >
                      {k === "physical" ? "Физический (печать)" : "Цифровой (онлайн-магазин)"}
                    </button>
                  ))}
                </div>
              </div>

              {!paid && (
                <div className="flex flex-col gap-2">
                  <Button onClick={startPayment} disabled={pay.isPending}>
                    {pay.isPending ? "Создаём счёт…" : `Оплатить ${money.format(order.amountKgs || priceKgs)} сом`}
                  </Button>
                  {payError && <p className="text-base text-destructive">{payError}</p>}
                  <p className="text-sm text-muted-foreground">Оплата через OctōPAY. После оплаты статус обновится.</p>
                </div>
              )}
            </Card>
          );
        })()
      )}
    </section>
  );
}
