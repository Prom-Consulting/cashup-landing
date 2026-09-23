import { Card, EmptyState, ErrorState, Loading, PageHeader } from "@loal/ui/page";
import { Button } from "@loal/ui/inputs";
import { useState } from "react";
import { usePayments } from "../../entities/partner/api";
import { useCurrentPartner } from "../../entities/session/model";
import { formatDateTime } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");

/** Операции, прошедшие через сканер партнёра и его сотрудников. */
export function PaymentsPage() {
  const { memberId } = useCurrentPartner();
  const [page, setPage] = useState(1);
  const payments = usePayments(memberId ?? "", page);

  const rows = payments.data?.items ?? [];
  const total = payments.data?.total ?? 0;
  const pageSize = payments.data?.pageSize ?? 20;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Операции" description="Начисления и списания бонусов, сделанные у вас." />

      {payments.isPending && <Loading />}
      {payments.isError && <ErrorState error={payments.error} onRetry={() => payments.refetch()} />}
      {payments.isSuccess && rows.length === 0 && (
        <EmptyState title="Операций пока нет" description="Как только гость расплатится бонусами, строка появится здесь." />
      )}

      {rows.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="border-b border-smoke text-base text-slate">
                <th className="px-6 py-4 font-normal">Гость</th>
                <th className="px-6 py-4 font-normal">Операция</th>
                <th className="px-6 py-4 font-normal">Бонусов</th>
                <th className="px-6 py-4 font-normal">Когда</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-smoke/60 last:border-0">
                  <td className="px-6 py-4 text-lg">{row.customerName}</td>
                  <td className="px-6 py-4 text-lg">{row.txType === "earn" ? "Начисление" : "Списание"}</td>
                  <td className="px-6 py-4 text-lg tabular-nums">{money.format(row.amount)}</td>
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
