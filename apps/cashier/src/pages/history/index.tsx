import type { CashierRedemptionQuery } from "@loal/api";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Loading,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  NativeSelect,
  TableRow,
} from "@loal/ui/shadcn";
import { useEffect, useState } from "react";
import { useCashierRedemptions } from "../../entities/cashier/api";
import { formatDateTime } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");
const PAGE_SIZE = 20;

type SortKey = `${NonNullable<CashierRedemptionQuery["sortBy"]>}:${NonNullable<CashierRedemptionQuery["sortDir"]>}`;

const SORTS: { value: SortKey; label: string }[] = [
  { value: "createdAt:desc", label: "Сначала новые" },
  { value: "createdAt:asc", label: "Сначала старые" },
  { value: "amount:desc", label: "Больше бонусов" },
  { value: "amount:asc", label: "Меньше бонусов" },
  { value: "customerName:asc", label: "Клиент А–Я" },
];

/** Свои списания кассира: без телефонов клиентов — только имя, сколько списано и когда. */
export function HistoryPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState<SortKey>("createdAt:desc");
  const [page, setPage] = useState(1);

  // Сервер ищет сам — не дёргаем его на каждую букву
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const [sortBy, sortDir] = sort.split(":") as [CashierRedemptionQuery["sortBy"], CashierRedemptionQuery["sortDir"]];
  const history = useCashierRedemptions({
    page,
    pageSize: PAGE_SIZE,
    search: debounced || undefined,
    sortBy,
    sortDir,
  });
  const rows = history.data?.items ?? [];
  const lastPage = Math.max(1, Math.ceil((history.data?.total ?? 0) / PAGE_SIZE));

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="История" description="Ваши списания в этом филиале." />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Имя клиента"
          aria-label="Поиск по истории"
          className="sm:max-w-[360px]"
        />
        <NativeSelect
          aria-label="Порядок"
          value={sort}
          onChange={(event) => {
            setSort(event.target.value as SortKey);
            setPage(1);
          }}
          className="sm:w-[220px]"
          options={SORTS}
        />
      </div>

      {history.isPending && <Loading rows={4} />}
      {history.isError && <ErrorState error={history.error} onRetry={() => history.refetch()} />}
      {history.isSuccess && rows.length === 0 && (
        <EmptyState
          title={debounced ? "Ничего не нашлось" : "Списаний пока нет"}
          description={debounced ? "Проверьте, как написано, или сбросьте поиск." : undefined}
        />
      )}

      {rows.length > 0 && (
        <Card className="p-0">
          <Table className="sm:min-w-[520px]">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Клиент</TableHeaderCell>
                <TableHeaderCell className="text-right">Бонусов</TableHeaderCell>
                <TableHeaderCell>Когда</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell primary>{row.customerName || "Клиент"}</TableCell>
                  <TableCell label="Бонусов" className="text-right font-bold tabular-nums">
                    −{money.format(row.amount)}
                  </TableCell>
                  <TableCell label="Когда" className="text-base text-muted-foreground">
                    {formatDateTime(row.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {lastPage > 1 && (
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Назад
          </Button>
          <span className="text-base text-muted-foreground">
            Страница {page} из {lastPage}
          </span>
          <Button variant="ghost" size="sm" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>
            Дальше
          </Button>
        </div>
      )}
    </section>
  );
}
