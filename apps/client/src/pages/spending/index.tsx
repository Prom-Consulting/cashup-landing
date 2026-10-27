import { partnerPublicPath, type SpendingMerchant } from "@loal/api";
import { Card, EmptyState, ErrorState, Loading } from "@loal/ui/shadcn";
import { useState } from "react";
import { useSpending } from "../../entities/me/api";
import { SITE_URL } from "../../shared/config/env";

const money = new Intl.NumberFormat("ru-RU");
const site = SITE_URL.replace(/\/$/, "");

const monogram = (name: string | null) =>
  (name ?? "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

const when = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

/** Логотип заведения с запасной монограммой, если лого нет или не загрузилось. */
function Avatar({ name, logoUrl }: { name: string | null; logoUrl?: string | null }) {
  const [failed, setFailed] = useState(false);
  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt=""
        onError={() => setFailed(true)}
        className="size-12 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-flame/10 text-base font-bold text-flame-ink">
      {monogram(name)}
    </span>
  );
}

function MerchantRow({ m }: { m: SpendingMerchant }) {
  const inner = (
    <Card className="flex items-center gap-4 p-4 transition-colors hover:border-flame/30">
      <Avatar name={m.merchantName} logoUrl={m.logoUrl} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{m.merchantName ?? "Заведение"}</div>
        <div className="mt-0.5 truncate text-sm text-muted-foreground">
          {m.category ? `${m.category} · ` : ""}
          {m.visits} {plural(m.visits, "визит", "визита", "визитов")} · {when(m.lastAt)}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-bold text-flame-ink">{money.format(m.spent)}</div>
        <div className="text-xs text-muted-foreground">бонусов</div>
      </div>
    </Card>
  );
  // Ссылка на страницу заведения на loal.kg (если известны название и категория).
  return m.merchantName ? (
    <a href={`${site}${partnerPublicPath({ id: m.merchantId, name: m.merchantName, category: m.category })}`} target="_blank" rel="noopener">
      {inner}
    </a>
  ) : (
    inner
  );
}

/**
 * «Где я трачу»: сколько человек потратил бонусами всего и у каждого заведения.
 * Траты считаются по человеку — перевыпуск карты их не обнуляет.
 */
export function SpendingPage() {
  const spending = useSpending();
  const data = spending.data;
  const items = data?.byMerchant ?? [];
  const visits = items.reduce((sum, m) => sum + m.visits, 0);
  const surplus = data?.surplus ?? 0;

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
              {surplus > 0 && (
                <div className="mt-4 inline-flex rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
                  Вы в плюсе на {money.format(surplus)} сверх подписок 🎉
                </div>
              )}
            </Card>

            {/* Разбивка по заведениям, от большего к меньшему */}
            <ul className="flex flex-col gap-3">
              {items.map((m) => (
                <li key={m.merchantId}>
                  <MerchantRow m={m} />
                </li>
              ))}
            </ul>
          </>
        )
      )}
    </section>
  );
}
