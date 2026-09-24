import { ApiError } from "@loal/api";
import { AppleIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { useSession } from "@loal/app-kit";
import { Button, Card, Dialog, DialogContent, DialogTrigger, ErrorState, Icon, Loading } from "@loal/ui/shadcn";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useMyCard } from "../../entities/me/api";
import { FirstCardForm } from "../../features/subscription/first-card-form";
import { PaySubscriptionForm } from "../../features/subscription/pay-form";
import { formatDate } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");

function useQr(value: string, width = 480) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { margin: 0, width, color: { dark: "#090809", light: "#ffffff" } })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [value, width]);
  return src;
}

/**
 * Своя карта. Сервер читает человека из токена, поэтому номера в адресе нет —
 * чужую карту спросить нельзя в принципе.
 */
export function MyCardPage() {
  const { session } = useSession();
  const card = useMyCard();
  const qr = useQr(card.data?.serialNumber ?? "");
  const bigQr = useQr(card.data?.serialNumber ?? "", 900);

  if (card.isPending) return <Loading label="Открываем карту…" rows={2} />;

  // 404 — карты ещё не выпускали. Это состояние экрана, а не ошибка
  if (card.isError) {
    const noCard = card.error instanceof ApiError && card.error.status === 404;
    if (!noCard) return <ErrorState error={card.error} onRetry={() => card.refetch()} />;

    return (
      <section className="flex flex-col gap-5">
        <h1 className="display text-[clamp(1.75rem,7vw,2.25rem)] leading-[1.1]">Карты пока нет</h1>
        <p className="text-lg text-muted-foreground">
          Оформите подписку — карта появится в Apple Wallet сразу после оплаты, а на ней 100 000 сом бонусами.
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
      <div className="receipt bg-graphite px-6 pt-6 pb-9 text-white">
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
        <p className="mt-2 text-lg text-slate-soft">сом, потратить у партнёров</p>

        <div className="mt-7 flex items-center gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <button type="button" className="rounded-2xl bg-white p-3 transition-transform hover:scale-[1.03]">
                {qr ? <img src={qr} alt="" className="h-28 w-28" /> : <span className="block h-28 w-28" />}
                <span className="sr-only">Показать QR во весь экран</span>
              </button>
            </DialogTrigger>
            <DialogContent title="QR для кассы" description="Поднесите к сканеру. Экран лучше сделать поярче.">
              {bigQr && <img src={bigQr} alt="" className="mx-auto aspect-square w-full max-w-[420px]" />}
              <p className="mt-4 text-center text-lg tabular-nums">{serialNumber}</p>
            </DialogContent>
          </Dialog>
          <div>
            <p className="text-base text-slate-soft">Покажите на кассе</p>
            <p className="mt-1 text-lg tabular-nums">{serialNumber}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {walletUrl && (
          <Button asChild variant="secondary" size="lg">
            <a href={walletUrl}>
              <Icon icon={AppleIcon} />
              Добавить в Apple Wallet
            </a>
          </Button>
        )}

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="lg">
              <Icon icon={RefreshIcon} />
              {subscription ? "Продлить подписку" : "Оформить подписку"}
            </Button>
          </DialogTrigger>
          <DialogContent
            title={subscription ? "Продлить подписку" : "Оформить подписку"}
            description="Каждый оплаченный месяц на карте снова 100 000 сом бонусами. Остаток прошлого месяца сгорает."
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
