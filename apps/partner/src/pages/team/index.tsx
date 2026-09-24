import { MEMBER_ROLE_LABELS, addMemberInputSchema, createBranchInputSchema, type AddMemberInput } from "@loal/api";
import { fieldError, formError, zodValidate } from "@loal/forms";
import { Badge, Button, Card, EmptyState, ErrorState, Input, Label, Loading, PageHeader } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useAddMember, useBranches, useCreateBranch, useMembers, useRemoveMember } from "../../entities/merchant/api";
import { useCurrentMerchant } from "../../entities/session/model";
import { formatDateTime } from "../../shared/lib/format";

/** Команда заведения: точки и люди, которые в них работают. */
export function TeamPage() {
  const { merchantId, canManage } = useCurrentMerchant();
  const branches = useBranches(merchantId ?? "");
  const members = useMembers(merchantId ?? "");
  const createBranch = useCreateBranch(merchantId ?? "");
  const addMember = useAddMemberForm(merchantId ?? "");
  const removeMember = useRemoveMember(merchantId ?? "");

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
                helpers.setStatus(error instanceof Error ? error.message : "Не удалось добавить точку");
              } finally {
                helpers.setSubmitting(false);
              }
            }}
          >
            {(form) => (
              <Form className="mt-5 flex flex-wrap items-end gap-4" noValidate>
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

        <ul className="mt-4 flex flex-col gap-3">
          {(members.data ?? []).map((member) => (
            <li
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"
            >
              <div className="min-w-0">
                <p className="text-lg">{member.userId}</p>
                <p className="mt-1 text-base text-muted-foreground">
                  {MEMBER_ROLE_LABELS[member.role] ?? member.role} ·{" "}
                  {member.acceptedAt ? `работает с ${formatDateTime(member.acceptedAt)}` : "приглашение не принято"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {!member.acceptedAt && <Badge tone="quiet">ждёт</Badge>}
                {canManage && member.role !== "admin" && (
                  <Button variant="ghost" size="sm" onClick={() => removeMember.mutate(member.id)}>
                    Убрать
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {canManage && <AddMemberForm {...addMember} />}
      </Card>
    </section>
  );
}

/** Отдельно от разметки, чтобы форма не разрасталась внутри карточки. */
function useAddMemberForm(merchantId: string) {
  const add = useAddMember(merchantId);
  return { add };
}

function AddMemberForm({ add }: ReturnType<typeof useAddMemberForm>) {
  const initialValues: AddMemberInput = { userId: "", role: "staff" };

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(addMemberInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          await add.mutateAsync(values);
          helpers.resetForm();
          helpers.setStatus("Сотрудник подключён");
        } catch (error) {
          helpers.setStatus(error instanceof Error ? error.message : "Не удалось подключить сотрудника");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="mt-6 flex flex-wrap items-end gap-4 border-t border-border pt-5" noValidate>
          <div className="min-w-[240px] flex-1">
            <Label htmlFor="userId">Идентификатор пользователя</Label>
            <Input
              id="userId"
              name="userId"
              className="mt-2"
              value={form.values.userId}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              invalid={Boolean(fieldError(form, "userId"))}
            />
            {fieldError(form, "userId") && (
              <p className="mt-2 text-base text-destructive">{fieldError(form, "userId")}</p>
            )}
          </div>
          <div className="flex gap-2">
            {(["staff", "admin"] as const).map((role) => (
              <button
                key={role}
                type="button"
                aria-pressed={form.values.role === role}
                onClick={() => form.setFieldValue("role", role)}
                className={`h-12 rounded-2xl border-2 px-5 text-lg transition-colors ${
                  form.values.role === role
                    ? "border-secondary bg-secondary text-secondary-foreground"
                    : "border-border bg-surface hover:border-foreground"
                }`}
              >
                {MEMBER_ROLE_LABELS[role]}
              </button>
            ))}
          </div>
          <Button type="submit" variant="outline" disabled={form.isSubmitting}>
            Подключить
          </Button>
          {formError(form) && (
            <p role="status" className="basis-full text-base text-muted-foreground">
              {formError(form)}
            </p>
          )}
        </Form>
      )}
    </Formik>
  );
}
