import { ApiError } from "@loal/api";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { useSession } from "@loal/app-kit";
import { CardQr } from "../../widgets/card-qr";
import { WalletButtons } from "../../widgets/wallet-buttons";
import { Button, Card, Dialog, DialogContent, DialogTrigger, ErrorState, Icon, Loading } from "@loal/ui/shadcn";
import { useMyCard } from "../../entities/me/api";
import { FirstCardForm } from "../../features/subscription/first-card-form";
import { PaySubscriptionForm } from "../../features/subscription/pay-form";
import { formatDate } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");

/**
 * Своя карта. Сервер читает человека из токена, поэтому номера в адресе нет —
 * чужую карту спросить нельзя в принципе.
 */
export function MyCardPage() {
  const { session } = useSession();
  const card = useMyCard();

  if (card.isPending) return <Loading label="Открываем карту…" rows={2} />;

  // 404 — карты ещё не выпускали. Это состояние экрана, а не ошибка
  if (card.isError) {
    const noCard = card.error instanceof ApiError && card.error.status === 404;
    if (!noCard) return <ErrorState error={card.error} onRetry={() => card.refetch()} />;

    return (
      <section className="flex flex-col gap-5">
        <h1 className="display text-[clamp(1.75rem,7vw,2.25rem)] leading-[1.1]">Карты пока нет</h1>
        <p className="text-lg text-muted-foreground">
          Оформите подписку — карта появится в Apple Wallet сразу после оплаты, а на ней 15 000 бонусов на оплаченный
          период.
        </p>
        <Card>
          <FirstCardForm phone={session?.email ? null : null} />
        </Card>
      </section>
    );
  }

  const { serialNumber, pointsBalance, walletUrl, subscription, customer } = card.data;
  const name = [customer?.firstName, customer?.lastName].filter(Boolean).join(" ");

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-[28px] bg-graphite px-6 pt-6 pb-3 text-white shadow-[0_1.5rem_3rem_rgb(22_21_21/0.18)]">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-brand text-2xl font-bold">Loal</p>
          {subscription?.currentPeriodEnd && (
            <p className="text-base text-slate-soft">сгорит {formatDate(subscription.currentPeriodEnd)}</p>
          )}
        </div>

        <p className="mt-8 text-base text-slate-soft">{name ? `${name}, ваш баланс` : "Баланс бонусов"}</p>
        <p className="display text-[clamp(3rem,17vw,4.5rem)] leading-none tabular-nums text-amber">
          {money.format(pointsBalance)}
        </p>
        <p className="mt-2 text-lg text-slate-soft">бонусов — тратьте у партнёров</p>

        <div className="-mx-3 mt-7">
          <CardQr value={serialNumber} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {walletUrl && <WalletButtons serial={serialNumber} appleUrl={walletUrl} />}

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="lg">
              <Icon icon={RefreshIcon} />
              {subscription ? "Продлить подписку" : "Оформить подписку"}
            </Button>
          </DialogTrigger>
          <DialogContent
            title={subscription ? "Продлить подписку" : "Оформить подписку"}
            description="Каждый оплаченный месяц — снова 15 000 бонусов. Остаток прошлого месяца не переносится."
          >
            <PaySubscriptionForm serial={serialNumber} />
          </DialogContent>
        </Dialog>
      </div>

      {subscription ? (
        <p className="text-base leading-snug text-muted-foreground">
          Оплачено периодов: {subscription.periodsTotal ?? "—"}, выдано {subscription.periodsGranted ?? "—"}. Купленные
          месяцы приходят по очереди — баллы за них выдаются в начале каждого периода.
        </p>
      ) : (
        <p className="text-base leading-snug text-muted-foreground">
          Подписки нет: на карте остаток, и его ничто не продлевает. Оплатите месяц — баланс снова станет полным.
        </p>
      )}
    </section>
  );
}
