import {
  MEMBER_ROLE_LABELS,
  SCAN_OPERATION_LABELS,
  partnerBonusInputSchema,
  partnerOperation,
  type Branch,
  type MerchantMember,
  type PartnerBonusInput,
} from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogTrigger,
  FormField,
  FormStatus,
  Input,
  NativeSelect,
} from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useAcceptMember, useRemoveMember, useUpdateMember, useUpdatePartnerBonus } from "../../entities/merchant/api";
import { formatDateTime } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");

function PartnerBonusDialog({ merchantId, member }: { merchantId: string; member: MerchantMember }) {
  const [open, setOpen] = useState(false);
  const update = useUpdatePartnerBonus(merchantId);
  const initialValues: PartnerBonusInput = {
    amount: member.partnerBonusAmount ?? "",
    maxPerCustomer: member.partnerBonusMaxPerCustomer ?? "",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Бонус
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Приветственный бонус"
        description="Сколько баллов партнёр дарит клиенту и сколько раз одному человеку. Сотрудники партнёра дарят из того же лимита."
      >
        <Formik
          initialValues={initialValues}
          validate={zodValidate(partnerBonusInputSchema)}
          onSubmit={async (values, helpers) => {
            helpers.setStatus(undefined);
            try {
              await update.mutateAsync({
                memberId: member.id,
                amount: values.amount === "" ? null : Number(values.amount),
                maxPerCustomer: values.maxPerCustomer === "" ? null : Number(values.maxPerCustomer),
              });
              setOpen(false);
            } catch (error) {
              applyServerIssues(error, helpers, "Не удалось сохранить бонус");
            } finally {
              helpers.setSubmitting(false);
            }
          }}
        >
          {(form) => (
            <Form noValidate className="flex flex-col gap-4">
              <FocusFirstError form={form} />
              <FormField label="Баллов" hint="Пусто — бонуса нет." error={fieldError(form, "amount")}>
                {(parts) => (
                  <Input
                    {...parts}
                    name="amount"
                    inputMode="numeric"
                    value={String(form.values.amount)}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </FormField>
              <FormField
                label="Сколько раз одному клиенту"
                hint="Пусто — без ограничения."
                error={fieldError(form, "maxPerCustomer")}
              >
                {(parts) => (
                  <Input
                    {...parts}
                    name="maxPerCustomer"
                    inputMode="numeric"
                    value={String(form.values.maxPerCustomer)}
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
  );
}

/** Строка команды: кто, на какой точке, что может, и действия владельца. */
export function MemberRow({
  merchantId,
  member,
  branches,
  canManage,
}: {
  merchantId: string;
  member: MerchantMember;
  branches: Branch[];
  canManage: boolean;
}) {
  const accept = useAcceptMember(merchantId);
  const update = useUpdateMember(merchantId);
  const remove = useRemoveMember(merchantId);
  const operation =
    member.role === "partner" || member.role === "partner_employee" ? partnerOperation(member.permissions) : null;

  return (
    <li className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-lg">
            {MEMBER_ROLE_LABELS[member.role] ?? member.role}
            {operation && <Badge tone="quiet">{SCAN_OPERATION_LABELS[operation]}</Badge>}
            {!member.acceptedAt && <Badge tone="warn">ждёт подтверждения</Badge>}
          </p>
          <p className="mt-1 truncate text-sm text-muted-foreground tabular-nums">{member.userId}</p>
          <p className="text-sm text-muted-foreground">
            {member.acceptedAt ? `в команде с ${formatDateTime(member.acceptedAt)}` : "приглашён, доступа пока нет"}
            {member.role === "partner" && member.partnerBonusAmount
              ? ` · дарит ${money.format(member.partnerBonusAmount)} баллов${member.partnerBonusMaxPerCustomer ? `, до ${member.partnerBonusMaxPerCustomer} раз клиенту` : ""}`
              : ""}
          </p>
        </div>
        {canManage && member.role !== "admin" && (
          <div className="flex flex-wrap items-center gap-1">
            {!member.acceptedAt && (
              <Button variant="outline" size="sm" disabled={accept.isPending} onClick={() => accept.mutate(member.id)}>
                Подтвердить
              </Button>
            )}
            {member.role === "partner" && <PartnerBonusDialog merchantId={merchantId} member={member} />}
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm">
                  Убрать
                </Button>
              }
              title="Убрать из команды?"
              description={
                member.role === "partner"
                  ? "Партнёр и заведённые им сотрудники потеряют доступ. Их аккаунты останутся."
                  : "Человек потеряет доступ к кабинету заведения. Его аккаунт останется."
              }
              confirmLabel="Убрать"
              onConfirm={() => remove.mutateAsync(member.id)}
            />
          </div>
        )}
      </div>
      {canManage && branches.length > 0 && member.role !== "partner_employee" && (
        <div className="max-w-[320px]">
          <NativeSelect
            aria-label="Точка"
            value={member.branchId ?? ""}
            disabled={update.isPending}
            placeholder="Без точки"
            onChange={(event) => update.mutate({ memberId: member.id, branchId: event.target.value || null })}
            options={branches.map((branch) => ({ value: branch.id, label: branch.name }))}
          />
        </div>
      )}
      <FormStatus message={[accept, update, remove].find((mutation) => mutation.isError)?.error?.message} />
    </li>
  );
}
