import { Badge, Card, ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { Link } from "react-router";
import { useCashierOverview, useCashierRedemptions } from "../../entities/cashier/api";
import { formatDate, formatDateTime } from "../../shared/lib/format";
import { subscriptionState } from "../../shared/lib/subscription";

const money = new Intl.NumberFormat("ru-RU");

/** Обзор филиала: где работает кассир, принимает ли заведение бонусы и что он списал последним. */
export function OverviewPage() {
  const overview = useCashierOverview();
  const recent = useCashierRedemptions({ page: 1, pageSize: 5, sortBy: "createdAt", sortDir: "desc" });

  if (overview.isPending) return <Loading rows={3} />;
  if (overview.isError) return <ErrorState error={overview.error} onRetry={() => overview.refetch()} />;

  const { branch, merchant, cashier } = overview.data;
  const { active, until, canRedeem } = subscriptionState(overview.data);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title={branch?.name || merchant?.name || "Ваш филиал"}
        description={[cashier?.fullName, branch?.name && merchant?.name ? merchant.name : null]
          .filter(Boolean)
          .join(" · ") || undefined}
      />

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        {active && canRedeem ? (
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
        ) : (
          <Card className="flex flex-col gap-3 border-2 border-destructive/30">
            <h2 className="text-xl font-bold">Бонусы сейчас не принимаются</h2>
            <p className="max-w-[52ch] text-lg leading-snug text-muted-foreground">
              {canRedeem
                ? "У заведения нет действующей подписки — списание не пройдёт. Скажите партнёру или владельцу: продлить её можно в кабинете партнёра."
                : "Списывать бонусы вам сейчас не разрешено. Спросите партнёра, который вас добавил."}
            </p>
          </Card>
        )}

        <Card className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Подписка заведения</h2>
          <div>
            <Badge tone={active ? "good" : "quiet"}>{active ? "Бонусы принимаются" : overview.data.subscription ? "Не активна" : "Нет подписки"}</Badge>
          </div>
          {until && (
            <p className="text-base text-muted-foreground">
              {active ? "Действует до" : "Закончилась"} {formatDate(until)}
            </p>
          )}
          {merchant?.name && branch?.name && (
            <p className="text-base text-muted-foreground">
              Заведение: <span className="text-foreground">{merchant.name}</span>
            </p>
          )}
        </Card>
      </div>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold">Мои последние списания</h2>
          <Link to="/history" className="text-base text-flame-ink underline underline-offset-4">
            Вся история
          </Link>
        </div>
        {recent.isPending && <Loading rows={2} />}
        {recent.isError && <ErrorState error={recent.error} onRetry={() => recent.refetch()} />}
        {recent.isSuccess && recent.data.items.length === 0 && (
          <p className="text-base text-muted-foreground">Вы ещё ничего не списывали.</p>
        )}
        <ul className="flex flex-col">
          {(recent.data?.items ?? []).map((row) => (
            <li
              key={row.id}
              className="flex items-baseline justify-between gap-4 border-t border-border py-3 first:border-t-0 first:pt-0"
            >
              <div className="min-w-0">
                <p className="truncate text-lg">{row.customerName || "Клиент"}</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(row.createdAt)}</p>
              </div>
              <span className="shrink-0 text-lg font-bold tabular-nums">−{money.format(row.amount)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
