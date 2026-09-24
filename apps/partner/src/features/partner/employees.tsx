import { addEmployeeInputSchema, type AddEmployeeInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Badge, Button, EmptyState, ErrorState, FormField, FormStatus, Input, Loading } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useAddEmployee, usePartnerEmployees } from "../../entities/partner/api";
import { formatDateTime } from "../../shared/lib/format";

/** Сотрудники партнёра наследуют его единственную операцию — выбирать им нечего. */
export function PartnerEmployees({ memberId }: { memberId: string }) {
  const employees = usePartnerEmployees(memberId);
  const add = useAddEmployee(memberId);
  const [done, setDone] = useState<string>();
  const initialValues: AddEmployeeInput = { userId: "" };

  return (
    <div className="flex flex-col gap-5">
      {employees.isPending && <Loading rows={2} />}
      {employees.isError && <ErrorState error={employees.error} onRetry={() => employees.refetch()} />}
      {employees.isSuccess && employees.data.length === 0 && <EmptyState title="Сотрудников пока нет" />}
      <ul className="flex flex-col gap-3">
        {(employees.data ?? []).map((employee) => (
          <li
            key={employee.id}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 first:border-t-0"
          >
            <span className="truncate text-base tabular-nums">{employee.userId}</span>
            {employee.acceptedAt ? (
              <span className="text-sm text-muted-foreground">с {formatDateTime(employee.acceptedAt)}</span>
            ) : (
              <Badge tone="quiet">ждёт подтверждения заведения</Badge>
            )}
          </li>
        ))}
      </ul>

      <Formik
        initialValues={initialValues}
        validate={zodValidate(addEmployeeInputSchema)}
        onSubmit={async (values, helpers) => {
          helpers.setStatus(undefined);
          setDone(undefined);
          try {
            await add.mutateAsync(values);
            helpers.resetForm();
            setDone("Сотрудник добавлен");
          } catch (error) {
            applyServerIssues(error, helpers, "Не удалось добавить сотрудника");
          } finally {
            helpers.setSubmitting(false);
          }
        }}
      >
        {(form) => (
          <Form noValidate className="flex flex-wrap items-start gap-3 border-t border-border pt-5">
            <FocusFirstError form={form} />
            <FormField
              label="Идентификатор пользователя"
              hint="Сотрудник сначала регистрируется сам и присылает свой идентификатор."
              className="min-w-[260px] flex-1"
              error={fieldError(form, "userId")}
            >
              {(parts) => (
                <Input
                  {...parts}
                  name="userId"
                  value={form.values.userId}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              )}
            </FormField>
            <Button type="submit" variant="outline" className="mt-8" disabled={form.isSubmitting}>
              Добавить
            </Button>
            <div className="basis-full">
              <FormStatus message={formError(form)} />
              <FormStatus tone="success" message={done} />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
