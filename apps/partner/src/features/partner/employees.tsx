import { UserAdd01Icon } from "@hugeicons/core-free-icons";
import { ApiError, addEmployeeInputSchema, type AddEmployeeInput } from "@loal/api";
import { useJustRegistered } from "@loal/app-kit";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { PhoneInput, formatPhone } from "@loal/ui/inputs";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  FormField,
  FormStatus,
  Icon,
  Input,
  Loading,
  Toast,
} from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useAddEmployee, usePartnerEmployees } from "../../entities/partner/api";
import { formatDate } from "../../shared/lib/format";

const emptyEmployee: AddEmployeeInput = { fullName: "", phone: "" };

/**
 * Сотрудники партнёра работают в приложении-сканере и наследуют его единственную операцию —
 * выбирать им нечего. Заводятся по имени и телефону, как кассиры (docs/cashier.md).
 */
export function PartnerEmployees({ memberId }: { memberId: string }) {
  const employees = usePartnerEmployees(memberId);
  const add = useAddEmployee(memberId);
  const [added, setAdded] = useState<string>();
  const registered = useJustRegistered(
    employees.data,
    (employee) => employee.id,
    () => "Сотрудник",
  );

  return (
    <div className="flex flex-col gap-5">
      <Toast message={registered.message} onDismiss={registered.dismiss} />
      {employees.isPending && <Loading rows={2} />}
      {employees.isError && <ErrorState error={employees.error} onRetry={() => employees.refetch()} />}
      {employees.isSuccess && employees.data.length === 0 && <EmptyState title="Сотрудников пока нет" />}

      {(employees.data?.length ?? 0) > 0 && (
        <ul className="flex flex-col">
          {employees.data!.map((employee) => (
            <li
              key={employee.id}
              className="flex flex-col gap-0.5 border-t border-border py-3 first:border-t-0 first:pt-0"
            >
              <p className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold">{employee.fullName || "Без имени"}</span>
                {employee.registrationStatus === "pending" && <Badge tone="quiet">Ждёт первого входа</Badge>}
              </p>
              <p className="text-base text-muted-foreground tabular-nums">
                {employee.phone ? formatPhone(employee.phone) : "—"}
                {employee.registeredAt ? ` · вошёл ${formatDate(employee.registeredAt)}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Formik
        initialValues={emptyEmployee}
        validate={zodValidate(addEmployeeInputSchema)}
        onSubmit={async (values, helpers) => {
          helpers.setStatus(undefined);
          setAdded(undefined);
          try {
            await add.mutateAsync(values);
            helpers.resetForm();
            setAdded(
              `${values.fullName} добавлен(а). Пусть войдёт в приложение по номеру ${formatPhone(values.phone)} — код придёт в WhatsApp.`,
            );
          } catch (error) {
            if (error instanceof ApiError && error.isConflict)
              return helpers.setFieldError("phone", error.message || "Этот номер уже занят");
            applyServerIssues(error, helpers, "Не удалось добавить сотрудника");
          } finally {
            helpers.setSubmitting(false);
          }
        }}
      >
        {(form) => (
          <Form noValidate className="flex flex-col gap-4 border-t border-border pt-5">
            <FocusFirstError form={form} />
            <h3 className="text-lg font-bold">Новый сотрудник</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Имя" error={fieldError(form, "fullName")}>
                {(parts) => (
                  <Input
                    {...parts}
                    name="fullName"
                    autoComplete="off"
                    value={form.values.fullName}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </FormField>
              <FormField
                label="Телефон"
                hint="По нему сотрудник входит — код придёт в WhatsApp."
                error={fieldError(form, "phone")}
              >
                {(parts) => (
                  <PhoneInput
                    {...parts}
                    name="phone"
                    value={form.values.phone}
                    onValueChange={(value) => form.setFieldValue("phone", value)}
                    onBlur={() => form.setFieldTouched("phone", true)}
                  />
                )}
              </FormField>
            </div>
            <FormStatus message={formError(form)} />
            <FormStatus tone="success" message={added} />
            <div>
              <Button type="submit" variant="outline" disabled={form.isSubmitting}>
                <Icon icon={UserAdd01Icon} />
                {form.isSubmitting ? "Добавляем…" : "Добавить сотрудника"}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
