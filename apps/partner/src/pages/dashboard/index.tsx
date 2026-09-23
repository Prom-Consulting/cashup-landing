import { Badge, Card, ErrorState, Loading, PageHeader } from "@loal/ui/page";
import { Link } from "react-router";
import { useDeductions, useStore, useSubscription } from "../../entities/store/api";
import { useCurrentStore } from "../../entities/session/model";
import { formatDate, formatDateTime } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");

/** Главный экран: можно ли принимать бонусы и что списали последним. */
export function DashboardPage() {
  const { storeId } = useCurrentStore();
  const store = useStore(storeId ?? "");
  const subscription = useSubscription(storeId ?? "");
  const recent = useDeductions(storeId ?? "", { page: 1, pageSize: 5 });

  if (subscription.isPending) return <Loading />;
  if (subscription.isError) return <ErrorState error={subscription.error} onRetry={() => subscription.refetch()} />;

  const active = subscription.data.isActive;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title={store.data?.name ?? "Кабинет магазина"}
        description="Пока подписка активна, касса и 1С могут списывать бонусы клиентов."
        action={<Badge tone={active ? "good" : "warn"}>{active ? "Бонусы принимаются" : "Приём остановлен"}</Badge>}
      />

      {!active && (
        <Card className="border-2 border-flame">
          <h2 className="text-xl font-bold text-flame-ink">Подписка неактивна</h2>
          <p className="mt-2 max-w-[70ch] text-lg">
            Списания не проходят ни через приложение, ни через 1С. Оплатите доступ — и приём включится.
          </p>
          <Link to="/billing" className="mt-4 inline-block text-lg text-flame-ink underline underline-offset-4">
            Перейти к оплате
          </Link>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold">Доступ</h2>
          <dl className="mt-4 flex flex-col gap-3">
            <div>
              <dt className="text-base text-slate">Тариф</dt>
              <dd className="text-lg">{subscription.data.plan ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-base text-slate">Действует до</dt>
              <dd className="text-lg">{formatDate(subscription.data.expiresAt)}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Последние списания</h2>
          {recent.isPending && <Loading />}
          {recent.isSuccess && recent.data.items.length === 0 && (
            <p className="mt-3 text-lg text-slate">Списаний пока не было.</p>
          )}
          <ul className="mt-3 flex flex-col gap-3">
            {(recent.data?.items ?? []).map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-t border-smoke pt-3"
              >
                <span className="text-lg">{row.productName ?? "Покупка"}</span>
                <span className="text-lg tabular-nums">−{money.format(row.points)}</span>
                <span className="basis-full text-base text-slate">{formatDateTime(row.createdAt)}</span>
              </li>
            ))}
          </ul>
          <Link to="/deductions" className="mt-4 inline-block text-base text-flame-ink underline underline-offset-4">
            Весь журнал
          </Link>
        </Card>
      </div>
    </section>
  );
}
