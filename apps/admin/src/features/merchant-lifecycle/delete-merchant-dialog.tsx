import type { OctopayFate } from "@loal/api";
import { Button, Dialog, DialogContent, FormStatus } from "@loal/ui/shadcn";
import { useState } from "react";
import { useDeleteMerchant } from "../../entities/merchant/api";

const CHOICES: { value: OctopayFate; title: string; text: string }[] = [
  {
    value: "keep",
    title: "Только из Loal",
    text: "Связь с OctōPAY разорвётся, но аккаунт OctōPAY продолжит работать — его можно будет привязать к новому заведению того же номера.",
  },
  {
    value: "delete",
    title: "Из Loal и из OctōPAY",
    text: "Аккаунт OctōPAY тоже закроется: вход и приём платежей остановятся, история сохранится. Его можно вернуть вместе с заведением в течение 30 дней.",
  },
];

/**
 * Удаление заведения суперадмином: архив, номера людей сразу свободны, вернуть можно 30 дней.
 * Если есть связь с OctōPAY — выбор, закрывать ли и аккаунт OctōPAY (по умолчанию нет).
 */
export function DeleteMerchantButton({
  merchantId,
  name,
  hasOctopay,
  onDeleted,
}: {
  merchantId: string;
  name: string;
  hasOctopay: boolean;
  onDeleted: () => void;
}) {
  const remove = useDeleteMerchant();
  const [open, setOpen] = useState(false);
  const [fate, setFate] = useState<OctopayFate>("keep");
  const [error, setError] = useState<string>();

  return (
    <Dialog open={open} onOpenChange={(next) => (setOpen(next), setError(undefined))}>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Удалить заведение
      </Button>
      <DialogContent
        title={`Удалить «${name}»?`}
        description="Заведение уйдёт в архив: сотрудники сразу потеряют доступ, их номера освободятся, из каталога оно пропадёт, 1С отключится. Держатели карт ничего не потеряют. Вернуть можно в течение 30 дней."
        className="w-[min(600px,calc(100vw-2rem))]"
      >
        {hasOctopay && (
          <fieldset className="mt-5 flex flex-col gap-3">
            <legend className="mb-2 text-base font-bold">Что сделать с аккаунтом OctōPAY</legend>
            {CHOICES.map((choice) => (
              <label
                key={choice.value}
                className={`flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition-colors ${
                  fate === choice.value ? "border-foreground bg-muted" : "border-border hover:border-foreground/40"
                }`}
              >
                <input
                  type="radio"
                  name="octopay"
                  value={choice.value}
                  checked={fate === choice.value}
                  onChange={() => setFate(choice.value)}
                  className="mt-1 h-5 w-5 accent-[var(--primary)]"
                />
                <span>
                  <span className="block text-base font-bold">{choice.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{choice.text}</span>
                </span>
              </label>
            ))}
          </fieldset>
        )}
        <FormStatus message={error} />
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={remove.isPending}>
            Отмена
          </Button>
          <Button
            variant="danger"
            disabled={remove.isPending}
            onClick={async () => {
              setError(undefined);
              try {
                await remove.mutateAsync({ merchantId, octopay: hasOctopay ? fate : "keep" });
                setOpen(false);
                onDeleted();
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : "Не удалось удалить");
              }
            }}
          >
            {remove.isPending ? "Удаляем…" : hasOctopay && fate === "delete" ? "Удалить с OctōPAY" : "Удалить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
