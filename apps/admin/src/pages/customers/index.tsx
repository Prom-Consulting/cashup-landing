import { Search01Icon } from "@hugeicons/core-free-icons";
import type { Customer } from "@loal/api";
import { IssueCardDialog, useCustomers } from "@loal/app-kit";
import {
  Badge,
  Button,
  Card,
  Checkbox,
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
import { BulkIssueDialog } from "../../features/customer/bulk-issue-dialog";
import { CustomerDialog } from "../../features/customer/customer-dialog";
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
  const [selected, setSelected] = useState<string[]>([]);
  const [opened, setOpened] = useState<Customer | null>(null);

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
        <div className="flex flex-wrap items-center gap-3">
          <BulkIssueDialog customerIds={selected} onDone={() => setSelected([])} />
          {selected.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
              Снять выбор
            </Button>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <Card className="p-0">
          <Table className="min-w-[620px]">
            <TableHead>
              <TableRow>
                <TableHeaderCell className="w-12">
                  <Checkbox
                    aria-label="Выбрать всех на странице"
                    checked={rows.length > 0 && rows.every((row) => selected.includes(row.id))}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked
                          ? [...new Set([...current, ...rows.filter((row) => !row.archivedAt).map((row) => row.id)])]
                          : current.filter((id) => !rows.some((row) => row.id === id)),
                      )
                    }
                  />
                </TableHeaderCell>
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
                    <Checkbox
                      aria-label="Выбрать клиента"
                      disabled={Boolean(customer.archivedAt)}
                      checked={selected.includes(customer.id)}
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked ? [...current, customer.id] : current.filter((id) => id !== customer.id),
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setOpened(customer)}
                      className="text-left font-medium underline-offset-4 hover:underline"
                    >
                      {[customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Без имени"}
                    </button>
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

      <CustomerDialog customer={opened} onClose={() => setOpened(null)} />

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
