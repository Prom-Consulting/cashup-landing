import { UserAdd01Icon } from "@hugeicons/core-free-icons";
import { MEMBER_ROLE_LABELS, createBranchInputSchema, memberBranchIds, type MerchantMember } from "@loal/api";
import { AddMemberForm, useJustRegistered } from "@loal/app-kit";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogTrigger,
  EmptyState,
  ErrorState,
  Icon,
  Input,
  Loading,
  PageHeader,
  Toast,
} from "@loal/ui/shadcn";
import { useQueryClient } from "@tanstack/react-query";
import { Form, Formik } from "formik";
import { useState } from "react";
import { merchantKeys, useBranches, useCreateBranch, useMembers } from "../../entities/merchant/api";
import { useCurrentMerchant } from "../../entities/session/model";
import { BranchRow } from "../../features/team/branch-row";
import { MemberRow } from "../../features/team/member-row";

type Group = { key: string; title: string; members: MerchantMember[] };

/**
 * Сначала владелец, потом каждый открытый филиал со своими людьми, в конце — кто без филиала.
 * Человек в нескольких филиалах стоит в каждом из них: так видно, кто где работает.
 */
function groupMembers(members: MerchantMember[], branches: { id: string; name: string; archivedAt?: string | null }[]): Group[] {
  const owners = members.filter((member) => member.role === "admin");
  const rest = members.filter((member) => member.role !== "admin");
  const open = branches.filter((item) => !item.archivedAt);
  const groups: Group[] = [{ key: "owner", title: "Владелец", members: owners }];
  for (const branch of open) {
    groups.push({
      key: branch.id,
      title: branch.name,
      // Администратор филиала — первым, за ним кассиры.
      members: rest
        .filter((member) => memberBranchIds(member).includes(branch.id))
        .sort((a, b) => Number(b.role === "branch_admin") - Number(a.role === "branch_admin")),
    });
  }
  groups.push({
    key: "none",
    title: "Без филиала",
    members: rest.filter((member) => !memberBranchIds(member).some((id) => open.some((branch) => branch.id === id))),
  });
  return groups.filter((group) => group.members.length > 0);
}

/**
 * Команда: филиалы и люди. Владелец ведёт филиалы и всех людей; администратор филиала видит
 * и добавляет только кассиров своего филиала (сервер отдаёт ему только их).
 */
export function TeamPage() {
  const { merchantId, canManage, isBranchAdmin, branchIds } = useCurrentMerchant();
  const branches = useBranches(merchantId ?? "");
  const members = useMembers(merchantId ?? "");
  const createBranch = useCreateBranch(merchantId ?? "");
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const registered = useJustRegistered(
    members.data,
    (member) => member.id,
    (member) => MEMBER_ROLE_LABELS[member.role] ?? "Сотрудник",
  );
  const canAdd = canManage || isBranchAdmin;
  const branchList = branches.data ?? [];
  const openBranches = branchList.filter((branch) => !branch.archivedAt);
  // Администратор филиалов работает только со своими; владелец — со всеми открытыми
  const myBranches = openBranches.filter((branch) => branchIds.includes(branch.id));
  const editableBranches = canManage ? openBranches : myBranches;
  const groups = canManage
    ? groupMembers(members.data ?? [], branchList)
    : myBranches.length > 1
      ? groupMembers(members.data ?? [], myBranches).filter((group) => group.key !== "owner")
      : [
          {
            key: "mine",
            title: myBranches[0] ? `Кассиры · ${myBranches[0].name}` : "Кассиры",
            members: members.data ?? [],
          },
        ];

  return (
    <section className="flex flex-col gap-6">
      <Toast message={registered.message} onDismiss={registered.dismiss} />
      <PageHeader
        title="Команда"
        description={
          isBranchAdmin
            ? myBranches.length > 1
              ? `Кассиры ваших филиалов: ${myBranches.map((branch) => branch.name).join(", ")}. Кассир входит по номеру телефона и коду из WhatsApp.`
              : "Кассиры вашего филиала. Кассир входит по номеру телефона и коду из WhatsApp."
            : "Филиалы и люди. Сотрудник входит по номеру телефона и коду из WhatsApp."
        }
        action={
          canAdd && (
            <Dialog open={adding} onOpenChange={setAdding}>
              <DialogTrigger asChild>
                <Button>
                  <Icon icon={UserAdd01Icon} />
                  {isBranchAdmin ? "Добавить кассира" : "Добавить сотрудника"}
                </Button>
              </DialogTrigger>
              <DialogContent
                title={isBranchAdmin ? "Новый кассир" : "Новый сотрудник"}
                description="Имя и телефон. Человек получит доступ, когда впервые войдёт по коду из WhatsApp."
              >
                <AddMemberForm
                  bare
                  merchantId={merchantId ?? ""}
                  branches={canManage ? branchList : myBranches}
                  actor={canManage ? "owner" : "branch"}
                  onAdded={() => {
                    setAdding(false);
                    void queryClient.invalidateQueries({ queryKey: merchantKeys.members(merchantId ?? "") });
                  }}
                />
              </DialogContent>
            </Dialog>
          )
        }
      />

      {canManage && (
        <Card>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-bold">Филиалы</h2>
            {branches.isSuccess && openBranches.length > 0 && (
              <span className="text-sm text-muted-foreground">{openBranches.length} открыто</span>
            )}
          </div>
          {branches.isPending && <Loading rows={2} />}
          {branches.isError && <ErrorState error={branches.error} onRetry={() => branches.refetch()} />}
          {branches.isSuccess && openBranches.length === 0 && (
            <p className="mt-2 text-base text-muted-foreground">
              Филиалов пока нет. Создайте первый — и сможете назначить в него администратора и кассиров.
            </p>
          )}
          {openBranches.length > 0 && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {openBranches.map((branch) => (
                <BranchRow
                  key={branch.id}
                  merchantId={merchantId ?? ""}
                  branch={branch}
                  people={(members.data ?? []).filter((member) => memberBranchIds(member).includes(branch.id)).length}
                />
              ))}
            </ul>
          )}

          <Formik
            initialValues={{ name: "" }}
            validate={zodValidate(createBranchInputSchema)}
            onSubmit={async (values, helpers) => {
              helpers.setStatus(undefined);
              try {
                await createBranch.mutateAsync(values);
                helpers.resetForm();
              } catch (error) {
                applyServerIssues(error, helpers, "Не удалось создать филиал");
              } finally {
                helpers.setSubmitting(false);
              }
            }}
          >
            {(form) => (
              <Form className="mt-4 flex flex-col gap-2" noValidate>
                <FocusFirstError form={form} />
                <div className="flex gap-2">
                  <Input
                    id="branch-name"
                    name="name"
                    aria-label="Название нового филиала"
                    placeholder="Новый филиал, например «На Чуй»"
                    className="min-w-0 flex-1"
                    value={form.values.name}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    invalid={Boolean(fieldError(form, "name"))}
                  />
                  <Button type="submit" variant="outline" disabled={form.isSubmitting}>
                    Создать
                  </Button>
                </div>
                {fieldError(form, "name") && <p className="text-base text-destructive">{fieldError(form, "name")}</p>}
                {formError(form) && <p className="text-base text-destructive">{formError(form)}</p>}
              </Form>
            )}
          </Formik>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold">{isBranchAdmin ? "Кассиры" : "Люди"}</h2>
          {members.isSuccess && members.data.length > 0 && (
            <span className="text-sm text-muted-foreground">всего {members.data.length}</span>
          )}
        </div>
        {members.isPending && <Loading rows={3} />}
        {members.isError && <ErrorState error={members.error} onRetry={() => members.refetch()} />}
        {members.isSuccess && members.data.length === 0 && (
          <EmptyState
            title={isBranchAdmin ? "Кассиров пока нет" : "Сотрудников пока нет"}
            description="Добавьте человека кнопкой вверху — он войдёт по коду из WhatsApp."
          />
        )}

        <div className="mt-2 flex flex-col gap-5">
          {groups
            .filter((group) => group.members.length > 0)
            .map((group) => (
              <div key={group.key}>
                {(canManage || groups.length > 1) && (
                  <h3 className="flex items-center gap-2 border-b border-border pb-2 text-sm font-semibold text-muted-foreground">
                    {group.title}
                    <span className="rounded-full bg-muted px-2 text-xs tabular-nums">{group.members.length}</span>
                  </h3>
                )}
                <ul className="flex flex-col divide-y divide-border">
                  {group.members.map((member) => (
                    <MemberRow
                      key={member.id}
                      merchantId={merchantId ?? ""}
                      member={member}
                      branches={branchList}
                      editableBranches={editableBranches}
                      canManage={canManage}
                      canRemove={canManage || (isBranchAdmin && member.role === "staff")}
                    />
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </Card>
    </section>
  );
}
