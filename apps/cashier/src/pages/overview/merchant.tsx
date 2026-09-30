import { MERCHANT_ROLE_LABELS } from "@loal/api";
import { Card, ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { Link } from "react-router";
import { useCashierMerchant, useCashierSession } from "../../entities/cashier/api";

/** Обзор кассира магазина: где он работает и что ему доступно — как было в кабинете партнёра. */
export function MerchantOverview() {
  const { merchantId, membership } = useCashierSession();
  const merchant = useCashierMerchant(merchantId);
  const who = membership ? MERCHANT_ROLE_LABELS[membership.role] : undefined;

  if (merchant.isPending) return <Loading rows={3} />;

  return (
    <section className="flex flex-col gap-6">
      {merchant.isError && <ErrorState error={merchant.error} onRetry={() => merchant.refetch()} />}
      <PageHeader title={merchant.data?.name ?? "Ваше заведение"} description={who?.title} />
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
