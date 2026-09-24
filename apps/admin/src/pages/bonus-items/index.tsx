import { Search01Icon } from "@hugeicons/core-free-icons";
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
  Tabs,
  TabsList,
  TabsTrigger,
} from "@loal/ui/shadcn";
import { useState } from "react";
import { useBonusItems } from "../../entities/platform/api";
import { formatDateTime } from "../../shared/lib/format";

const PAGE_SIZE = 50;

/**
 * Бонусные товары — наследие прежнего продукта: именованные подарки на карте.
 * К подписке Loal отношения не имеют; экран нужен, чтобы видеть выданные и погашенные.
 */
export function BonusItemsPage() {
  const [status, setStatus] = useState<"active" | "redeemed">("active");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const items = useBonusItems({ status, page, pageSize: PAGE_SIZE, search: search.trim() || undefined });
  const rows = items.data?.items ?? [];
  const lastPage = Math.max(1, Math.ceil((items.data?.total ?? 0) / PAGE_SIZE));

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Бонусные товары"
        description="Подарки на карте из прежней механики. Включаются в программе, во вкладке «Партнёрам»."
      />

      <div className="flex flex-wrap items-center gap-4">
        <Tabs
          value={status}
          onValueChange={(value) => {
            setStatus(value as "active" | "redeemed");
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="active">Не погашены</TabsTrigger>
            <TabsTrigger value="redeemed">Погашены</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full max-w-[360px]">
          <Icon icon={Search01Icon} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Клиент или подарок"
            aria-label="Поиск по бонусным товарам"
            className="pl-12"
          />
        </div>
      </div>

      {items.isPending && <Loading />}
      {items.isError && <ErrorState error={items.error} onRetry={() => items.refetch()} />}
      {items.isSuccess && rows.length === 0 && (
        <EmptyState
          title={search ? "Ничего не нашли" : status === "active" ? "Негашеных подарков нет" : "Погашенных пока нет"}
        />
      )}

      {rows.length > 0 && (
        <Card className="p-0">
          <Table className="min-w-[560px]">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Клиент</TableHeaderCell>
                <TableHeaderCell>Подарок</TableHeaderCell>
                <TableHeaderCell>Выдан</TableHeaderCell>
                <TableHeaderCell>Погашен</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.customerName ?? "—"}</TableCell>
                  <TableCell>{item.value}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(item.grantedAt)}</TableCell>
                  <TableCell>
                    {item.redeemedAt ? formatDateTime(item.redeemedAt) : <Badge tone="quiet">ещё нет</Badge>}
                  </TableCell>
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
