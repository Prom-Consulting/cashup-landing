import {
  createProgramInputSchema,
  updateProgramInputSchema,
  type CreateProgramInput,
  type Program,
  type UpdateProgramInput,
} from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, ConfirmDialog, FormField, FormStatus, Input, Switch } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useCreateProgram, useDeleteProgram, useUpdateProgram } from "../../entities/platform/api";

const newProgram: CreateProgramInput = { name: "", pointsPerPeriod: 15000, welcomePoints: 0 };

export function CreateProgramForm() {
  const create = useCreateProgram();
  return (
    <Formik
      initialValues={newProgram}
      validate={zodValidate(createProgramInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          await create.mutateAsync(values);
          helpers.resetForm();
        } catch (error) {
          applyServerIssues(error, helpers, "Не удалось создать программу");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-wrap items-start gap-4" noValidate>
          <FocusFirstError form={form} />
          <FormField label="Название" className="min-w-[220px] flex-1" error={fieldError(form, "name")}>
            {(parts) => (
              <Input
                {...parts}
                name="name"
                value={form.values.name}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </FormField>
          <FormField label="Бонусов за месяц" className="w-[220px]" error={fieldError(form, "pointsPerPeriod")}>
            {(parts) => (
              <Input
                {...parts}
                name="pointsPerPeriod"
                inputMode="numeric"
                className="tabular-nums"
                value={String(form.values.pointsPerPeriod)}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </FormField>
          <FormField
            label="Приветственных"
            hint="Сразу при выдаче карты"
            className="w-[200px]"
            error={fieldError(form, "welcomePoints")}
          >
            {(parts) => (
              <Input
                {...parts}
                name="welcomePoints"
                inputMode="numeric"
                className="tabular-nums"
                value={String(form.values.welcomePoints ?? "")}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </FormField>
          <Button type="submit" variant="outline" className="mt-8" disabled={form.isSubmitting}>
            Создать
          </Button>
          <div className="basis-full">
            <FormStatus message={formError(form)} />
          </div>
        </Form>
      )}
    </Formik>
  );
}

/** Правка программы. Сколько баллов даёт месяц — главное её число. */
export function EditProgramForm({ program }: { program: Program }) {
  const update = useUpdateProgram(program.id);
  const remove = useDeleteProgram();
  const initialValues: UpdateProgramInput = {
    name: program.name,
    pointsPerPeriod: Number((program.config as { pointsPerPeriod?: number } | null)?.pointsPerPeriod ?? 15000),
    active: program.active ?? true,
    welcomePoints: program.welcomePoints ?? 0,
  };

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize
      validate={zodValidate(updateProgramInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          await update.mutateAsync(values);
          helpers.setStatus("Сохранено");
        } catch (error) {
          applyServerIssues(error, helpers, "Не удалось сохранить программу");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-5" noValidate>
          <FocusFirstError form={form} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Название" error={fieldError(form, "name")}>
              {(parts) => (
                <Input
                  {...parts}
                  name="name"
                  value={form.values.name}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              )}
            </FormField>
            <FormField
              label="Бонусов за месяц"
              hint="Выдаются в начале каждого оплаченного периода; остаток сгорает в конце."
              error={fieldError(form, "pointsPerPeriod")}
            >
              {(parts) => (
                <Input
                  {...parts}
                  name="pointsPerPeriod"
                  inputMode="numeric"
                  className="tabular-nums"
                  value={String(form.values.pointsPerPeriod)}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              )}
            </FormField>
          </div>
          <FormField
            label="Приветственные баллы"
            hint="Начисляются сразу при выдаче карты, в истории клиента — отдельной строкой. 0 — без них."
            className="max-w-[320px]"
            error={fieldError(form, "welcomePoints")}
          >
            {(parts) => (
              <Input
                {...parts}
                name="welcomePoints"
                inputMode="numeric"
                className="tabular-nums"
                value={String(form.values.welcomePoints ?? "")}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </FormField>
          <Switch
            checked={form.values.active}
            onCheckedChange={(checked) => form.setFieldValue("active", checked)}
            label="Программа действует"
            description="Выключенная программа не начисляет и не списывает."
          />
          <FormStatus tone={form.status === "Сохранено" ? "success" : "error"} message={formError(form)} />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={!form.dirty || form.isSubmitting}>
              Сохранить
            </Button>
            <ConfirmDialog
              trigger={<Button variant="ghost">Удалить программу</Button>}
              title={`Удалить «${program.name}»?`}
              description="Программа исчезнет насовсем. Если по ней выданы карты или к ней привязаны шаблоны, сервер откажет."
              confirmLabel="Удалить"
              onConfirm={() => remove.mutateAsync(program.id)}
            />
          </div>
        </Form>
      )}
    </Formik>
  );
}
