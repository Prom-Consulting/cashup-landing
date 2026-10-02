import { MERCHANT_ROLE_LABELS, tariffOf } from "@loal/api";
import { Badge, Card, ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { Link } from "react-router";
import { useDeductions, useMerchant, useSubscription } from "../../entities/merchant/api";
import { useCurrentMerchant } from "../../entities/session/model";
import { TariffCard } from "../../features/billing/tariff-card";
import { formatDate, formatDateTime } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");

/**
 * Главный экран кассира и партнёра: подписка и журнал им закрыты (сервер ответит 403),
 * поэтому здесь только то, что они делают каждый день.
 */
function TeamDashboard() {
  const { merchantId, role } = useCurrentMerchant();
  const merchant = useMerchant(merchantId ?? "");
  const who = role ? MERCHANT_ROLE_LABELS[role] : undefined;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={merchant.data?.name ?? "Кабинет магазина"} description={who?.title} />
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <Card className="brand-gradient flex flex-col gap-4 text-white">
          <h2 className="display text-[clamp(1.8rem,3vw,2.4rem)] leading-tight">Клиент с картой Loal?</h2>
          <p className="max-w-[46ch] text-lg leading-snug text-white/90">
            Отсканируйте QR с его карты, добавьте покупку — бонусы закроют часть цены.
          </p>
          <Link
            to="/redeem"
            className="inline-flex w-fit items-center rounded-full bg-graphite px-7 py-4 text-lg font-bold text-white transition-colors hover:bg-white hover:text-graphite"
          >
            Списать бонусы
          </Link>
        </Card>
        <Card className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Что вам доступно</h2>
          <p className="text-base leading-snug text-muted-foreground">{who?.can}</p>
          <Link to="/storefront" className="text-base text-destructive underline underline-offset-4">
            Посмотреть витрину магазина
          </Link>
        </Card>
      </div>
    </section>
  );
}

/** Главный экран: можно ли принимать бонусы и что списали последним. */
export function DashboardPage() {
  const { canManage } = useCurrentMerchant();
  return canManage ? <OwnerDashboard /> : <TeamDashboard />;
}

/** Владелец: подписка, приём бонусов и последние списания. */
function OwnerDashboard() {
  const { merchantId } = useCurrentMerchant();
  const merchant = useMerchant(merchantId ?? "");
  const subscription = useSubscription(merchantId ?? "");
  const tariff = tariffOf(merchant.data?.tariff);
  const recent = useDeductions(merchantId ?? "", { page: 1, pageSize: 5 });

  if (subscription.isPending || merchant.isPending) return <Loading />;
  if (subscription.isError) return <ErrorState error={subscription.error} onRetry={() => subscription.refetch()} />;

  const pendingVerification = merchant.data?.status === "suspended" && merchant.data?.workflowStatus === "approval";
  const active = !pendingVerification && Boolean(subscription.data?.isActive);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title={merchant.data?.name ?? "Кабинет магазина"}
        description={
          pendingVerification ? "Заведение ожидает обязательной проверки супер-админа LOAL." : tariff === "octopay"
            ? "Тариф OctōPAY + Loal: бонусы принимаются, абонентской платы за Loal нет."
            : "Пока подписка активна, касса и 1С могут списывать бонусы клиентов."
        }
        action={<Badge tone={active ? "good" : "warn"}>{active ? "Бонусы принимаются" : "Приём остановлен"}</Badge>}
      />

      {pendingVerification && <Card className="border-2 border-flame"><h2 className="text-xl font-bold">Ожидает проверки супер-админа</h2><p className="mt-2 text-lg">Кабинет создан. Проверьте данные заведения в настройках. После одобрения заведение появится в каталоге и сможет принимать бонусы.</p></Card>}

      {!active && !pendingVerification && (
        <Card className="border-2 border-flame">
          <h2 className="text-xl font-bold text-destructive">
            {subscription.data ? "Подписка закончилась" : "Loal ещё не оплачен"}
          </h2>
          <p className="mt-2 max-w-[70ch] text-lg">
            Списания не проходят ни через приложение, ни через 1С. Оплатите Loal — или подключите OctōPAY, и Loal станет
            бесплатным.
          </p>
          <Link to="/billing" className="mt-4 inline-block text-lg text-destructive underline underline-offset-4">
            Перейти к оплате
          </Link>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <TariffCard merchantId={merchantId ?? ""} tariff={tariff} subscription={subscription.data ?? null} />

        <Card>
          <h2 className="text-xl font-bold">Последние списания</h2>
          {recent.isPending && <Loading />}
          {recent.isSuccess && recent.data.items.length === 0 && (
            <p className="mt-3 text-lg text-muted-foreground">Списаний пока не было.</p>
          )}
          <ul className="mt-3 flex flex-col gap-3">
            {(recent.data?.items ?? []).map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-3"
              >
                <span className="text-lg">{row.productName ?? "Покупка"}</span>
                <span className="text-lg tabular-nums">−{money.format(row.points)}</span>
                <span className="basis-full text-base text-muted-foreground">{formatDateTime(row.createdAt)}</span>
              </li>
            ))}
          </ul>
          <Link to="/deductions" className="mt-4 inline-block text-base text-destructive underline underline-offset-4">
            Весь журнал
          </Link>
        </Card>
      </div>
    </section>
  );
}
