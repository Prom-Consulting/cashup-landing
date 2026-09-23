import { ArrowLeft02Icon, Search01Icon } from "@hugeicons/core-free-icons";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@loal/ui/shadcn";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { useStore } from "../../entities/store/api";
import { formatDate } from "../../shared/lib/format";

const PAGE_SIZE = 20;

/** Клиенты магазина и выпуск карт. Карты выпускает магазин с ролью issuer. */
export function StoreCustomersPage() {
  const { storeId = "" } = useParams();
  const store = useStore(storeId);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const customers = useCustomers(storeId, { page, pageSize: PAGE_SIZE, search: search.trim() || undefined });

  const rows = customers.data?.items ?? [];
  const total = customers.data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="flex flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link to={`/stores/${storeId}`}>
          <Icon icon={ArrowLeft02Icon} />К магазину
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="display text-[clamp(1.75rem,3vw,2.5rem)]">Клиенты</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {store.data?.name ?? "Магазин"}
            {total > 0 ? ` · всего ${total}` : ""}
          </p>
        </div>
        <IssueCardDialog storeId={storeId} />
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
