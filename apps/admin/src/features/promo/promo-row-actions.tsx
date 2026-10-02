import { Copy01Icon, Delete02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import type { PromoCode } from "@loal/api";
import { Button, ConfirmDialog, Icon, Switch } from "@loal/ui/shadcn";
import { useState } from "react";
import { useDeletePromo, useUpdatePromo } from "../../entities/promo/api";

/** В таблице — только значок (compact), подпись остаётся для скринридера. */
export function CopyCodeButton({ code, compact = false }: { code: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={`Скопировать ${code}`}
      title={compact ? "Скопировать" : undefined}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
    >
      <Icon icon={copied ? Tick02Icon : Copy01Icon} />
      {!compact && (copied ? "Скопирован" : "Скопировать")}
    </Button>
  );
}

/** Выключенный код перестаёт применяться; включить обратно можно в любой момент. */
export function PromoActiveSwitch({ promo }: { promo: PromoCode }) {
  const update = useUpdatePromo();
  return (
    <Switch
      checked={promo.active}
      disabled={update.isPending || Boolean(promo.deletedAt)}
      onCheckedChange={(active) => update.mutate({ id: promo.id, input: { active } })}
      label={promo.active ? "Действует" : "Выключен"}
      description={update.isError ? update.error.message : undefined}
    />
  );
}

export function DeletePromoButton({ promo }: { promo: PromoCode }) {
  const remove = useDeletePromo();
  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="sm" aria-label={`Удалить ${promo.code}`} title="Удалить">
          <Icon icon={Delete02Icon} />
        </Button>
      }
      title={`Удалить ${promo.code}?`}
      description="Код перестанет применяться и пропадёт из списка. Кто его уже применил — останется в истории."
      confirmLabel="Удалить"
      onConfirm={() => remove.mutateAsync(promo.id)}
    />
  );
}
