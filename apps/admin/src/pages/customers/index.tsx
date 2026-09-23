import { Search01Icon } from "@hugeicons/core-free-icons";
import { IssueCardDialog, useCustomers } from "@loal/app-kit";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  Input,
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
import { formatDate } from "../../shared/lib/format";

const PAGE_SIZE = 20;

/**
 * Клиенты и карты принадлежат платформе, а не заведению: список один на всех,
 * и виден он только агентству.
 */
export function CustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const customers = useCustomers({ page, pageSize: PAGE_SIZE, search: search.trim() || undefined });

  const rows = customers.data?.items ?? [];
  const total = customers.data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Клиенты"
        description={total > 0 ? `Всего держателей карт: ${total}` : "Держатели карт Loal и их карты."}
        action={<IssueCardDialog />}
      />

      <div className="relative max-w-[420px]">
        <Icon icon={Search01Icon} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Имя, телефон или почта"
          aria-label="Поиск по клиентам"
          className="pl-12"
        />
      </div>

      {customers.isPending && <Loading />}
      {customers.isError && <ErrorState error={customers.error} onRetry={() => customers.refetch()} />}
      {customers.isSuccess && rows.length === 0 && (
        <EmptyState
          title={search ? "Никого не нашли" : "Клиентов пока нет"}
          description={search ? "Попробуйте другой запрос." : "Выпустите первую карту — клиент появится здесь."}
        />
      )}

      {rows.length > 0 && (
        <Card className="p-0">
          <Table className="min-w-[620px]">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Клиент</TableHeaderCell>
                <TableHeaderCell>Телефон</TableHeaderCell>
                <TableHeaderCell>Почта</TableHeaderCell>
                <TableHeaderCell>Заведён</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    {[customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Без имени"}
                    {customer.archivedAt && (
                      <Badge tone="quiet" className="ml-2">
                        в архиве
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">{customer.phone ?? "—"}</TableCell>
                  <TableCell>{customer.email ?? "—"}</TableCell>
                  <TableCell className="text-base text-muted-foreground">{formatDate(customer.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {lastPage > 1 && (
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
            Назад
          </Button>
          <span className="text-base text-muted-foreground">
            Страница {page} из {lastPage}
          </span>
          <Button variant="ghost" size="sm" disabled={page >= lastPage} onClick={() => setPage((value) => value + 1)}>
            Дальше
          </Button>
        </div>
      )}
    </section>
  );
}
