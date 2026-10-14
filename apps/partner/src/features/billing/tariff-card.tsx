import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import {
  BUSINESS_TARIFF_LABELS,
  TARIFF_LABELS,
  isBusinessTariff,
  isOctopayIntegrationReady,
  type MerchantSubscription,
  type MerchantTariff,
} from "@loal/api";
import { Badge, Button, Card, Icon } from "@loal/ui/shadcn";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "react-router";
import { merchantKeys, useOctopayIntegration } from "../../entities/merchant/api";
import { formatDate } from "../../shared/lib/format";
import { OctopayIntegration } from "../octopay/integration";

const BUNDLE_PERKS = [
  "Лояльность включена в подписку OctōPAY + Loal",
  "Клиент платит через OctōPAY и сам решает, сколько бонусов потратить",
  "«Счёт клиенту»: кассир вводит только сумму",
];

/** Что даёт тариф Доп. №5 — одной строкой под названием. */
const BUSINESS_ABOUT = {
  cashback: "Оранжевый стикер: клиенты получают у вас кэшбэк и тратят бонусы в сети.",
  redeem: "Чёрный стикер: клиенты оплачивают часть чека бонусами, списание проходит само.",
  full: "Белый стикер: списание и кэшбэк, выделение в каталоге и день видимости раз в неделю.",
} as const;

/**
 * Тариф магазина. У заведений по Доп. №5 — выбранный при регистрации (с бесплатными месяцами
 * акции, если досталось место), OctōPAY к нему подключают по желанию. У подключённых раньше —
 * по связи с OctōPAY: на «Только Loal» срок подписки, на «OctōPAY + Loal» — оплата пакета в OctōPAY.
 */
export function TariffCard({
  merchantId,
  tariff,
  businessTariff,
  freeMonths,
  subscription,
}: {
  merchantId: string;
  tariff: MerchantTariff;
  businessTariff?: string | null;
  freeMonths?: number | null;
  subscription: MerchantSubscription | null;
}) {
  const queryClient = useQueryClient();
  const integration = useOctopayIntegration(merchantId);
  const paidActive = subscription ? (subscription.paidActive ?? subscription.isActive) : false;
  const label = TARIFF_LABELS[tariff];

  // Проверка связи обновляет тариф на сервере: если он разошёлся с показанным — перечитываем
  const linked = integration.data ? integration.data.connected && integration.data.isEnabled === true : null;
  useEffect(() => {
    if (linked === null || linked === (tariff === "octopay")) return;
    void queryClient.invalidateQueries({ queryKey: merchantKeys.detail(merchantId), exact: true });
    void queryClient.invalidateQueries({ queryKey: merchantKeys.subscription(merchantId), exact: true });
  }, [linked, tariff, merchantId, queryClient]);

  if (isBusinessTariff(businessTariff))
    return (
      <Card className="flex flex-col">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-base text-muted-foreground">Тариф</p>
            <h2 className="display mt-1 text-[1.6rem] leading-tight">{BUSINESS_TARIFF_LABELS[businessTariff].title}</h2>
          </div>
          <Badge tone={paidActive ? "good" : "warn"}>
            {paidActive
              ? `${freeMonths ? "бесплатно" : "оплачено"} до ${formatDate(subscription?.expiresAt)}`
              : "не оплачено"}
          </Badge>
        </div>
        <p className="mt-2 max-w-[56ch] text-base leading-snug text-muted-foreground">{BUSINESS_ABOUT[businessTariff]}</p>
        {freeMonths ? (
          <p className="mt-2 text-base">Вы получили место по акции: {freeMonths} мес. без оплаты.</p>
        ) : null}
        {!paidActive && (
          <div className="mt-4">
            <Button asChild>
              <Link to="/billing">Оплатить подписку</Link>
            </Button>
          </div>
        )}
        <p className="mt-5 text-base font-bold">Приём платежей OctōPAY — по желанию</p>
        <OctopayIntegration key={merchantId} merchantId={merchantId} />
      </Card>
    );

  return (
    <Card className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base text-muted-foreground">Тариф</p>
          <h2 className="display mt-1 text-[1.6rem] leading-tight">{label.title}</h2>
        </div>
        {tariff === "octopay" ? (
          <Badge tone="good">Оплата в OctōPAY</Badge>
        ) : (
          <Badge tone={paidActive ? "good" : "warn"}>
            {paidActive ? `оплачено до ${formatDate(subscription?.expiresAt)}` : "не оплачено"}
          </Badge>
        )}
      </div>
      <p className="mt-2 max-w-[56ch] text-base leading-snug text-muted-foreground">{label.about}</p>

      {tariff === "octopay" && paidActive && subscription?.expiresAt && (
        <p className="mt-2 text-sm text-muted-foreground">
          Оплаченная подписка до {formatDate(subscription.expiresAt)} сохранится — если отключите OctōPAY, Loal продолжит
          работать до этой даты.
        </p>
      )}

      {tariff === "loal" && (
        <>
          <div className="mt-4">
            <Button asChild variant={paidActive ? "outline" : "primary"}>
              <Link to="/billing">{paidActive ? "Продлить подписку" : "Оплатить Loal"}</Link>
            </Button>
          </div>
          {/* Дорога к пакету: тот же блок подключения, что и ниже, — просто с объяснением зачем */}
          <div className="mt-5 rounded-[20px] bg-muted p-4 sm:p-5">
            <p className="text-lg font-bold">OctōPAY + Loal — единая подписка</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {BUNDLE_PERKS.map((perk) => (
                <li key={perk} className="flex gap-2 text-base leading-snug">
                  <Icon icon={CheckmarkCircle02Icon} className="mt-0.5 text-primary" />
                  {perk}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">
              Подключите свой магазин в OctōPAY ниже — тариф сменится сам. Подписку на пакет оплачивают в OctōPAY.
            </p>
          </div>
        </>
      )}

      <OctopayIntegration key={merchantId} merchantId={merchantId} />
      {tariff === "octopay" && integration.data && !isOctopayIntegrationReady(integration.data) && linked && (
        <p className="mt-3 text-sm text-muted-foreground">
          Пока OctōPAY не готов выставлять счета, бонусы по-прежнему принимает касса.
        </p>
      )}
    </Card>
  );
}
