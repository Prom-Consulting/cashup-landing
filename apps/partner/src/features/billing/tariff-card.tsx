import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import {
  LOAL_TARIFF_LABELS,
  TARIFF_LABELS,
  isLoalTariff,
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
import { usePublicTariffs } from "@loal/app-kit";
import { TariffChange } from "./tariff-change";

const BUNDLE_PERKS = [
  "Лояльность включена в подписку OctōPAY + Loal",
  "Клиент платит через OctōPAY и сам решает, сколько бонусов потратить",
  "«Счёт клиенту»: кассир вводит только сумму",
];

/**
 * Тариф Loal магазина (ТЗ №5): что он даёт, до какого числа оплачен и смена тарифа. Доступ
 * открывает только оплата (или месяцы от агентства); связь с OctōPAY — отдельно, по желанию:
 * от неё зависит только «Счёт клиенту». Старый шлюз без loalTariff — прежняя карточка ниже.
 */
export function TariffCard({
  merchantId,
  tariff,
  loalTariff,
  cashbackPercent,
  canChange,
  subscription,
}: {
  merchantId: string;
  tariff: MerchantTariff;
  loalTariff?: string | null;
  cashbackPercent?: number | null;
  /** Менять тариф может только владелец. */
  canChange?: boolean;
  subscription: MerchantSubscription | null;
}) {
  const queryClient = useQueryClient();
  const integration = useOctopayIntegration(merchantId);
  const paidActive = subscription ? (subscription.paidActive ?? subscription.isActive) : false;
  const label = TARIFF_LABELS[tariff];
  const prices = usePublicTariffs();
  const currentPrice = prices.isError ? undefined : prices.data?.find((item) => item.code === loalTariff);

  // Проверка связи обновляет тариф на сервере: если он разошёлся с показанным — перечитываем
  const linked = integration.data ? integration.data.connected && integration.data.isEnabled === true : null;
  useEffect(() => {
    if (linked === null || linked === (tariff === "octopay")) return;
    void queryClient.invalidateQueries({ queryKey: merchantKeys.detail(merchantId), exact: true });
    void queryClient.invalidateQueries({ queryKey: merchantKeys.subscription(merchantId), exact: true });
  }, [linked, tariff, merchantId, queryClient]);

  if (isLoalTariff(loalTariff))
    return (
      <Card className="flex flex-col">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-base text-muted-foreground">Тариф</p>
            <h2 className="display mt-1 text-[1.6rem] leading-tight">{LOAL_TARIFF_LABELS[loalTariff].title}</h2>
          </div>
          <Badge tone={subscription?.isActive ? "good" : "warn"}>
            {subscription?.isActive
              ? subscription.expiresAt
                ? `оплачено до ${formatDate(subscription.expiresAt)}`
                : "доступ бесплатный"
              : "не оплачено"}
          </Badge>
        </div>
        <p className="mt-2 max-w-[56ch] text-base leading-snug text-muted-foreground">
          {LOAL_TARIFF_LABELS[loalTariff].about}
          {cashbackPercent ? ` Кэшбэк клиенту — ${cashbackPercent}%.` : ""}
        </p>
        {currentPrice && <p className="mt-3 text-lg font-bold" aria-live="polite">
          {new Intl.NumberFormat("ru-RU").format(currentPrice.priceKgs)} сом/мес
          {currentPrice.freeOfferActive && <span className="mt-1 block text-sm font-normal text-muted-foreground">
            Осталось бесплатных мест: {currentPrice.freePlacesRemaining}. После заполнения для всех — {new Intl.NumberFormat("ru-RU").format(currentPrice.regularPriceKgs)} сом/мес.
          </span>}
        </p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild variant={subscription?.isActive ? "outline" : "primary"}>
            <Link to="/billing">{currentPrice?.priceKgs === 0 ? "Условия тарифа" : subscription?.isActive ? "Продлить" : "Оплатить"}</Link>
          </Button>
          {canChange && <TariffChange merchantId={merchantId} current={loalTariff} />}
        </div>
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
