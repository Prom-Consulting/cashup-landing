import { UserRemove01Icon } from "@hugeicons/core-free-icons";
import { MEMBER_ROLE_LABELS, type Branch, type MerchantMember } from "@loal/api";
import { formatPhone } from "@loal/ui/inputs";
import { Badge, Button, ConfirmDialog, FormStatus, Icon, NativeSelect } from "@loal/ui/shadcn";
import { useAcceptMember, useRemoveMember, useUpdateMember } from "../../entities/merchant/api";
import { formatDate } from "../../shared/lib/format";

/** Цвет кружка с инициалами — по роли, чтобы состав филиала читался с одного взгляда. */
const AVATAR_TONE: Record<string, string> = {
  admin: "bg-graphite text-white",
  branch_admin: "bg-primary text-primary-foreground",
  staff: "bg-amber/30 text-graphite",
};

function initials(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return (parts.slice(0, 2).map((part) => part[0]!.toUpperCase()).join("") || "?").slice(0, 2);
}

/**
 * Человек в команде — одна компактная строка: кто, роль, телефон, статус; справа — филиал и
 * «убрать». Владелец переводит людей между филиалами; администратор филиала может только
 * убрать своего кассира (перевести — 400 на сервере).
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
  const open = branches.filter((item) => !item.archivedAt);
  const name = member.fullName || "Без имени";
  const editable = member.role !== "admin";

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          aria-hidden="true"
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold ${AVATAR_TONE[member.role] ?? "bg-muted"}`}
        >
          {initials(member.fullName)}
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-base font-semibold">{name}</span>
            <Badge tone="quiet">{MEMBER_ROLE_LABELS[member.role] ?? member.role}</Badge>
            {!member.acceptedAt && <Badge tone="warn">ждёт подтверждения</Badge>}
          </p>
          <p className="truncate text-sm text-muted-foreground tabular-nums">
            {member.phone ? formatPhone(member.phone) : "—"}
            {member.registrationStatus === "pending"
              ? " · ещё не входил"
              : member.acceptedAt
                ? ` · с ${formatDate(member.acceptedAt)}`
                : ""}
          </p>
        </div>
      </div>

      {editable && (canManage || canRemove) && (
        <div className="flex min-w-0 items-center gap-2 pl-14 sm:pl-0">
          {canManage && !member.acceptedAt && (
            <Button variant="outline" size="sm" disabled={accept.isPending} onClick={() => accept.mutate(member.id)}>
              Подтвердить
            </Button>
          )}
          {canManage && open.length > 0 && (
            <NativeSelect
              aria-label={`Филиал: ${name}`}
              value={member.branchId ?? ""}
              disabled={update.isPending}
              placeholder={member.role === "branch_admin" ? "Выберите филиал" : "Без филиала"}
              onChange={(event) => update.mutate({ memberId: member.id, branchId: event.target.value || null })}
              options={open.map((item) => ({ value: item.id, label: item.name }))}
              className="h-10 min-w-0 flex-1 text-base sm:w-[200px] sm:flex-none"
            />
          )}
          {canRemove && (
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="icon" aria-label={`Убрать ${name} из команды`} title="Убрать из команды">
                  <Icon icon={UserRemove01Icon} />
                </Button>
              }
              title={`Убрать ${name}?`}
              description="Человек сразу потеряет доступ: открытый кабинет разлогинится. Его аккаунт и прошлые операции останутся."
              confirmLabel="Убрать"
              onConfirm={() => remove.mutateAsync(member.id)}
            />
          )}
        </div>
      )}
      <FormStatus message={[accept, update, remove].find((mutation) => mutation.isError)?.error?.message} />
    </li>
  );
}
