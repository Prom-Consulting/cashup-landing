import { ApiError } from "@loal/api";
import { Button, ErrorState, FormStatus, Loading } from "@loal/ui/shadcn";
import { useState } from "react";
import { useLegacyRenewal, usePayForSubscription, useSubscriptionOffer } from "../../entities/me/api";
import { SUBSCRIPTION_PRICE_KGS } from "../../shared/config/env";
import { rememberPayment } from "../../shared/lib/pending-payment";

const money = new Intl.NumberFormat("ru-RU");

function days(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} день`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} дня`;
  return `${n} дней`;
}

/**
 * Подписка v2: одна кнопка, условия — с сервера. Оплата сразу начинает новый цикл и
 * ставит баланс ровно в cycleBalance (не прибавляет): об этом говорим до оплаты.
 */
/**
 * На сервере ещё нет подписки v2 (шлюз отвечает 404 на offer): продлеваем старой оплатой по
 * номеру карты, цена — для показа из настроек кабинета. Уйдёт вместе с useLegacyRenewal.
 */
function LegacyRenewal({ serial }: { serial: string }) {
  const renew = useLegacyRenewal(serial);
  const [problem, setProblem] = useState<string>();
  return (
    <div className="mt-5 flex flex-col gap-5">
      <div className="rounded-[24px] bg-graphite p-6 text-white">
        <p className="display text-[2.6rem] leading-none tabular-nums">
          {money.format(SUBSCRIPTION_PRICE_KGS)} <span className="text-2xl">сом</span>
        </p>
        <p className="mt-5 text-2xl font-bold text-amber">15 000 бонусов</p>
        <p className="text-base text-slate-soft">на карту после оплаты</p>
      </div>
      <FormStatus message={problem} />
      <Button
        size="lg"
        disabled={renew.isPending}
        onClick={async () => {
          setProblem(undefined);
          try {
            const invoice = await renew.mutateAsync();
            if (invoice.paymentUrl) window.location.assign(invoice.paymentUrl);
            else setProblem("Счёт создан, но ссылка на оплату не пришла. Напишите нам.");
          } catch (error) {
            setProblem(error instanceof Error ? error.message : "Не удалось создать счёт. Попробуйте ещё раз.");
          }
        }}
      >
        {renew.isPending ? "Готовим счёт…" : `Оплатить ${money.format(SUBSCRIPTION_PRICE_KGS)} сом`}
      </Button>
      <p className="-mt-2 text-center text-sm text-muted-foreground">Оплата через OctōPAY</p>
    </div>
  );
}

export function RenewSubscription({ active, serial }: { active: boolean; serial: string }) {
  const offer = useSubscriptionOffer();
  const pay = usePayForSubscription();
  const [problem, setProblem] = useState<string>();

  if (offer.isPending) return <Loading rows={2} />;
  if (offer.isError && offer.error instanceof ApiError && offer.error.status === 404)
    return <LegacyRenewal serial={serial} />;
  if (offer.isError) return <ErrorState error={offer.error} onRetry={() => offer.refetch()} />;
  const { price, cycleDays, cycleBalance, available, planId } = offer.data;

  if (!available)
    return (
      <p role="alert" className="rounded-2xl bg-muted p-4 text-base">
        Карта заблокирована — оформить подписку на неё нельзя. Напишите нам, разберёмся.
      </p>
    );

  const start = async () => {
    setProblem(undefined);
    try {
      const payment = await pay.mutateAsync(planId);
      if (!payment.paymentUrl) return setProblem("Счёт создан, но ссылка на оплату не пришла. Напишите нам.");
      rememberPayment(payment.id);
      window.location.assign(payment.paymentUrl);
    } catch (error) {
      if (error instanceof ApiError && error.code === "SUBSCRIPTION_OFFER_CHANGED") {
        await offer.refetch();
        return setProblem("Условия подписки только что обновились — проверьте их и оплатите снова.");
      }
      if (error instanceof ApiError && error.code === "SUBSCRIPTION_UNAVAILABLE")
        return setProblem("Карта заблокирована — оформить подписку на неё нельзя. Напишите нам.");
      setProblem(error instanceof Error ? error.message : "Не удалось создать счёт. Попробуйте ещё раз.");
    }
  };

  return (
    <div className="mt-5 flex flex-col gap-5">
      <div className="rounded-[24px] bg-graphite p-6 text-white">
        <p className="display text-[2.6rem] leading-none tabular-nums">
          {money.format(price)} <span className="text-2xl">сом</span>
        </p>
        <p className="mt-2 text-lg text-slate-soft">за {days(cycleDays)}</p>
        <p className="mt-5 text-2xl font-bold text-amber tabular-nums">{money.format(cycleBalance)} бонусов</p>
        <p className="text-base text-slate-soft">на карту сразу после оплаты</p>
      </div>
      <ul className="flex flex-col gap-2 text-base leading-snug text-muted-foreground">
        <li>Баланс станет ровно {money.format(cycleBalance)} — остаток к нему не прибавляется.</li>
        {active && <li>Текущий цикл закроется сразу, оставшиеся дни не переносятся.</li>}
        <li>Когда цикл закончится, карта заморозится, а через 30 дней несгоревшие бонусы сгорят.</li>
      </ul>
      <FormStatus message={problem} />
      <Button size="lg" disabled={pay.isPending} onClick={start}>
        {pay.isPending ? "Готовим счёт…" : `Оплатить ${money.format(price)} сом`}
      </Button>
      <p className="-mt-2 text-center text-sm text-muted-foreground">Оплата через OctōPAY</p>
    </div>
  );
}
