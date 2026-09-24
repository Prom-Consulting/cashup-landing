import { HISTORY_KIND_LABELS, type HistoryKind } from "@loal/api";
import { Button, Card, EmptyState, ErrorState, Loading } from "@loal/ui/shadcn";
import { useState } from "react";
import { useMyHistory } from "../../entities/me/api";
import { formatDateTime } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");

/** История считается по человеку: перевыпуск карты её не обнуляет. */
export function HistoryPage() {
  const [page, setPage] = useState(1);
  const history = useMyHistory(page);

  const rows = history.data?.items ?? [];
  const total = history.data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / (history.data?.pageSize ?? 20)));

  return (
    <section className="flex flex-col gap-5">
      <h1 className="display text-[2rem]">История</h1>

      {history.isPending && <Loading rows={4} />}
      {history.isError && <ErrorState error={history.error} onRetry={() => history.refetch()} />}
      {history.isSuccess && rows.length === 0 && (
        <EmptyState title="Пока пусто" description="Здесь появятся начисления и траты бонусов." />
      )}

      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const kind = (HISTORY_KIND_LABELS[row.kind as HistoryKind] ?? "Изменение") as string;
          const positive = row.amount > 0;
          return (
            <Card key={row.id} className="p-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-lg">{row.merchantName ?? kind}</p>
                <p className={`text-lg font-bold tabular-nums ${positive ? "text-foreground" : "text-destructive"}`}>
                  {positive ? "+" : "−"}
                  {money.format(Math.abs(row.amount))}
                </p>
              </div>
              <p className="mt-1 text-base text-muted-foreground">
                {/* Название заведения уже в заголовке — не повторяем подпись операции */}
                {row.merchantName ? `${kind} · ${formatDateTime(row.createdAt)}` : formatDateTime(row.createdAt)}
              </p>
              {row.items.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
                  {row.items.map((item, index) => (
                    <li key={`${row.id}-${index}`} className="flex justify-between gap-3 text-base">
                      <span>{item.productName ?? "Покупка"}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {item.points ? `−${money.format(item.points)}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
            Назад
          </Button>
          <span className="text-base text-muted-foreground">
            {page} из {lastPage}
          </span>
          <Button variant="ghost" size="sm" disabled={page >= lastPage} onClick={() => setPage((value) => value + 1)}>
            Дальше
          </Button>
        </div>
      )}
    </section>
  );
}
