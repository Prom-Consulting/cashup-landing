import { partnerOperation, type PartnerPaymentQuery } from "@loal/api";
import {
  Badge,
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
  TableRow,
} from "@loal/ui/shadcn";
import { useState, type ReactNode } from "react";
import { usePartnerMe, usePartnerPayments } from "../../entities/partner/api";
import { useCurrentMerchant } from "../../entities/session/model";
import { PartnerEmployees } from "../../features/partner/employees";
import { InvoiceClientForm } from "../../features/partner/invoice-client-form";
import { PayAccessForm } from "../../features/partner/pay-access";
import { formatDateTime } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");
const PAGE_SIZE = 20;

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {description && <p className="mt-1 max-w-[62ch] text-base text-muted-foreground">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

function Payments({ memberId }: { memberId: string }) {
  const [query, setQuery] = useState<PartnerPaymentQuery>({
    page: 1,
    pageSize: PAGE_SIZE,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const [search, setSearch] = useState("");
  const payments = usePartnerPayments(memberId, { ...query, search: search.trim() || undefined });
  const rows = payments.data?.items ?? [];
  const page = query.page ?? 1;
  const lastPage = Math.max(1, Math.ceil((payments.data?.total ?? 0) / PAGE_SIZE));

  const sortBy = (column: NonNullable<PartnerPaymentQuery["sortBy"]>) =>
    setQuery((current) => ({
      ...current,
      page: 1,
      sortBy: column,
      sortDir: current.sortBy === column && current.sortDir === "desc" ? "asc" : "desc",
    }));
  const arrow = (column: PartnerPaymentQuery["sortBy"]) =>
    query.sortBy === column ? (query.sortDir === "desc" ? " ↓" : " ↑") : "";
  const ariaSort = (column: PartnerPaymentQuery["sortBy"]) =>
    query.sortBy === column ? (query.sortDir === "desc" ? "descending" : "ascending") : "none";

  return (
    <div className="flex flex-col gap-4">
      <Input
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setQuery((current) => ({ ...current, page: 1 }));
        }}
        placeholder="Имя клиента"
        aria-label="Поиск по оплатам"
        className="max-w-[320px]"
      />
      {payments.isPending && <Loading rows={3} />}
      {payments.isError && <ErrorState error={payments.error} onRetry={() => payments.refetch()} />}
      {payments.isSuccess && rows.length === 0 && <EmptyState title="Операций пока не было" />}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <Table className="min-w-[480px]">
            <TableHead>
              <TableRow>
                <TableHeaderCell aria-sort={ariaSort("customerName")}>
                  <button type="button" onClick={() => sortBy("customerName")}>
                    Клиент{arrow("customerName")}
                  </button>
                </TableHeaderCell>
                <TableHeaderCell>Операция</TableHeaderCell>
                <TableHeaderCell className="text-right" aria-sort={ariaSort("amount")}>
                  <button type="button" onClick={() => sortBy("amount")}>
                    Баллов{arrow("amount")}
                  </button>
                </TableHeaderCell>
                <TableHeaderCell aria-sort={ariaSort("createdAt")}>
                  <button type="button" onClick={() => sortBy("createdAt")}>
                    Когда{arrow("createdAt")}
                  </button>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.customerName ?? "—"}</TableCell>
                  <TableCell>
                    <Badge tone={row.txType === "earn" ? "good" : "quiet"}>
                      {row.txType === "earn" ? "начисление" : "списание"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{money.format(row.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(row.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {lastPage > 1 && (
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 1}
            onClick={() => setQuery((current) => ({ ...current, page: page - 1 }))}
          >
            Назад
          </Button>
          <span className="text-base text-muted-foreground">
            Страница {page} из {lastPage}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= lastPage}
            onClick={() => setQuery((current) => ({ ...current, page: page + 1 }))}
          >
            Дальше
          </Button>
        </div>
      )}
    </div>
  );
}

/** Раздел партнёра: его единственная операция, сотрудники, оплаты и счета клиентам. */
export function PartnerPage() {
  const { membership } = useCurrentMerchant();
  const memberId = membership?.memberId ?? "";
  const isPartner = membership?.role === "partner";
  const me = usePartnerMe(memberId);
  const operation = partnerOperation(me.data?.permissions ?? membership?.permissions);

  if (!membership || (membership.role !== "partner" && membership.role !== "partner_employee")) {
    return <EmptyState title="Этот раздел — для партнёров заведения" />;
  }

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title={isPartner ? "Я партнёр" : "Сотрудник партнёра"}
        description={
          operation
            ? `Вы ${operation === "earn" ? "начисляете" : "списываете"} баллы клиентам — эту операцию выбрали при подключении, и она не меняется.`
            : "Операцию партнёру выбирает заведение при подключении."
        }
      />

      {me.isError && <ErrorState error={me.error} onRetry={() => me.refetch()} />}
      {me.data?.partnerBonusAmount ? (
        <Card>
          <p className="text-lg">
            Приветственный бонус:{" "}
            <span className="font-bold tabular-nums">{money.format(me.data.partnerBonusAmount)}</span> баллов
            {me.data.partnerBonusMaxPerCustomer
              ? `, до ${me.data.partnerBonusMaxPerCustomer} раз одному клиенту`
              : ", без ограничения"}
            .
          </p>
        </Card>
      ) : null}

      <Section
        title="Счёт клиенту"
        description="Клиент платит по ссылке OctōPAY — бонусы спишутся с его карты сами, без кассира."
      >
        <InvoiceClientForm memberId={memberId} />
      </Section>

      <Section
        title="Операции"
        description={
          isPartner
            ? "Всё, что прошло через ваш сканер и сканеры ваших сотрудников."
            : "Всё, что прошло через ваш сканер."
        }
      >
        <Payments memberId={memberId} />
      </Section>

      {isPartner && (
        <Section
          title="Мои сотрудники"
          description="Они делают ровно то же, что и вы, — другую операцию им не выбрать."
        >
          <PartnerEmployees memberId={memberId} />
        </Section>
      )}

      {isPartner && (
        <Section title="Оплатить доступ" description="Счёт откроется на странице OctōPAY.">
          <PayAccessForm memberId={memberId} />
        </Section>
      )}
    </section>
  );
}
