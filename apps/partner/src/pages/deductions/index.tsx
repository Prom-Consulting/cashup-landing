import { SearchInput } from "@loal/ui/inputs";
import { Button } from "@loal/ui/inputs";
import { Card, EmptyState, ErrorState, Loading, PageHeader } from "@loal/ui/page";
import { useState } from "react";
import { useDeductions } from "../../entities/store/api";
import { useCurrentStore } from "../../entities/session/model";
import { formatDateTime } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");
const PAGE_SIZE = 50;

/** Журнал списаний: строка — один товар в чеке, а не чек целиком. */
export function DeductionsPage() {
  const { storeId } = useCurrentStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const deductions = useDeductions(storeId ?? "", { page, pageSize: PAGE_SIZE, search: search.trim() || undefined });

  const rows = deductions.data?.items ?? [];
  const total = deductions.data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Списания" description={total > 0 ? `Всего строк: ${money.format(total)}` : undefined} />

      <SearchInput
        value={search}
        onValueChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        label="Поиск по клиенту и товару"
        placeholder="Клиент или товар"
        className="max-w-[420px]"
      />

      {deductions.isPending && <Loading />}
      {deductions.isError && <ErrorState error={deductions.error} onRetry={() => deductions.refetch()} />}
      {deductions.isSuccess && rows.length === 0 && (
        <EmptyState
          title="Списаний нет"
          description={search ? "Попробуйте изменить запрос." : "Строки появятся после первой оплаты бонусами."}
        />
      )}

      {rows.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-smoke text-base text-slate">
                <th className="px-6 py-4 font-normal">Клиент</th>
                <th className="px-6 py-4 font-normal">Товар</th>
                <th className="px-6 py-4 font-normal">Цена</th>
                <th className="px-6 py-4 font-normal">Доля</th>
                <th className="px-6 py-4 font-normal">Списано</th>
                <th className="px-6 py-4 font-normal">Откуда</th>
                <th className="px-6 py-4 font-normal">Когда</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-smoke/60 last:border-0">
                  <td className="px-6 py-4 text-lg">{row.customerName ?? "—"}</td>
                  <td className="px-6 py-4 text-lg">{row.productName ?? "—"}</td>
                  <td className="px-6 py-4 text-lg tabular-nums">{row.price ? money.format(row.price) : "—"}</td>
                  <td className="px-6 py-4 text-lg tabular-nums">
                    {row.coveragePercent ? `${row.coveragePercent}%` : "—"}
                  </td>
                  <td className="px-6 py-4 text-lg tabular-nums">{money.format(row.points)}</td>
                  <td className="px-6 py-4 text-base text-slate">{row.channel === "onec" ? "1С" : "приложение"}</td>
                  <td className="px-6 py-4 text-base text-slate">{formatDateTime(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {lastPage > 1 && (
        <div className="flex items-center gap-4">
          <Button type="button" variant="quiet" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Назад
          </Button>
          <span className="text-base text-slate">
            Страница {page} из {lastPage}
          </span>
          <Button type="button" variant="quiet" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>
            Дальше
          </Button>
        </div>
      )}
    </section>
  );
}
