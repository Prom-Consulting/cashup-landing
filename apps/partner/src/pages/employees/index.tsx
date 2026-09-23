import { Card, EmptyState, ErrorState, Loading, PageHeader } from "@loal/ui/page";
import { useEmployees } from "../../entities/partner/api";
import { useCurrentPartner } from "../../entities/session/model";
import { AddEmployeeForm } from "../../features/partner/add-employee-form";
import { formatDateTime } from "../../shared/lib/format";

/** Сотрудники партнёра: сканируют карты от его имени и с его же правом. */
export function EmployeesPage() {
  const { memberId } = useCurrentPartner();
  const employees = useEmployees(memberId ?? "");

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Сотрудники"
        description="Каждый сотрудник сканирует карты с тем же правом, что и вы: только начисление или только списание."
      />

      <Card>{memberId && <AddEmployeeForm memberId={memberId} />}</Card>

      {employees.isPending && <Loading />}
      {employees.isError && <ErrorState error={employees.error} onRetry={() => employees.refetch()} />}
      {employees.isSuccess && employees.data.length === 0 && (
        <EmptyState title="Сотрудников пока нет" description="Добавьте первого — он сможет сканировать карты гостей." />
      )}

      <div className="flex flex-col gap-3">
        {(employees.data ?? []).map((employee) => (
          <Card key={employee.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-lg">{employee.userId}</span>
              <span className="text-base text-slate">
                {employee.acceptedAt ? `работает с ${formatDateTime(employee.acceptedAt)}` : "приглашение не принято"}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
