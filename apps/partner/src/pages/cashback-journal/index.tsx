import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@loal/ui/shadcn";
import { useState } from "react";
import { Link } from "react-router";
import { useCashbackJournal } from "../../entities/merchant/api";
import { useCurrentMerchant } from "../../entities/session/model";
import { formatDateTime } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");
const PAGE_SIZE = 50;

/** Журнал кэшбэка: кому, за какую покупку и сколько бонусов начислила касса. */
export function CashbackJournalPage() {
  const { merchantId } = useCurrentMerchant();
  const [page, setPage] = useState(1);
  const journal = useCashbackJournal(merchantId ?? "", page, PAGE_SIZE);
  const rows = journal.data?.items ?? [];
  const total = journal.data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Начисления" description={total > 0 ? `Всего начислений: ${money.format(total)}` : undefined} />

      {journal.isPending && <Loading />}
      {journal.isError && <ErrorState error={journal.error} onRetry={() => journal.refetch()} />}
      {journal.isSuccess && rows.length === 0 && (
        <EmptyState
          title="Начислений пока нет"
          description="Строки появятся после первого кэшбэка на кассе."
          action={
            <Button asChild>
              <Link to="/cashback">Начислить кэшбэк</Link>
            </Button>
          }
        />
      )}

      {rows.length > 0 && (
        <Card className="p-0">
          <Table className="sm:min-w-[760px]">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Клиент</TableHeaderCell>
                <TableHeaderCell>Покупка</TableHeaderCell>
                <TableHeaderCell>Кэшбэк</TableHeaderCell>
                <TableHeaderCell>Кассир</TableHeaderCell>
                <TableHeaderCell>Когда</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell primary>{row.customerName}</TableCell>
                  <TableCell label="Покупка" className="tabular-nums">
                    {money.format(row.purchaseAmount)} сом
                  </TableCell>
                  <TableCell label="Кэшбэк" className="tabular-nums">
                    +{money.format(row.points)}
                    {row.percent ? <span className="text-muted-foreground"> · {row.percent}%</span> : null}
                    {row.capped ? <span className="text-muted-foreground"> · дневной предел</span> : null}
                  </TableCell>
                  <TableCell label="Кассир">{row.cashierName ?? "—"}</TableCell>
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
          <Button type="button" variant="ghost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Назад
          </Button>
          <span className="text-base text-muted-foreground">
            Страница {page} из {lastPage}
          </span>
          <Button type="button" variant="ghost" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>
            Дальше
          </Button>
        </div>
      )}
    </section>
  );
}
