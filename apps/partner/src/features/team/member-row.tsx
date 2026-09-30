import { MEMBER_ROLE_LABELS, type Branch, type MerchantMember } from "@loal/api";
import { formatPhone } from "@loal/ui/inputs";
import { Badge, Button, ConfirmDialog, FormStatus, NativeSelect } from "@loal/ui/shadcn";
import { useAcceptMember, useRemoveMember, useUpdateMember } from "../../entities/merchant/api";
import { formatDateTime } from "../../shared/lib/format";

/**
 * Строка команды: кто, в каком филиале, и действия. Владелец переводит людей между филиалами;
 * администратор филиала может только убрать своего кассира (перевести — 400 на сервере).
 */
export function MemberRow({
  merchantId,
  member,
  branches,
  canManage,
  canRemove,
}: {
  merchantId: string;
  member: MerchantMember;
  branches: Branch[];
  /** Владелец: подтвердить, перевести в другой филиал. */
  canManage: boolean;
  /** Убрать из команды: владелец — любого, кроме владельца; администратор филиала — своих кассиров. */
  canRemove: boolean;
}) {
  const accept = useAcceptMember(merchantId);
  const update = useUpdateMember(merchantId);
  const remove = useRemoveMember(merchantId);
  const branch = branches.find((item) => item.id === member.branchId);
  const open = branches.filter((item) => !item.archivedAt);

  return (
    <li className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-lg">
            {MEMBER_ROLE_LABELS[member.role] ?? member.role}
            {!member.acceptedAt && <Badge tone="warn">ждёт подтверждения</Badge>}
            {member.registrationStatus === "pending" && <Badge tone="quiet">ждёт первого входа</Badge>}
          </p>
          <p className="mt-1 truncate text-sm text-muted-foreground tabular-nums">
            {[member.fullName, member.phone ? formatPhone(member.phone) : null].filter(Boolean).join(" · ") || "—"}
          </p>
          <p className="text-sm text-muted-foreground">
            {branch ? `${branch.name} · ` : ""}
            {member.acceptedAt ? `в команде с ${formatDateTime(member.acceptedAt)}` : "приглашён, доступа пока нет"}
          </p>
        </div>
        {member.role !== "admin" && (canManage || canRemove) && (
          <div className="flex flex-wrap items-center gap-1">
            {canManage && !member.acceptedAt && (
              <Button variant="outline" size="sm" disabled={accept.isPending} onClick={() => accept.mutate(member.id)}>
                Подтвердить
              </Button>
            )}
            {canRemove && (
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="sm">
                    Убрать
                  </Button>
                }
                title="Убрать из команды?"
                description="Человек сразу потеряет доступ: открытый кабинет разлогинится. Его аккаунт и прошлые операции останутся."
                confirmLabel="Убрать"
                onConfirm={() => remove.mutateAsync(member.id)}
              />
            )}
          </div>
        )}
      </div>
      {canManage && member.role !== "admin" && open.length > 0 && (
        <div className="max-w-[320px]">
          <NativeSelect
            aria-label="Филиал"
            value={member.branchId ?? ""}
            disabled={update.isPending}
            placeholder={member.role === "branch_admin" ? "Выберите филиал" : "Без филиала"}
            onChange={(event) => update.mutate({ memberId: member.id, branchId: event.target.value || null })}
            options={open.map((item) => ({ value: item.id, label: item.name }))}
          />
        </div>
      )}
      <FormStatus message={[accept, update, remove].find((mutation) => mutation.isError)?.error?.message} />
    </li>
  );
}
