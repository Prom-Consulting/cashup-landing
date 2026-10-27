import { Card, EmptyState, ErrorState, Loading } from "@loal/ui/shadcn";
import { useSpending } from "../../entities/me/api";

const money = new Intl.NumberFormat("ru-RU");

const monogram = (name: string | null) =>
  (name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

const when = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

/**
 * «Где я трачу»: сколько человек потратил бонусами всего и у каждого заведения.
 * Траты считаются по человеку — перевыпуск карты их не обнуляет.
 */
export function SpendingPage() {
  const spending = useSpending();
  const data = spending.data;
  const items = data?.byMerchant ?? [];
  const visits = items.reduce((sum, m) => sum + m.visits, 0);

  return (
    <section className="flex flex-col gap-6 lg:max-w-[760px]">
      <h1 className="display text-[2rem] lg:text-[2.5rem]">Где я трачу</h1>

      {spending.isPending && <Loading rows={4} />}
      {spending.isError && <ErrorState error={spending.error} onRetry={() => spending.refetch()} />}

      {spending.isSuccess && (
        items.length === 0 ? (
          <EmptyState
            title="Трат пока нет"
            description="Потратьте бонусы у партнёров Loal — и здесь появится, где и сколько."
          />
        ) : (
          <>
            {/* Итог — крупно: сколько всего закрыто бонусами */}
            <Card className="bg-gradient-to-br from-flame to-amber p-7 text-white">
              <div className="text-sm font-medium opacity-90">Всего потрачено бонусами</div>
              <div className="mt-1 text-[clamp(2.4rem,9vw,3.5rem)] font-bold leading-none tracking-tight">
                {money.format(data!.total)}
              </div>
              <div className="mt-3 text-sm opacity-90">
                {items.length} {plural(items.length, "заведение", "заведения", "заведений")} · {visits}{" "}
                {plural(visits, "визит", "визита", "визитов")}
              </div>
            </Card>

            {/* Разбивка по заведениям, от большего к меньшему */}
            <ul className="flex flex-col gap-3">
              {items.map((m) => (
                <li key={m.merchantId}>
                  <Card className="flex items-center gap-4 p-4">
                    <span
                      aria-hidden
                      className="grid size-12 shrink-0 place-items-center rounded-full bg-flame/10 text-base font-bold text-flame-ink"
                    >
                      {monogram(m.merchantName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{m.merchantName ?? "Заведение"}</div>
                      <div className="mt-0.5 text-sm text-muted-foreground">
                        {m.visits} {plural(m.visits, "визит", "визита", "визитов")} · последний {when(m.lastAt)}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-bold text-flame-ink">{money.format(m.spent)}</div>
                      <div className="text-xs text-muted-foreground">бонусов</div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </>
        )
      )}
    </section>
  );
}
