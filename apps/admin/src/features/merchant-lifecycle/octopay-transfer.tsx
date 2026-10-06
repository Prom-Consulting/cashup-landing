import { ApiError, tariffOf } from "@loal/api";
import { Button, FormStatus, NativeSelect } from "@loal/ui/shadcn";
import { useState } from "react";
import { useMerchants, useTransferOctopay } from "../../entities/merchant/api";

function transferError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "TARGET_ALREADY_LINKED") return "У этого заведения уже свой аккаунт OctōPAY.";
    if (error.code === "ACCOUNT_NOT_FOUND") return "У выбранного заведения нет связи с OctōPAY — переносить нечего.";
    if (error.code === "OCTOPAY_SYNC_PENDING") return "OctōPAY ещё не получил прошлое изменение. Повторите через минуту.";
    if (error.status === 403) return "Переносить аккаунт может только супер-админ.";
  }
  return "Не удалось перенести аккаунт";
}

/**
 * Перенос аккаунта OctōPAY с другого заведения на это — например, вернули старое заведение,
 * а аккаунт был у нового. Заявка «Loal + OctōPAY» этого заведения, ждавшая аккаунта, выполнится.
 */
export function OctopayTransfer({ merchantId }: { merchantId: string }) {
  const merchants = useMerchants(true);
  const transfer = useTransferOctopay(merchantId);
  const [from, setFrom] = useState("");
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  const sources = (merchants.data ?? []).filter((item) => item.id !== merchantId && tariffOf(item.tariff) === "octopay");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <NativeSelect
          aria-label="С какого заведения перенести"
          className="w-auto min-w-[260px]"
          value={from}
          onChange={(event) => (setFrom(event.target.value), setDone(false))}
          placeholder={sources.length ? "С какого заведения" : "Нет заведений с OctōPAY"}
          options={sources.map((item) => ({ value: item.id, label: `${item.name}${item.deletedAt ? " (удалено)" : ""}` }))}
        />
        <Button
          variant="outline"
          disabled={!from || transfer.isPending}
          onClick={async () => {
            setError(undefined);
            try {
              await transfer.mutateAsync(from);
              setDone(true);
            } catch (reason) {
              setError(transferError(reason));
            }
          }}
        >
          {transfer.isPending ? "Переносим…" : "Перенести сюда"}
        </Button>
      </div>
      <FormStatus message={error} />
      <FormStatus tone="success" message={done ? "Аккаунт OctōPAY теперь у этого заведения." : undefined} />
    </div>
  );
}
