import { Store01Icon, UserRemove01Icon } from "@hugeicons/core-free-icons";
import { MEMBER_ROLE_LABELS, memberBranchIds, type Branch, type MerchantMember } from "@loal/api";
import { formatPhone } from "@loal/ui/inputs";
import {
  Badge,
  Button,
  ChipSelect,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogTrigger,
  FormStatus,
  Icon,
} from "@loal/ui/shadcn";
import { useState } from "react";
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
 * Филиалы человека — окном с чипами: один человек может работать в нескольких филиалах.
 * Владелец выбирает из всех открытых, администратор филиалов — только из своих (остальные
 * назначения сервер сохранит сам). Администратору филиалов нужен хотя бы один.
 */
function BranchesDialog({
  merchantId,
  member,
  options,
  name,
}: {
  merchantId: string;
  member: MerchantMember;
  options: Branch[];
  name: string;
}) {
  const update = useUpdateMember(merchantId);
  const current = memberBranchIds(member);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>(current);
  const needsOne = member.role === "branch_admin" && picked.length === 0;
  const label = current.length === 0 ? "Без филиала" : current.length === 1 ? "1 филиал" : `${current.length} филиала`;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) {
          setPicked(current);
          update.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Филиалы: ${name}`}>
          <Icon icon={Store01Icon} />
          {current.length > 4 ? `${current.length} филиалов` : label}
        </Button>
      </DialogTrigger>
      <DialogContent
        title={`Филиалы — ${name}`}
        description="Где человек работает. На кассе он выберет, на какой филиал записать операцию. Новые права — со следующего входа."
      >
        <div className="flex flex-col gap-4">
          <ChipSelect
            label={`Филиалы: ${name}`}
            options={options.map((branch) => ({ value: branch.id, label: branch.name }))}
            value={picked.filter((id) => options.some((branch) => branch.id === id))}
            onChange={setPicked}
            invalid={needsOne}
          />
          {needsOne && (
            <p className="text-sm font-medium text-destructive">
              Администратору нужен хотя бы один филиал. Чтобы убрать его совсем — «Убрать из команды».
            </p>
          )}
          {!needsOne && picked.length === 0 && (
            <p className="text-sm text-muted-foreground">Без филиала человек остаётся в команде, но списывать бонусы не сможет.</p>
          )}
          <FormStatus message={update.isError ? update.error.message : undefined} />
          <Button
            disabled={needsOne || update.isPending}
            onClick={() =>
              update.mutate(
                { memberId: member.id, branchIds: picked.filter((id) => options.some((branch) => branch.id === id)) },
                { onSuccess: () => setOpen(false) },
              )
            }
          >
            {update.isPending ? "Сохраняем…" : "Сохранить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Человек в команде — одна компактная строка: кто, роль, филиалы, телефон, статус; справа —
 * филиалы и «убрать». Владелец назначает людей в любые филиалы; администратор филиалов —
 * своих кассиров и только в свои филиалы.
 */
export function MemberRow({
  merchantId,
  member,
  branches,
  editableBranches,
  canManage,
  canRemove,
}: {
  merchantId: string;
  member: MerchantMember;
  branches: Branch[];
  /** Из каких филиалов можно выбирать: владельцу — все открытые, администратору — свои. */
  editableBranches: Branch[];
  /** Владелец: подтвердить приглашённого. */
  canManage: boolean;
  /** Убрать: владелец — любого, кроме владельца; администратор филиалов — своих кассиров. */
  canRemove: boolean;
}) {
  const accept = useAcceptMember(merchantId);
  const remove = useRemoveMember(merchantId);
  const name = member.fullName || "Без имени";
  const editable = member.role !== "admin";
  const names = memberBranchIds(member)
    .map((id) => branches.find((branch) => branch.id === id)?.name)
    .filter(Boolean);

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
          {editable && names.length > 1 && (
            <p className="truncate text-sm text-muted-foreground">Филиалы: {names.join(", ")}</p>
          )}
        </div>
      </div>

      {editable && (canManage || canRemove) && (
        <div className="flex min-w-0 items-center gap-2 pl-14 sm:pl-0">
          {canManage && !member.acceptedAt && (
            <Button variant="outline" size="sm" disabled={accept.isPending} onClick={() => accept.mutate(member.id)}>
              Подтвердить
            </Button>
          )}
          {editableBranches.length > 0 && (canManage || canRemove) && (
            <BranchesDialog merchantId={merchantId} member={member} options={editableBranches} name={name} />
          )}
          {canRemove && (
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="icon" aria-label={`Убрать ${name} из команды`} title="Убрать из команды">
                  <Icon icon={UserRemove01Icon} />
                </Button>
              }
              title={`Убрать ${name}?`}
              description={
                canManage
                  ? "Человек сразу потеряет доступ: открытый кабинет разлогинится. Его аккаунт, карта и прошлые операции останутся, и он сможет работать в другом магазине."
                  : "Человек уйдёт из ваших филиалов: доступ к ним пропадёт сразу. Его аккаунт и прошлые операции останутся."
              }
              confirmLabel="Убрать"
              onConfirm={() => remove.mutateAsync(member.id)}
            />
          )}
        </div>
      )}
      <FormStatus message={[accept, remove].find((mutation) => mutation.isError)?.error?.message} />
    </li>
  );
}
