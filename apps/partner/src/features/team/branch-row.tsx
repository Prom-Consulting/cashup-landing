import { ApiError, createBranchInputSchema, type Branch } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Archive02Icon, PencilEdit02Icon, Store01Icon } from "@hugeicons/core-free-icons";
import { Button, ConfirmDialog, Dialog, DialogContent, DialogTrigger, FormField, FormStatus, Icon, Input } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useArchiveBranch, useRenameBranch } from "../../entities/merchant/api";

/** 409 BRANCH_HAS_MEMBERS: в филиале люди — сначала перевести или убрать их. */
function archiveErrorText(error: unknown) {
  if (error instanceof ApiError && error.code === "BRANCH_HAS_MEMBERS")
    return error.message || "В филиале есть сотрудники — переведите их в другой филиал или удалите, затем закройте.";
  return error instanceof Error ? error.message : "Не удалось закрыть филиал";
}

function peopleLabel(count: number) {
  const tail = count % 10;
  const teen = count % 100 >= 11 && count % 100 <= 14;
  if (count === 0) return "пока никого";
  if (!teen && tail === 1) return `${count} человек`;
  if (!teen && tail >= 2 && tail <= 4) return `${count} человека`;
  return `${count} человек`;
}

/** Филиал плиткой: название, сколько людей, переименовать или закрыть. Закрыть — не стереть: отчёты его помнят. */
export function BranchRow({ merchantId, branch, people }: { merchantId: string; branch: Branch; people: number }) {
  const rename = useRenameBranch(merchantId);
  const archive = useArchiveBranch(merchantId);
  const [open, setOpen] = useState(false);

  return (
    <li className="flex items-center gap-3 rounded-[var(--radius)] border border-border bg-background py-2 pl-3 pr-1">
      <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <Icon icon={Store01Icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-semibold">{branch.name}</span>
        <span className="block text-sm text-muted-foreground">{peopleLabel(people)}</span>
      </span>
      <span className="flex shrink-0 items-center">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Переименовать «${branch.name}»`} title="Переименовать">
              <Icon icon={PencilEdit02Icon} />
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
            <Button variant="ghost" size="icon" aria-label={`Закрыть «${branch.name}»`} title="Закрыть филиал">
              <Icon icon={Archive02Icon} />
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
