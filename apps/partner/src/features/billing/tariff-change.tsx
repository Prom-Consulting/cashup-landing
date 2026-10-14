import { ApiError, LOAL_TARIFFS, LOAL_TARIFF_LABELS, tariffForfeitSchema, type LoalTariff } from "@loal/api";
import { Button, Dialog, DialogContent, DialogTrigger, FormStatus, cn } from "@loal/ui/shadcn";
import { useState } from "react";
import { useChangeTariff } from "../../entities/merchant/api";
import { formatDate } from "../../shared/lib/format";

const PRESETS = [1, 3, 6, 12];
const monthsWord = (n: number) => (n === 1 ? "месяц" : n < 5 ? "месяца" : "месяцев");
const daysWord = (n: number) => {
  const tens = n % 100;
  const ones = n % 10;
  if (tens >= 11 && tens <= 14) return "дней";
  return ones === 1 ? "день" : ones >= 2 && ones <= 4 ? "дня" : "дней";
};

type Forfeit = { currentTariff: string | null; expiresAt: string | null; daysLeft: number | null };

/**
 * Смена тарифа владельцем — только оплатой нового. Пока счёт не оплачен, работает старый тариф;
 * оплата включает новый сразу и считает срок заново, оплаченный остаток старого сгорает — тогда
 * сервер просит подтверждение (409 TARIFF_CHANGE_FORFEITS), и мы показываем, что именно сгорит.
 */
export function TariffChange({ merchantId, current }: { merchantId: string; current: LoalTariff | null }) {
  const change = useChangeTariff(merchantId);
  const [open, setOpen] = useState(false);
  const [tariff, setTariff] = useState<LoalTariff | null>(null);
  const [months, setMonths] = useState(1);
  const [forfeit, setForfeit] = useState<Forfeit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ paymentUrl?: string | null; amount?: number | null; switched?: boolean } | null>(null);

  const reset = () => {
    setTariff(null);
    setMonths(1);
    setForfeit(null);
    setError(null);
    setDone(null);
  };

  const submit = async (confirmForfeit = false) => {
    if (!tariff) return setError("Выберите тариф");
    setError(null);
    try {
      const result = await change.mutateAsync({ tariff, months, ...(confirmForfeit ? { confirmForfeit: true } : {}) });
      if ("paymentUrl" in result) setDone({ paymentUrl: result.paymentUrl as string | null, amount: result.amount as number | null });
      else setDone({ switched: true });
      setForfeit(null);
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "TARIFF_CHANGE_FORFEITS") {
        const info = tariffForfeitSchema.safeParse(cause.payload);
        return setForfeit({
          currentTariff: info.success ? (info.data.currentTariff ?? null) : null,
          expiresAt: info.success ? (info.data.expiresAt ?? null) : null,
          daysLeft: info.success ? (info.data.daysLeft ?? null) : null,
        });
      }
      if (cause instanceof ApiError && cause.code === "TARIFF_UNCHANGED")
        return setError("Это ваш текущий тариф — продление оформляется в разделе «Оплата».");
      setError(cause instanceof ApiError ? cause.message : "Не удалось оформить смену тарифа. Попробуйте ещё раз.");
    }
  };

  const forfeitName =
    forfeit?.currentTariff && forfeit.currentTariff in LOAL_TARIFF_LABELS
      ? LOAL_TARIFF_LABELS[forfeit.currentTariff as LoalTariff].title
      : "текущий тариф";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Сменить тариф</Button>
      </DialogTrigger>
      <DialogContent
        title="Сменить тариф"
        description="Новый тариф начнёт работать сразу после оплаты. До неё заведение работает на прежнем."
      >
        {done ? (
          <div className="mt-4 flex flex-col gap-4">
            {done.switched ? (
              <p role="status" className="text-lg">
                Готово: тариф бесплатный, он уже включён.
              </p>
            ) : (
              <>
                <p role="status" className="text-lg">
                  Счёт выставлен{done.amount ? ` — ${new Intl.NumberFormat("ru-RU").format(done.amount)} сом` : ""}. Тариф
                  сменится сразу после оплаты.
                </p>
                {done.paymentUrl && (
                  <Button asChild size="lg">
                    <a href={done.paymentUrl} target="_blank" rel="noreferrer">
                      Оплатить
                    </a>
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-5">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-base font-bold">Тариф</legend>
              {LOAL_TARIFFS.map((code) => (
                <label
                  key={code}
                  className={cn(
                    "flex cursor-pointer flex-col rounded-2xl border-2 px-4 py-3 transition-colors",
                    tariff === code ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30",
                    code === current && "cursor-not-allowed opacity-50",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="tariff"
                      value={code}
                      disabled={code === current}
                      checked={tariff === code}
                      onChange={() => {
                        setTariff(code);
                        setForfeit(null);
                        setError(null);
                      }}
                      className="accent-[var(--primary)]"
                    />
                    <span className="text-lg font-bold">{LOAL_TARIFF_LABELS[code].title}</span>
                    {code === current && <span className="text-sm text-muted-foreground">сейчас</span>}
                  </span>
                  <span className="mt-1 pl-7 text-base text-muted-foreground">{LOAL_TARIFF_LABELS[code].about}</span>
                </label>
              ))}
            </fieldset>

            <div>
              <p className="mb-2 text-base font-bold">Сколько оплатить</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMonths(value)}
                    className={cn(
                      "rounded-full px-4 py-2 text-base font-semibold transition-colors",
                      months === value ? "bg-graphite text-white" : "bg-muted hover:bg-muted/70",
                    )}
                  >
                    {value} {monthsWord(value)}
                  </button>
                ))}
              </div>
            </div>

            {forfeit && (
              <div role="alert" className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-4">
                <p className="text-base font-bold">Оплаченный остаток сгорит</p>
                <p className="mt-1 text-base">
                  У вас оплачен тариф «{forfeitName}»
                  {forfeit.expiresAt ? ` до ${formatDate(forfeit.expiresAt)}` : ""}
                  {forfeit.daysLeft ? ` — осталось ${forfeit.daysLeft} ${daysWord(forfeit.daysLeft)}` : ""}. После оплаты нового
                  тарифа эти дни сгорят без возврата.
                </p>
                <Button className="mt-3" variant="danger" disabled={change.isPending} onClick={() => void submit(true)}>
                  {change.isPending ? "Оформляем…" : "Понимаю, сменить тариф"}
                </Button>
              </div>
            )}

            <FormStatus message={error ?? undefined} />
            {!forfeit && (
              <Button size="lg" disabled={change.isPending || !tariff} onClick={() => void submit()}>
                {change.isPending ? "Оформляем…" : "Выставить счёт"}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
