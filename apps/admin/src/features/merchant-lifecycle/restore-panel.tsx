import {
  ApiError,
  MEMBER_ROLE_LABELS,
  RESTORE_BLOCKER_LABELS,
  RESTORE_OCTOPAY_LABELS,
  type RestoreResult,
} from "@loal/api";
import { formatPhone } from "@loal/ui/inputs";
import { Badge, Button, ErrorState, FormStatus, Loading } from "@loal/ui/shadcn";
import { useState } from "react";
import { useRestoreMerchant, useRestorePhoneCode, useRestorePreview } from "../../entities/merchant/api";
import { formatDateTime } from "../../shared/lib/format";
import { PhoneCodeForm, phoneCodeError } from "./phone-code-form";

type Replacement = { memberId?: string; phone: string; code: string };

function restoreError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "MEMBER_PHONE_TAKEN") return "Номер владельца занят — укажите новый номер и код.";
    if (error.code === "OWNER_REQUIRED") return "Прежнего владельца нет — укажите нового (номер и код).";
    if (error.code === "MERCHANT_NOT_DELETED") return "Заведение не в архиве.";
    if (error.code === "MERCHANT_NOT_RESTORABLE" || error.status === 410) return "Прошло 30 дней — вернуть нельзя.";
    if (error.status === 502) return "OctōPAY недоступен — заведение осталось в архиве, повторите позже.";
    if (error.status === 403) return "Возвращать может только супер-админ.";
  }
  return phoneCodeError(error, "Не удалось вернуть заведение");
}

/**
 * Возврат архивного заведения в течение 30 дней (docs/API.md, «Удаление магазина»). Сначала
 * предпросмотр: кто вернётся, кто занят, что будет с OctōPAY. Владельцу с занятым номером или
 * без аккаунта нужен новый номер — его подтверждают кодом из WhatsApp.
 */
export function RestorePanel({ merchantId }: { merchantId: string }) {
  const [open, setOpen] = useState(false);
  const preview = useRestorePreview(merchantId, open);
  const sendCode = useRestorePhoneCode(merchantId);
  const restore = useRestoreMerchant(merchantId);
  const [replacements, setReplacements] = useState<Replacement[]>([]);
  const [error, setError] = useState<string>();

  if (!open)
    return (
      <Button className="self-start" onClick={() => setOpen(true)}>
        Вернуть заведение…
      </Button>
    );
  if (preview.isPending) return <Loading rows={3} />;
  if (preview.isError) return <ErrorState error={preview.error} onRetry={() => preview.refetch()} />;

  const data = preview.data;
  const owners = data.members.filter((member) => member.role === "admin");
  // Владельцу с занятым номером нужен новый номер; кассиры и админы филиалов просто не вернутся
  const ownerBlocked = owners.filter((member) => member.blocker);
  const needsNewOwner = data.ownerMissing;
  const replaced = (memberId?: string) => replacements.find((item) => item.memberId === memberId);
  const missing = [
    ...ownerBlocked.filter((member) => !replaced(member.memberId)),
    ...(needsNewOwner && !replaced(undefined) ? [null] : []),
  ];

  return (
    <div className="flex flex-col gap-5">
      {data.restorableUntil && (
        <p className="text-base">
          Можно вернуть до <b>{formatDateTime(data.restorableUntil)}</b>.
        </p>
      )}

      <div>
        <h3 className="text-base font-bold">Люди</h3>
        {data.members.length === 0 && <p className="mt-2 text-base text-muted-foreground">Сотрудников не было.</p>}
        <ul className="mt-2 flex flex-col gap-2">
          {data.members.map((member) => {
            const replacement = replaced(member.memberId);
            return (
              <li key={member.memberId} className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                <span className="text-base">
                  {MEMBER_ROLE_LABELS[member.role] ?? member.role}
                  {member.fullName ? ` · ${member.fullName}` : ""}
                  {member.phone ? ` · ${formatPhone(member.phone)}` : ""}
                </span>
                {replacement ? (
                  <Badge tone="good">вернётся с номером {formatPhone(replacement.phone)}</Badge>
                ) : member.blocker ? (
                  <Badge tone="warn">
                    {RESTORE_BLOCKER_LABELS[member.blocker] ?? member.blocker}
                    {member.role === "admin" ? " — нужен новый номер" : " — не вернётся"}
                  </Badge>
                ) : (
                  <Badge tone="quiet">вернётся</Badge>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {data.octopay && (
        <p className="rounded-2xl bg-muted px-4 py-3 text-base">{RESTORE_OCTOPAY_LABELS[data.octopay] ?? `OctōPAY: ${data.octopay}`}</p>
      )}

      {missing.map((member) => (
        <div key={member?.memberId ?? "new-owner"} className="rounded-[20px] border-2 border-border p-4">
          <h3 className="mb-3 text-base font-bold">
            {member
              ? `Новый номер владельца вместо ${member.phone ? formatPhone(member.phone) : "прежнего"}`
              : "Новый владелец: прежнего аккаунта больше нет"}
          </h3>
          <PhoneCodeForm
            phoneLabel="Номер владельца"
            sendCode={(phone) => sendCode.mutateAsync({ phone, memberId: member?.memberId })}
            // Код проверит сам возврат: здесь только запоминаем номер и код
            submit={async ({ phone, code }) =>
              setReplacements((list) => [...list.filter((item) => item.memberId !== member?.memberId), { memberId: member?.memberId, phone, code }])
            }
            submitLabel="Подтвердить номер"
          />
        </div>
      ))}

      <FormStatus message={error} />
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={restore.isPending || missing.length > 0}
          onClick={async () => {
            setError(undefined);
            try {
              await restore.mutateAsync(replacements);
            } catch (reason) {
              setError(restoreError(reason));
              // Код мог не подойти — номера подтверждают заново
              if (reason instanceof ApiError && (reason.code ?? "").startsWith("OTP_")) setReplacements([]);
            }
          }}
        >
          {restore.isPending ? "Возвращаем…" : "Вернуть заведение"}
        </Button>
        <Button variant="ghost" onClick={() => (setOpen(false), setReplacements([]))} disabled={restore.isPending}>
          Отмена
        </Button>
      </div>
      {missing.length > 0 && (
        <p className="text-sm text-muted-foreground">Сначала подтвердите номер владельца — без него заведение не вернуть.</p>
      )}
    </div>
  );
}

/** Итог возврата — плашкой над рабочей карточкой: кто вернулся, кто нет, что с OctōPAY. */
export function RestoreResultNotice({ result, onDismiss }: { result: RestoreResult; onDismiss: () => void }) {
  return (
    <div role="status" className="flex flex-col gap-2 rounded-[24px] border-2 border-secondary bg-surface px-5 py-4 text-base">
      <div className="flex items-start justify-between gap-3">
        <p className="font-bold">Заведение возвращено из архива</p>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Скрыть
        </Button>
      </div>
      <p>
        Вернулись: {result.restoredMembers?.length ?? 0}
        {result.replacedMembers?.length ? ` · с новым номером: ${result.replacedMembers.length}` : ""}
        {result.skippedMembers?.length ? ` · не вернулись (номер занят в другом заведении): ${result.skippedMembers.length}` : ""}
      </p>
      {result.octopay && <p>{RESTORE_OCTOPAY_LABELS[result.octopay] ?? `OctōPAY: ${result.octopay}`}</p>}
    </div>
  );
}
