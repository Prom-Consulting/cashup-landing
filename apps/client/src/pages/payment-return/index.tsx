import { ApiError } from "@loal/api";
import { Button, Card } from "@loal/ui/shadcn";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { useSubscriptionPayment } from "../../entities/me/api";
import { forgetPayment, recallPayment } from "../../shared/lib/pending-payment";

function Screen({
  tone,
  title,
  text,
  action,
}: {
  tone: "wait" | "good" | "bad";
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="mx-auto flex max-w-[520px] flex-col gap-5 py-8">
      <Card className="flex flex-col items-center gap-4 p-8 text-center">
        <span
          aria-hidden="true"
          className={`grid h-16 w-16 place-items-center rounded-full text-2xl font-bold text-white ${
            tone === "good" ? "bg-primary" : tone === "bad" ? "bg-graphite" : "brand-gradient animate-pulse"
          }`}
        >
          {tone === "good" ? "✓" : tone === "bad" ? "!" : ""}
        </span>
        <h1 className="display text-[1.9rem] leading-tight">{title}</h1>
        <p className="max-w-[40ch] text-lg leading-snug text-muted-foreground">{text}</p>
        {action}
      </Card>
    </section>
  );
}

/**
 * Возврат с OctōPAY. Готово только при paid + fulfilled: деньги пришли и цикл применён.
 * paid без fulfilled — сервер ещё начисляет, опрос сам его подтолкнёт.
 */
export function PaymentReturnPage() {
  const [params] = useSearchParams();
  const paymentId = params.get("paymentId") ?? recallPayment();
  const payment = useSubscriptionPayment(paymentId);
  const done = payment.data?.status === "paid" && payment.data.fulfilled;

  useEffect(() => {
    if (done || payment.data?.status === "cancelled") forgetPayment();
  }, [done, payment.data?.status]);

  const toCard = (
    <Button asChild size="lg">
      <Link to="/">К моей карте</Link>
    </Button>
  );

  if (!paymentId)
    return (
      <Screen
        tone="bad"
        title="Не нашли платёж"
        text="Если вы оплатили, бонусы появятся на карте в течение пары минут."
        action={toCard}
      />
    );
  if (payment.isError)
    return (
      <Screen
        tone="bad"
        title="Не нашли платёж"
        text={
          payment.error instanceof ApiError && payment.error.status === 404
            ? "Этот платёж не ваш или уже не существует. Если деньги списались, напишите нам."
            : "Не получилось проверить оплату. Загляните на карту чуть позже."
        }
        action={toCard}
      />
    );
  if (done)
    return (
      <Screen
        tone="good"
        title="Подписка оплачена"
        text="Новый цикл начался, бонусы уже на карте. Можно платить ими у партнёров."
        action={toCard}
      />
    );
  if (payment.data?.status === "cancelled")
    return (
      <Screen
        tone="bad"
        title="Оплата отменена"
        text="Деньги не списаны. Попробуйте ещё раз с карты — счёт создастся заново."
        action={toCard}
      />
    );
  return (
    <Screen
      tone="wait"
      title={payment.data?.status === "paid" ? "Оплата получена" : "Проверяем оплату"}
      text={
        payment.data?.status === "paid"
          ? "Начисляем бонусы на карту — это несколько секунд."
          : "Ждём подтверждение от OctōPAY. Страницу можно не обновлять."
      }
    />
  );
}
