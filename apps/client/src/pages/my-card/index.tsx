import { ApiError, HISTORY_KIND_LABELS, type HistoryKind } from "@loal/api";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { useSession } from "@loal/app-kit";
import { CardQr } from "../../widgets/card-qr";
import { WalletButtons } from "../../widgets/wallet-buttons";
import { Button, Card, Dialog, DialogContent, DialogTrigger, ErrorState, Icon, Loading } from "@loal/ui/shadcn";
import { Link, useLocation } from "react-router";
import { useMyCard, useMyHistory } from "../../entities/me/api";
import { FirstCardForm } from "../../features/subscription/first-card-form";
import { PaySubscriptionForm } from "../../features/subscription/pay-form";
import { formatDate, formatDateTime } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");

/** Последние операции рядом с картой — только на компьютере, на телефоне для них вкладка. */
function RecentHistory() {
  const history = useMyHistory(1);
  const rows = (history.data?.items ?? []).slice(0, 5);
  if (!history.isSuccess) return null;

  return (
    <Card className="hidden lg:block">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold">Последние операции</h2>
        {rows.length > 0 && (
          <Link to="/history" className="text-base text-flame-ink underline-offset-4 hover:underline">
            Вся история
          </Link>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-base text-muted-foreground">Здесь появятся начисления и траты бонусов.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {rows.map((row) => (
            <li key={row.id} className="flex items-baseline justify-between gap-3 py-3">
              <span>
                <span className="block text-base">
                  {row.merchantName ?? HISTORY_KIND_LABELS[row.kind as HistoryKind] ?? "Изменение"}
                </span>
                <span className="text-sm text-muted-foreground">{formatDateTime(row.createdAt)}</span>
              </span>
              <span className={`text-lg font-bold tabular-nums ${row.amount > 0 ? "" : "text-destructive"}`}>
                {row.amount > 0 ? "+" : "−"}
                {money.format(Math.abs(row.amount))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/**
 * Своя карта. Сервер читает человека из токена, поэтому номера в адресе нет —
 * чужую карту спросить нельзя в принципе.
 */
/** Сразу после регистрации по телефону — короткое приветствие, один раз. */
function Welcome() {
  const location = useLocation();
  if (!(location.state as { welcome?: boolean } | null)?.welcome) return null;
  return (
    <p role="status" className="brand-gradient rounded-[22px] px-5 py-4 text-lg font-bold text-white">
      Аккаунт создан — добро пожаловать в Loal!
    </p>
  );
}

export function MyCardPage() {
  const { session } = useSession();
  const card = useMyCard();

  if (card.isPending) return <Loading label="Открываем карту…" rows={2} />;

  // 404 — карты ещё не выпускали. Это состояние экрана, а не ошибка
  if (card.isError) {
    const noCard = card.error instanceof ApiError && card.error.status === 404;
    if (!noCard) return <ErrorState error={card.error} onRetry={() => card.refetch()} />;

    return (
      <section className="flex flex-col gap-5 lg:max-w-[560px]">
        <Welcome />
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
      <Welcome />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:items-start lg:gap-12">
        {/* На компьютере карта держится на месте, пока справа листают операции */}
        <div className="lg:sticky lg:top-12">
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
        </div>

        <div className="flex flex-col gap-6">
          <div className="hidden lg:block">
            <h1 className="display text-[2.25rem] leading-tight">
              {name ? `Здравствуйте, ${customer?.firstName ?? name}` : "Моя карта"}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">Покажите QR на кассе — бонусы спишутся с этой карты.</p>
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
              Оплачено периодов: {subscription.periodsTotal ?? "—"}, выдано {subscription.periodsGranted ?? "—"}.
              Купленные месяцы приходят по очереди — баллы за них выдаются в начале каждого периода.
            </p>
          ) : (
            <p className="text-base leading-snug text-muted-foreground">
              Подписки нет: на карте остаток, и его ничто не продлевает. Оплатите месяц — баланс снова станет полным.
            </p>
          )}
          <RecentHistory />
        </div>
      </div>
    </section>
  );
}
