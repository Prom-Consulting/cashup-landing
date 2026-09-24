import { createBranchInputSchema } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, Card, EmptyState, ErrorState, Input, Label, Loading, PageHeader } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useBranches, useCreateBranch, useMembers } from "../../entities/merchant/api";
import { useCurrentMerchant } from "../../entities/session/model";
import { AddMemberForm } from "../../features/team/add-member-form";
import { MemberRow } from "../../features/team/member-row";

/** Команда заведения: точки и люди, которые в них работают. */
export function TeamPage() {
  const { merchantId, canManage } = useCurrentMerchant();
  const branches = useBranches(merchantId ?? "");
  const members = useMembers(merchantId ?? "");
  const createBranch = useCreateBranch(merchantId ?? "");

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Команда"
        description="Точки заведения и сотрудники. Человека подключают по идентификатору: сначала он регистрируется сам."
      />

      <Card>
        <h2 className="text-xl font-bold">Точки</h2>
        {branches.isPending && <Loading rows={2} />}
        {branches.isError && <ErrorState error={branches.error} onRetry={() => branches.refetch()} />}
        <ul className="mt-4 flex flex-wrap gap-2">
          {(branches.data ?? []).map((branch) => (
            <li key={branch.id} className="rounded-full bg-muted px-4 py-2 text-base">
              {branch.name}
            </li>
          ))}
          {branches.isSuccess && branches.data.length === 0 && (
            <li className="text-base text-muted-foreground">Точек пока нет.</li>
          )}
        </ul>

        {canManage && (
          <Formik
            initialValues={{ name: "" }}
            validate={zodValidate(createBranchInputSchema)}
            onSubmit={async (values, helpers) => {
              helpers.setStatus(undefined);
              try {
                await createBranch.mutateAsync(values);
                helpers.resetForm();
              } catch (error) {
                applyServerIssues(error, helpers);
              } finally {
                helpers.setSubmitting(false);
              }
            }}
          >
            {(form) => (
              <Form className="mt-5 flex flex-wrap items-end gap-4" noValidate>
                <FocusFirstError form={form} />
                <div className="min-w-[240px] flex-1">
                  <Label htmlFor="branch-name">Новая точка</Label>
                  <Input
                    id="branch-name"
                    name="name"
                    placeholder="На Чуй"
                    className="mt-2"
                    value={form.values.name}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    invalid={Boolean(fieldError(form, "name"))}
                  />
                  {fieldError(form, "name") && (
                    <p className="mt-2 text-base text-destructive">{fieldError(form, "name")}</p>
                  )}
                </div>
                <Button type="submit" variant="outline" disabled={form.isSubmitting}>
                  Добавить
                </Button>
                {formError(form) && <p className="basis-full text-base text-destructive">{formError(form)}</p>}
              </Form>
            )}
          </Formik>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-bold">Сотрудники</h2>
        {members.isPending && <Loading rows={2} />}
        {members.isError && <ErrorState error={members.error} onRetry={() => members.refetch()} />}
        {members.isSuccess && members.data.length === 0 && <EmptyState title="Сотрудников пока нет" />}

        <ul className="mt-2 flex flex-col gap-4">
          {(members.data ?? []).map((member) => (
            <MemberRow
              key={member.id}
              merchantId={merchantId ?? ""}
              member={member}
              branches={branches.data ?? []}
              canManage={canManage}
            />
          ))}
        </ul>

        {canManage && <AddMemberForm merchantId={merchantId ?? ""} branches={branches.data ?? []} />}
      </Card>
    </section>
  );
}
