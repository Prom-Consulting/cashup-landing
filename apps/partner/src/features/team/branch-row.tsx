import { ApiError, createBranchInputSchema, type Branch } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, ConfirmDialog, Dialog, DialogContent, DialogTrigger, FormField, FormStatus, Input } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useArchiveBranch, useRenameBranch } from "../../entities/merchant/api";

/** 409 BRANCH_HAS_MEMBERS: в филиале люди — сначала перевести или убрать их. */
function archiveErrorText(error: unknown) {
  if (error instanceof ApiError && error.code === "BRANCH_HAS_MEMBERS")
    return error.message || "В филиале есть сотрудники — переведите их в другой филиал или удалите, затем закройте.";
  return error instanceof Error ? error.message : "Не удалось закрыть филиал";
}

/** Филиал в списке владельца: переименовать или закрыть. Закрыть — не стереть: отчёты его помнят. */
export function BranchRow({ merchantId, branch }: { merchantId: string; branch: Branch }) {
  const rename = useRenameBranch(merchantId);
  const archive = useArchiveBranch(merchantId);
  const [open, setOpen] = useState(false);

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-3 first:border-t-0 first:pt-0">
      <span className="text-lg">{branch.name}</span>
      <span className="flex items-center gap-1">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              Переименовать
            </Button>
          </DialogTrigger>
          <DialogContent title="Переименовать филиал" description="Новое название увидят сотрудники и отчёты.">
            <Formik
              initialValues={{ name: branch.name }}
              validate={zodValidate(createBranchInputSchema)}
              onSubmit={async (values, helpers) => {
                helpers.setStatus(undefined);
                try {
                  await rename.mutateAsync({ branchId: branch.id, name: values.name });
                  setOpen(false);
                } catch (error) {
                  applyServerIssues(error, helpers, "Не удалось переименовать");
                } finally {
                  helpers.setSubmitting(false);
                }
              }}
            >
              {(form) => (
                <Form noValidate className="flex flex-col gap-4">
                  <FocusFirstError form={form} />
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
                  <FormStatus message={formError(form)} />
                  <Button type="submit" disabled={form.isSubmitting}>
                    Сохранить
                  </Button>
                </Form>
              )}
            </Formik>
          </DialogContent>
        </Dialog>
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="sm">
              Закрыть
            </Button>
          }
          title={`Закрыть «${branch.name}»?`}
          description="Филиал пропадёт из списка и выбора, но прошлые операции останутся привязаны к нему. Если в нём ещё есть люди — сначала переведите их."
          confirmLabel="Закрыть филиал"
          onConfirm={async () => {
            try {
              await archive.mutateAsync(branch.id);
            } catch (error) {
              throw new Error(archiveErrorText(error));
            }
          }}
        />
      </span>
    </li>
  );
}
