import { ApiError, createEmployeeInputSchema, type CreateEmployeeInput } from "@loal/api";
import { fieldError, formError, zodValidate } from "@loal/forms";
import { Field } from "@loal/ui/field";
import { Button, Spinner, TextInput } from "@loal/ui/inputs";
import { Form, Formik } from "formik";
import { useAddEmployee } from "../../entities/partner/api";

const initialValues: CreateEmployeeInput = { userId: "" };

/**
 * Сотрудник добавляется по идентификатору уже зарегистрированного человека:
 * сначала он сам регистрируется на платформе, потом владелец выдаёт ему доступ.
 */
export function AddEmployeeForm({ memberId }: { memberId: string }) {
  const addEmployee = useAddEmployee(memberId);

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(createEmployeeInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          await addEmployee.mutateAsync(values);
          helpers.resetForm();
          helpers.setStatus("Сотрудник добавлен");
        } catch (error) {
          helpers.setStatus(
            error instanceof ApiError && error.status === 404
              ? "Пользователь с таким идентификатором не найден"
              : error instanceof Error
                ? error.message
                : "Не удалось добавить сотрудника",
          );
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-4 sm:flex-row sm:items-end" noValidate>
          <Field
            label="Идентификатор пользователя"
            hint="Его выдаёт платформа после регистрации сотрудника"
            error={fieldError(form, "userId")}
            className="flex-1"
          >
            {(parts) => (
              <TextInput
                {...parts}
                name="userId"
                value={form.values.userId}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </Field>
          <Button type="submit" variant="outline" disabled={form.isSubmitting}>
            {form.isSubmitting ? <Spinner /> : "Добавить"}
          </Button>
          {formError(form) && (
            <p role="status" className="text-base font-medium text-flame-ink sm:basis-full">
              {formError(form)}
            </p>
          )}
        </Form>
      )}
    </Formik>
  );
}
