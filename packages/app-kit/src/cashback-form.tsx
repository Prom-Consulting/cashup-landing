import { Cancel01Icon, CheckmarkCircle02Icon, QrCode01Icon } from "@hugeicons/core-free-icons";
import { ApiError, cashbackApi, tillCashbackInputSchema, type TillCashbackForm, type TillCashbackResult } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, FormStatus, Icon, Input } from "@loal/ui/shadcn";
import { useMutation } from "@tanstack/react-query";
import { Form, Formik } from "formik";
import { useId, useRef, useState } from "react";
import { QrScanButton } from "./qr-scanner";
import { useApi } from "./session";
import { WorkBranchPicker, useWorkBranch, type WorkBranch } from "./work-branch";

const money = new Intl.NumberFormat("ru-RU");

/** Отказы — человеческим языком: при любом из них ничего не начислено. */
function cashbackErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "BRANCH_REQUIRED") return "Выберите филиал, где вы сейчас работаете. Ничего не начислено.";
    if (error.code === "CARD_NOT_FOUND" || error.status === 404) return "Карты с таким номером нет. Ничего не начислено.";
    if (error.code === "CARD_FROZEN")
      return "Карта клиента заморожена: подписка закончилась. Пусть продлит её в кабинете Loal. Ничего не начислено.";
    if (error.code === "TARIFF_NO_CASHBACK")
      return "На тарифе «Ещё больше клиентов» касса кэшбэк не начисляет. Ничего не начислено.";
    if (error.code === "MERCHANT_ACCESS_INACTIVE")
      return "Доступ заведения к Loal не оплачен — начислять кэшбэк сейчас нельзя. Ничего не начислено.";
    if (error.status === 403 && /филиал/i.test(error.message)) return `${error.message}. Ничего не начислено.`;
    return `${error.message}. Ничего не начислено.`;
  }
  return "Не удалось начислить. Ничего не начислено — можно повторить.";
}

const panel = "rounded-[24px] bg-surface p-5 shadow-[0_0.75rem_2rem_rgb(22_21_21/0.06)] sm:p-6";

/**
 * Кэшбэк на кассе (тарифы «Больше клиентов» и «Очень много клиентов»): сканер карты, сумма
 * покупки деньгами — клиент получает процент бонусами. Сколько — считает сервер по проценту
 * магазина (`percent` — показать заранее, если знаем). Общая для кабинета заведения и кассира.
 */
export function CashbackForm({
  percent,
  branches,
  onDone,
}: {
  /** Процент кэшбэка магазина — для подсказки «клиент получит ≈ N». */
  percent?: number | null;
  /** Филиалы, где человек может работать: при нескольких касса спросит, на какой записать операцию. */
  branches?: WorkBranch[];
  onDone?: () => void;
}) {
  const api = useApi();
  const accrue = useMutation({ mutationFn: cashbackApi(api).accrue, onSuccess: () => onDone?.() });
  const [result, setResult] = useState<TillCashbackResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [manualCard, setManualCard] = useState(false);
  const cardId = useId();
  const amountId = useId();
  const work = useWorkBranch(branches, "default");
  const [branchMissing, setBranchMissing] = useState(false);

  const fresh = (): TillCashbackForm => ({ cardSerialNumber: "", amount: "" });

  return (
    <Formik
      initialValues={fresh()}
      validate={zodValidate<TillCashbackForm>(tillCashbackInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        setResult(null);
        if (work.needsChoice) {
          setBranchMissing(true);
          return helpers.setSubmitting(false);
        }
        try {
          const done = await accrue.mutateAsync({ ...values, branchId: work.canSwitch ? work.branch?.id : undefined });
          setResult(done);
          helpers.resetForm({ values: fresh() });
          setManualCard(false);
          requestAnimationFrame(() => resultRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
        } catch (error) {
          applyServerIssues(error, helpers, cashbackErrorText(error));
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => {
        const card = form.values.cardSerialNumber.trim();
        const scanned = Boolean(card) && !manualCard;
        const cardError = fieldError(form, "cardSerialNumber");
        const amountError = fieldError(form, "amount");
        return (
          <Form noValidate className="flex max-w-[640px] flex-col gap-4">
            <FocusFirstError form={form} />

            {result && (
              <div ref={resultRef} role="status" className="flex scroll-mt-20 items-start gap-4 rounded-[24px] bg-graphite p-5 text-white sm:p-6">
                <Icon icon={CheckmarkCircle02Icon} size={28} className="mt-1 text-amber" />
                <div className="min-w-0 flex-1">
                  <p className="text-base text-slate-soft">Кэшбэк начислен</p>
                  <p className="display text-[2.4rem] leading-none tabular-nums">
                    +{money.format(result.transaction.amount)} <span className="text-xl font-bold">бонусов</span>
                  </p>
                  <p className="mt-2 text-base text-slate-soft">
                    На карте теперь{" "}
                    <span className="font-bold text-white tabular-nums">{money.format(result.transaction.balanceAfter)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Скрыть"
                  onClick={() => setResult(null)}
                  className="-mt-1 -mr-2 grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-white/10"
                >
                  <Icon icon={Cancel01Icon} />
                </button>
              </div>
            )}

            {work.canSwitch && (
              <section className={panel}>
                <WorkBranchPicker work={work} invalid={branchMissing && work.needsChoice} />
              </section>
            )}

            <section className={panel} aria-labelledby={`${cardId}-title`}>
              <h2 id={`${cardId}-title`} className="text-lg font-bold">
                Карта клиента
              </h2>
              {scanned ? (
                <div className="mt-3 flex items-center gap-3 rounded-2xl bg-muted px-4 py-3">
                  <Icon icon={QrCode01Icon} size={24} className="text-primary" />
                  <span className="min-w-0 flex-1 truncate font-mono text-lg tabular-nums">{card}</span>
                  <button
                    type="button"
                    onClick={() => void form.setFieldValue("cardSerialNumber", "")}
                    className="shrink-0 text-base font-semibold text-flame-ink underline-offset-4 hover:underline"
                  >
                    Другая
                  </button>
                </div>
              ) : (
                <QrScanButton
                  className="mt-3 h-16 w-full rounded-2xl text-lg"
                  onScan={(cardNumber) => {
                    setManualCard(false);
                    void form.setFieldValue("cardSerialNumber", cardNumber);
                    void form.setFieldTouched("cardSerialNumber", true, false);
                    setTimeout(() => document.getElementById(amountId)?.focus(), 50);
                  }}
                >
                  <Icon icon={QrCode01Icon} size={24} />
                  Сканировать QR-код карты
                </QrScanButton>
              )}
              {!scanned && !manualCard && !cardError && (
                <button
                  type="button"
                  onClick={() => {
                    setManualCard(true);
                    setTimeout(() => document.getElementById(cardId)?.focus(), 30);
                  }}
                  className="mt-3 w-full rounded-2xl py-2 text-base font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Ввести номер вручную
                </button>
              )}
              <div hidden={scanned || !(manualCard || cardError)}>
                <label htmlFor={cardId} className="mt-4 block text-base text-muted-foreground">
                  Номер карты — под QR-кодом
                </label>
                <Input
                  id={cardId}
                  name="cardSerialNumber"
                  autoComplete="off"
                  className="mt-2 font-mono text-lg tabular-nums"
                  value={form.values.cardSerialNumber}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  invalid={Boolean(cardError)}
                />
              </div>
              {cardError && <p className="mt-2 text-base font-medium text-destructive">{cardError}</p>}
            </section>

            <section className={panel}>
              <label htmlFor={amountId} className="text-lg font-bold">
                Сумма покупки
              </label>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Сколько клиент заплатил деньгами.
                {percent ? ` Кэшбэк — ${percent}%` : " Кэшбэк посчитаем сами"}
                {percent && Number(form.values.amount) > 0
                  ? `: клиент получит ${money.format(Math.floor((Number(form.values.amount) * percent) / 100))} бонусов.`
                  : "."}
              </p>
              <div className="relative mt-3">
                <Input
                  id={amountId}
                  name="amount"
                  inputMode="decimal"
                  autoComplete="off"
                  className="pr-16 text-2xl tabular-nums"
                  value={String(form.values.amount)}
                  onChange={(event) => void form.setFieldValue("amount", event.target.value.replace(",", "."))}
                  onBlur={form.handleBlur}
                  invalid={Boolean(amountError)}
                />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-lg text-muted-foreground">сом</span>
              </div>
              {amountError && <p className="mt-2 text-base font-medium text-destructive">{amountError}</p>}
            </section>

            <FormStatus message={formError(form)} />
            <Button type="submit" size="lg" disabled={form.isSubmitting} className="h-14 text-lg">
              {form.isSubmitting ? "Начисляем…" : "Дать кэшбэк"}
            </Button>
          </Form>
        );
      }}
    </Formik>
  );
}
