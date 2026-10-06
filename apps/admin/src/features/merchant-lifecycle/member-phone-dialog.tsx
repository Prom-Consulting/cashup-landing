import { MEMBER_ROLE_LABELS, type MerchantMember } from "@loal/api";
import { formatPhone } from "@loal/ui/inputs";
import { Button, Dialog, DialogContent } from "@loal/ui/shadcn";
import { useState } from "react";
import { useMemberPhoneCode, useReplaceMemberPhone } from "../../entities/merchant/api";
import { PhoneCodeForm } from "./phone-code-form";

/**
 * Смена номера сотрудника — только супер-админ. Номер принадлежит человеку, поэтому место в
 * магазине переходит к человеку с новым номером с той же ролью и филиалами; прежний выходит.
 */
export function ChangeMemberPhoneButton({ merchantId, member }: { merchantId: string; member: MerchantMember }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string>();
  const sendCode = useMemberPhoneCode(merchantId);
  const replace = useReplaceMemberPhone(merchantId);

  return (
    <Dialog open={open} onOpenChange={(next) => (setOpen(next), setDone(undefined))}>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Сменить номер
      </Button>
      <DialogContent
        title="Сменить номер"
        description={`${MEMBER_ROLE_LABELS[member.role] ?? "Сотрудник"}${member.fullName ? ` ${member.fullName}` : ""}${
          member.phone ? `, сейчас ${formatPhone(member.phone)}` : ""
        }. Место перейдёт к человеку с новым номером — с той же ролью и филиалами. Прежний номер выйдет из заведения, его аккаунт, карта и Google останутся у него. Сессии обоих завершатся.`}
        className="w-[min(560px,calc(100vw-2rem))]"
      >
        <div className="mt-5">
          {done ? (
            <div className="flex flex-col gap-4">
              <p role="status" className="rounded-2xl bg-muted px-4 py-3 text-base">
                {done}
              </p>
              <Button className="self-end" onClick={() => setOpen(false)}>
                Готово
              </Button>
            </div>
          ) : (
            <PhoneCodeForm
              sendCode={(phone) => sendCode.mutateAsync({ memberId: member.id, phone })}
              submit={async ({ phone, code }) => {
                await replace.mutateAsync({ memberId: member.id, phone, code });
                setDone(`Номер сменён на ${formatPhone(phone)}. Новый номер входит в заведение с той же ролью.`);
              }}
              submitLabel="Сменить номер"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
