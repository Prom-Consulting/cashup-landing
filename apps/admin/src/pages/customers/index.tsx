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
import { useEffect, useState } from "react";
import { BulkIssueDialog } from "../../features/customer/bulk-issue-dialog";
import { CustomerArchiveAction } from "../../features/customer/customer-archive-action";
import { CustomerDialog } from "../../features/customer/customer-dialog";
import { cardPageUrl } from "../../shared/config/env";
import { formatDate } from "../../shared/lib/format";

const PAGE_SIZE = 20;

/**
 * Клиенты и карты принадлежат платформе, а не заведению: список один на всех,
 * и виден он только агентству.
 */
export function CustomersPage() {
  const [view, setView] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const customers = useCustomers({
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
    archived: view === "archived" ? true : undefined,
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [opened, setOpened] = useState<Customer | null>(null);

  const rows = customers.isPlaceholderData ? [] : customers.data?.items ?? [];
  const total = customers.isPlaceholderData ? 0 : customers.data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (customers.isSuccess && !customers.isPlaceholderData && page > lastPage) setPage(lastPage);
  }, [customers.isSuccess, customers.isPlaceholderData, page, lastPage]);

  const onStatusChange = (id: string) => {
    setSelected((current) => current.filter((selectedId) => selectedId !== id));
    setOpened((current) => current?.id === id ? null : current);
  };

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Клиенты"
        description={view === "archived" ? `Клиентов в архиве: ${total}` : total > 0 ? `Всего держателей карт: ${total}` : "Держатели карт Loal и их карты."}
        action={view === "active" ? <IssueCardDialog cardUrl={cardPageUrl} /> : undefined}
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Статус клиентов">
        <Button type="button" role="tab" aria-selected={view === "active"} variant={view === "active" ? "primary" : "outline"} size="sm" onClick={() => {
          setView("active");
          setPage(1);
          setSelected([]);
          setOpened(null);
        }}>
          Активные
        </Button>
        <Button type="button" role="tab" aria-selected={view === "archived"} variant={view === "archived" ? "primary" : "outline"} size="sm" onClick={() => {
          setView("archived");
          setPage(1);
          setSelected([]);
          setOpened(null);
        }}>
          Архив
        </Button>
      </div>

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

      {(customers.isPending || customers.isPlaceholderData) && <Loading />}
      {customers.isError && <ErrorState error={customers.error} onRetry={() => customers.refetch()} />}
      {customers.isSuccess && !customers.isPlaceholderData && rows.length === 0 && (
        <EmptyState
          title={search ? "Никого не нашли" : view === "archived" ? "Архив пуст" : "Клиентов пока нет"}
          description={search ? "Попробуйте другой запрос." : view === "archived" ? "Отправленные в архив клиенты появятся здесь." : "Выпустите первую карту — клиент появится здесь."}
        />
      )}

      {view === "active" && rows.length > 0 && (
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
          <Table className="sm:min-w-[620px]">
            <TableHead>
              <TableRow>
                {view === "active" && <TableHeaderCell className="w-12">
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
                </TableHeaderCell>}
                <TableHeaderCell>Клиент</TableHeaderCell>
                <TableHeaderCell>Телефон</TableHeaderCell>
                <TableHeaderCell>Почта</TableHeaderCell>
                <TableHeaderCell>{view === "archived" ? "В архиве с" : "Заведён"}</TableHeaderCell>
                <TableHeaderCell>Действия</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((customer) => (
                <TableRow key={customer.id}>
                  {view === "active" && <TableCell>
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
                  </TableCell>}
                  <TableCell primary>
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
                  <TableCell label="Телефон" className="tabular-nums">{customer.phone ?? "—"}</TableCell>
                  <TableCell label="Почта" className="break-all">{customer.email ?? "—"}</TableCell>
                  <TableCell label={view === "archived" ? "В архиве с" : "Заведён"} className="text-base text-muted-foreground">{formatDate(view === "archived" ? customer.archivedAt ?? customer.createdAt : customer.createdAt)}</TableCell>
                  <TableCell label="Действия">
                    <CustomerArchiveAction customer={customer} onDone={onStatusChange} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <CustomerDialog key={opened?.id ?? "closed"} customer={opened} onClose={() => setOpened(null)} onStatusChange={onStatusChange} />

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
