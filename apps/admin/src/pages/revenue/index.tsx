import { MERCHANT_ACCESS, MERCHANT_ACCESS_LABELS, type MerchantAccess, type RevenueMerchant } from "@loal/api";
import { Badge, Card, EmptyState, ErrorState, Loading, PageHeader, cn } from "@loal/ui/shadcn";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useRevenue } from "../../entities/revenue/api";

const som = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" });

const isAccess = (value: string): value is MerchantAccess => (MERCHANT_ACCESS as readonly string[]).includes(value);

/** Кто платит — спокойно; пробный и «нет данных» — ждём денег; бесплатно и без оплаты — внимание. */
const TONE: Record<MerchantAccess, "good" | "neutral" | "warn" | "quiet"> = {
  octopay_paid: "good",
  loal_paid: "good",
  octopay_unlimited: "quiet",
  octopay_trial: "neutral",
  octopay_unknown: "neutral",
  loal_free: "warn",
  none: "warn",
};

const BAR: Record<MerchantAccess, string> = {
  octopay_paid: "bg-secondary",
  loal_paid: "bg-secondary",
  octopay_unlimited: "bg-muted-foreground/40",
  octopay_trial: "bg-amber",
  octopay_unknown: "bg-muted-foreground/25",
  loal_free: "bg-primary/60",
  none: "bg-primary",
};

function days(iso: string | null) {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

/** Одной строкой: до какого числа доступ и за чей счёт. */
function accessLine(item: RevenueMerchant) {
  const access = isAccess(item.access) ? item.access : null;
  if (access === "octopay_trial" || access === "octopay_paid") {
    const left = days(item.octopay.endsAt);
    if (!item.octopay.endsAt) return "Пакет оплачивается в OctōPAY";
    return `${access === "octopay_trial" ? "Пробный" : "Оплачен"} до ${date.format(new Date(item.octopay.endsAt))}${
      left !== null && left >= 0 ? ` · осталось ${left} дн.` : ""
    }`;
  }
  if (access === "octopay_unknown") return "OctōPAY ещё не сообщает об оплате — пакет считается действующим";
  if (access === "octopay_unlimited") return "Безлимит в OctōPAY";
  if (access === "loal_paid" || access === "loal_free") {
    const until = item.loal.subscriptionUntil ? `до ${date.format(new Date(item.loal.subscriptionUntil))}` : "";
    const why =
      access === "loal_free"
        ? [
            item.loal.grantedMonths ? `выдано руками: ${item.loal.grantedMonths} мес.` : null,
            item.loal.promoMonths ? `промокод: ${item.loal.promoMonths} мес.` : null,
          ]
            .filter(Boolean)
            .join(", ") || "без оплаты"
        : `оплачено ${som.format(item.loal.paidTotal)} сом`;
    return `Подписка Loal ${until} · ${why}`;
  }
  const octopayUnpaid = item.octopay.subscriptionActive === false ? "OctōPAY не оплачен, пакет не действует · " : "";
  if (access === "none" && octopayUnpaid) return `${octopayUnpaid}подписки Loal тоже нет — бонусы закрыты`;
  return item.loal.pendingInvoices > 0
    ? `Выставлено счетов: ${item.loal.pendingInvoices}, ни один не оплачен`
    : "Ни подписки, ни оплаты — бонусы закрыты";
}

function MoneyCard({ title, money }: { title: string; money: { paidTotal: number; paidCount: number; paid30d: number; pending30d: number } }) {
  return (
    <Card>
      <p className="text-base text-muted-foreground">{title}</p>
      <p className="display mt-2 text-[2.25rem] leading-none tabular-nums">{som.format(money.paid30d)} сом</p>
      <p className="mt-1 text-base text-muted-foreground">за 30 дней</p>
      <p className="mt-4 text-base">
        Всего {som.format(money.paidTotal)} сом · оплат {money.paidCount}
        {money.pending30d > 0 && <span className="text-muted-foreground"> · брошенных счетов за 30 дней: {money.pending30d}</span>}
      </p>
    </Card>
  );
}

/**
 * Деньги: сколько пришло и за счёт чего у заведений открыты бонусы. Пакет «OctōPAY + Loal»
 * оплачивается в OctōPAY — здесь видно, оплачен ли он, а «Бесплатно» и «Не оплачено» требуют внимания.
 */
export function RevenuePage() {
  const revenue = useRevenue();
  const [filter, setFilter] = useState<MerchantAccess | "all">("all");

  const merchants = useMemo(() => revenue.data?.merchants ?? [], [revenue.data]);
  const visible = useMemo(
    () =>
      merchants
        .filter((item) => filter === "all" || item.access === filter)
        // Сначала те, чей доступ кончится раньше, — с ними говорить в первую очередь
        .sort((a, b) => {
          const end = (m: RevenueMerchant) =>
            new Date(m.octopay.endsAt ?? m.loal.subscriptionUntil ?? "9999-12-31").getTime();
          return end(a) - end(b);
        }),
    [merchants, filter],
  );

  if (revenue.isPending) return <Loading rows={5} />;
  if (revenue.isError) return <ErrorState error={revenue.error} onRetry={() => revenue.refetch()} />;
  const { money, byAccess } = revenue.data;
  const total = merchants.length || 1;
  const present = MERCHANT_ACCESS.filter((access) => (byAccess[access] ?? 0) > 0);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Деньги"
        description="Сколько заплатили и почему у заведений открыты бонусы. Пакет «OctōPAY + Loal» оплачивается в OctōPAY: без оплаты он перестаёт действовать, и заведение платит за Loal отдельно."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <MoneyCard title="Подписки заведений (Loal)" money={money.merchants} />
        <MoneyCard title="Подписки клиентов" money={money.clients} />
      </div>

      <Card>
        <h2 className="text-xl font-bold">Откуда доступ у {merchants.length} заведений</h2>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          {present.map((access) => (
            <div key={access} className={BAR[access]} style={{ width: `${((byAccess[access] ?? 0) / total) * 100}%` }} />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Доступ">
          {(["all", ...present] as const).map((access) => (
            <button
              key={access}
              type="button"
              role="tab"
              aria-selected={filter === access}
              onClick={() => setFilter(access)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-base transition-colors",
                filter === access ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground",
              )}
            >
              {access !== "all" && <span aria-hidden="true" className={cn("h-2.5 w-2.5 rounded-full", BAR[access])} />}
              {access === "all" ? "Все" : MERCHANT_ACCESS_LABELS[access]}
              <span className="tabular-nums opacity-70">{access === "all" ? merchants.length : byAccess[access]}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {visible.length === 0 ? (
          <EmptyState title="Здесь пусто" />
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((item) => {
              const access = isAccess(item.access) ? item.access : null;
              const left = days(item.octopay.endsAt);
              const soon = access === "octopay_trial" && left !== null && left <= 7;
              return (
                <li
                  key={item.merchantId}
                  className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:px-6"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/merchants/${item.merchantId}`}
                      className="text-lg leading-tight font-semibold underline-offset-4 hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className={cn("mt-1 text-base", soon ? "font-medium text-destructive" : "text-muted-foreground")}>
                      {accessLine(item)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Badge tone="quiet">{item.tariff === "octopay" ? "OctōPAY + Loal" : "Только Loal"}</Badge>
                    {access && <Badge tone={TONE[access]}>{MERCHANT_ACCESS_LABELS[access]}</Badge>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </section>
  );
}
