import { MEMBER_ROLE_LABELS, createBranchInputSchema } from "@loal/api";
import { AddMemberForm, useJustRegistered } from "@loal/app-kit";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, Card, EmptyState, ErrorState, Input, Label, Loading, PageHeader, Toast } from "@loal/ui/shadcn";
import { useQueryClient } from "@tanstack/react-query";
import { Form, Formik } from "formik";
import { merchantKeys, useBranches, useCreateBranch, useMembers } from "../../entities/merchant/api";
import { useCurrentMerchant } from "../../entities/session/model";
import { BranchRow } from "../../features/team/branch-row";
import { MemberRow } from "../../features/team/member-row";

/**
 * Команда: филиалы и люди. Владелец ведёт филиалы и всех людей; администратор филиала видит
 * и добавляет только кассиров своего филиала (сервер отдаёт ему только их).
 */
export function TeamPage() {
  const { merchantId, canManage, isBranchAdmin, branchId } = useCurrentMerchant();
  const branches = useBranches(merchantId ?? "");
  const members = useMembers(merchantId ?? "");
  const createBranch = useCreateBranch(merchantId ?? "");
  const queryClient = useQueryClient();
  const registered = useJustRegistered(
    members.data,
    (member) => member.id,
    (member) => MEMBER_ROLE_LABELS[member.role] ?? "Сотрудник",
  );

  return (
    <section className="flex flex-col gap-6">
      <Toast message={registered.message} onDismiss={registered.dismiss} />
      <PageHeader
        title="Команда"
        description={
          isBranchAdmin
            ? "Кассиры вашего филиала. Добавьте кассира по имени и телефону — он войдёт по коду из WhatsApp."
            : "Филиалы и люди. Человека добавляют по имени и телефону — он войдёт по коду из WhatsApp."
        }
      />

      {canManage && (
      <Card>
        <h2 className="text-xl font-bold">Филиалы</h2>
        {branches.isPending && <Loading rows={2} />}
        {branches.isError && <ErrorState error={branches.error} onRetry={() => branches.refetch()} />}
        <ul className="mt-4 flex flex-col">
          {(branches.data ?? []).map((branch) => (
            <BranchRow key={branch.id} merchantId={merchantId ?? ""} branch={branch} />
          ))}
          {branches.isSuccess && branches.data.length === 0 && (
            <li className="text-base text-muted-foreground">Филиалов пока нет — создайте первый.</li>
          )}
        </ul>

        {(
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
                  <Label htmlFor="branch-name">Новый филиал</Label>
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
      )}

      <Card>
        <h2 className="text-xl font-bold">
          {isBranchAdmin
            ? `Кассиры${branches.data?.find((branch) => branch.id === branchId) ? ` · ${branches.data.find((branch) => branch.id === branchId)!.name}` : ""}`
            : "Сотрудники"}
        </h2>
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
              canRemove={canManage || (isBranchAdmin && member.role === "staff")}
            />
          ))}
        </ul>

        {(canManage || isBranchAdmin) && (
          <AddMemberForm
            merchantId={merchantId ?? ""}
            branches={branches.data ?? []}
            actor={canManage ? "owner" : "branch"}
            onAdded={() => queryClient.invalidateQueries({ queryKey: merchantKeys.members(merchantId ?? "") })}
          />
        )}
      </Card>
    </section>
  );
}
