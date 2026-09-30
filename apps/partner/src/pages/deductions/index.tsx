import { DEDUCTION_CHANNEL_LABELS } from "@loal/api";
import { Button, Icon, Input, PageHeader } from "@loal/ui/shadcn";
import { Search01Icon } from "@hugeicons/core-free-icons";
import {
  Card,
  EmptyState,
  ErrorState,
  Loading,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@loal/ui/shadcn";
import { useState } from "react";
import { useDeductions } from "../../entities/merchant/api";
import { useCurrentMerchant } from "../../entities/session/model";
import { formatDateTime } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");
const PAGE_SIZE = 50;

/** Журнал списаний: строка — один товар в чеке, а не чек целиком. */
export function DeductionsPage() {
  const { merchantId } = useCurrentMerchant();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const deductions = useDeductions(merchantId ?? "", { page, pageSize: PAGE_SIZE, search: search.trim() || undefined });

  const rows = deductions.data?.items ?? [];
  const total = deductions.data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Списания" description={total > 0 ? `Всего строк: ${money.format(total)}` : undefined} />

      <div className="relative max-w-[420px]">
        <Icon icon={Search01Icon} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Клиент или товар"
          aria-label="Поиск по клиенту и товару"
          className="pl-12"
        />
      </div>

      {deductions.isPending && <Loading />}
      {deductions.isError && <ErrorState error={deductions.error} onRetry={() => deductions.refetch()} />}
      {deductions.isSuccess && rows.length === 0 && (
        <EmptyState
          title="Списаний нет"
          description={search ? "Попробуйте изменить запрос." : "Строки появятся после первой оплаты бонусами."}
        />
      )}

      {rows.length > 0 && (
        <Card className="p-0">
          <Table className="sm:min-w-[860px]">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Клиент</TableHeaderCell>
                <TableHeaderCell>Товар</TableHeaderCell>
                <TableHeaderCell>Цена</TableHeaderCell>
                <TableHeaderCell>Доля</TableHeaderCell>
                <TableHeaderCell>Списано</TableHeaderCell>
                <TableHeaderCell>Кассир</TableHeaderCell>
                <TableHeaderCell>Откуда</TableHeaderCell>
                <TableHeaderCell>Когда</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell primary>{row.customerName ?? "—"}</TableCell>
                  <TableCell label="Товар">{row.productName ?? "—"}</TableCell>
                  <TableCell label="Цена" className="tabular-nums">
                    {row.price ? money.format(row.price) : "—"}
                  </TableCell>
                  <TableCell label="Доля" className="tabular-nums">
                    {row.coveragePercent ? `${row.coveragePercent}%` : "—"}
                  </TableCell>
                  <TableCell label="Списано" className="tabular-nums">
                    {money.format(row.points)}
                  </TableCell>
                  {/* У 1С и старых операций кассира нет — сервер отдаёт null */}
                  <TableCell label="Кассир">{row.cashierName ?? "—"}</TableCell>
                  <TableCell label="Откуда" className="text-base text-muted-foreground">
                    {DEDUCTION_CHANNEL_LABELS[row.channel ?? ""] ?? row.channel ?? "—"}
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
