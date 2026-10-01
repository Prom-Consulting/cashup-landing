import { Add01Icon, Cancel01Icon, CheckmarkCircle02Icon, QrCode01Icon } from "@hugeicons/core-free-icons";
import {
  ApiError,
  SCANNER_MAX_COVERAGE_PERCENT,
  pointsForItem,
  redemptionInputSchema,
  type RedemptionForm,
  type RedemptionResult,
  redemptionsApi,
} from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, FormStatus, Icon, Input } from "@loal/ui/shadcn";
import { Form, Formik, getIn } from "formik";
import { useMutation } from "@tanstack/react-query";
import { useId, useMemo, useRef, useState } from "react";
import { QrScanButton } from "./qr-scanner";
import { useApi } from "./session";

const money = new Intl.NumberFormat("ru-RU");

/** Номер операции по умолчанию: повтор с ним не спишет второй раз. */
const newOperationId = () =>
  `web-${new Date().toISOString().slice(0, 19).replace(/\D/g, "")}-${Math.random().toString(36).slice(2, 6)}`;

const emptyItem = (percent: number) => ({ productName: "", price: "", deductionPercent: percent });

/** Списание за покупку. Общее для кабинета заведения и кабинета кассира филиала. */
export function useRedeem(onDone?: () => void) {
  const api = useApi();
  return useMutation({
    mutationFn: ({ input, maxPercent }: { input: RedemptionForm & { merchantId?: string }; maxPercent: number }) =>
      redemptionsApi(api).redeem(input, maxPercent),
    onSuccess: () => onDone?.(),
  });
}

/** Отказы кассы — человеческим языком: при любом из них ничего не списано. */
function redeemErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403)
      return "Подписка заведения неактивна — принимать бонусы сейчас нельзя. Ничего не списано.";
    if (error.status === 404) return "Карты с таким номером нет. Ничего не списано.";
    // По стабильному коду, а не по тексту: сервер вправе переформулировать сообщение
    if (error.code === "CARD_FROZEN")
      return "Карта клиента заморожена: его подписка закончилась. Пусть продлит её в кабинете Loal. Ничего не списано.";
    if (error.code === "INSUFFICIENT_POINTS") return "На карте не хватает бонусов на эту сумму. Ничего не списано.";
    if (error.status === 409) return `${error.message || "Не хватает баллов или карта не активна"}. Ничего не списано.`;
    return `${error.message}. Ничего не списано.`;
  }
  return "Не удалось списать. Ничего не списано — можно повторить с тем же номером операции.";
}

/** Проценты кнопками: частые значения до потолка и сам потолок — вводить руками не нужно. */
function percentChoices(max: number) {
  const base = [5, 10, 15, 20, 25, 30].filter((value) => value < max);
  return [...base, max];
}

const panel = "rounded-[24px] bg-surface p-5 shadow-[0_0.75rem_2rem_rgb(22_21_21/0.06)] sm:p-6";

/**
 * Касса в браузере, сначала для телефона: большая кнопка сканера, позиции карточками,
 * процент кнопками, итог и «Списать» прилипают к низу экрана. Баллы считает сервер —
 * здесь та же формула, чтобы кассир видел итог до отправки.
 */
export function RedeemForm({
  ceiling,
  merchantId,
  onRedeemed,
}: {
  ceiling: number | null;
  merchantId?: string;
  /** После успешного списания — например, обновить историю кассира. */
  onRedeemed?: () => void;
}) {
  const redeem = useRedeem(onRedeemed);
  const [result, setResult] = useState<RedemptionResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const maxPercent = Math.min(SCANNER_MAX_COVERAGE_PERCENT, ceiling ?? SCANNER_MAX_COVERAGE_PERCENT);
  const schema = useMemo(() => redemptionInputSchema(maxPercent), [maxPercent]);
  const defaultPercent = Math.min(5, maxPercent);
  const choices = percentChoices(maxPercent);
  // Номер карты руками — запасной путь: поле открывается по кнопке, а не висит под сканером
  const [manualCard, setManualCard] = useState(false);
  // Позиции, где касса выбрала «Свой %» — вводит любое целое число до потолка
  const [customPercent, setCustomPercent] = useState<Set<number>>(new Set());
  const cardId = useId();

  const initialValues: RedemptionForm = {
    cardSerialNumber: "",
    operationId: newOperationId(),
    whatPurchased: [emptyItem(defaultPercent)],
  };

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate<RedemptionForm>(schema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        setResult(null);
        try {
          const done = await redeem.mutateAsync({ input: { ...values, merchantId }, maxPercent });
          setResult(done);
          helpers.resetForm({ values: { ...initialValues, operationId: newOperationId() } });
          setManualCard(false);
          setCustomPercent(new Set());
          // Итог — первым делом на экране, особенно на телефоне
          requestAnimationFrame(() => resultRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
        } catch (error) {
          applyServerIssues(error, helpers, redeemErrorText(error));
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => {
        const items = form.values.whatPurchased;
        const pointsOf = (item: (typeof items)[number]) =>
          pointsForItem(Number(item.price), Number(item.deductionPercent));
        const total = items.reduce((sum, item) => sum + pointsOf(item), 0);
        const at = (path: string) => {
          const error = getIn(form.errors, path);
          return (form.submitCount > 0 || getIn(form.touched, path)) && typeof error === "string" ? error : undefined;
        };
        const card = form.values.cardSerialNumber.trim();
        // Плашка «карта считана» — только для сканера: номер, который вводят руками, остаётся в поле
        const scanned = Boolean(card) && !manualCard;
        const cardError = fieldError(form, "cardSerialNumber");

        return (
          <Form noValidate className="grid gap-4 pb-28 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-6 lg:pb-0">
            <FocusFirstError form={form} />

            <div className="flex min-w-0 flex-col gap-4">
              {result && (
                <div
                  ref={resultRef}
                  role="status"
                  className="flex scroll-mt-20 items-start gap-4 rounded-[24px] bg-graphite p-5 text-white sm:p-6"
                >
                  <Icon icon={CheckmarkCircle02Icon} size={28} className="mt-1 text-amber" />
                  <div className="min-w-0 flex-1">
                    <p className="text-base text-slate-soft">
                      {result.duplicate ? "Эта операция уже проведена — повторно ничего не списано" : "Списано"}
                    </p>
                    <p className="display text-[2.4rem] leading-none tabular-nums">
                      −{money.format(result.deducted)} <span className="text-xl font-bold">бонусов</span>
                    </p>
                    <p className="mt-2 text-base text-slate-soft">
                      На карте осталось <span className="font-bold text-white tabular-nums">{money.format(result.balanceAfter)}</span>
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

              {/* Карта: сканер — главное действие, номер руками — запасной путь */}
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
                      onClick={() => {
                        setManualCard(false);
                        void form.setFieldValue("cardSerialNumber", "");
                      }}
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
                      // Наименование необязательно — после карты сразу вводят цену.
                      setTimeout(
                        () =>
                          document
                            .querySelector<HTMLInputElement>('input[name="whatPurchased.0.price"]')
                            ?.focus(),
                        50,
                      );
                    }}
                  >
                    <Icon icon={QrCode01Icon} size={24} />
                    Сканировать QR-код карты
                  </QrScanButton>
                )}
                {/* Номер руками — по кнопке; если форма уже ругается на номер, поле открыто сразу */}
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
                    aria-describedby={cardError ? `${cardId}-error` : undefined}
                  />
                </div>
                {cardError && (
                  <p id={`${cardId}-error`} className="mt-2 text-base font-medium text-destructive">
                    {cardError}
                  </p>
                )}
              </section>

              {/* Покупка: каждая позиция — карточка, процент кнопками */}
              <section className={panel}>
                <h2 className="text-lg font-bold">Что купили</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Бонусами — до {maxPercent}% цены позиции
                  {ceiling !== null && ceiling < SCANNER_MAX_COVERAGE_PERCENT ? ", это потолок заведения" : ""}.
                </p>
                <ol className="mt-3 flex flex-col gap-3">
                  {items.map((item, index) => {
                    const base = `whatPurchased.${index}`;
                    const points = pointsOf(item);
                    const nameError = at(`${base}.productName`);
                    const priceError = at(`${base}.price`);
                    const percentError = at(`${base}.deductionPercent`);
                    // «Свой» — выбран явно или процент не совпадает ни с одной кнопкой
                    const custom =
                      customPercent.has(index) ||
                      (String(item.deductionPercent) !== "" && !choices.includes(Number(item.deductionPercent)));
                    return (
                      <li key={index} className="rounded-2xl border-2 border-border p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-muted-foreground">Позиция {index + 1}</span>
                          <span className="ml-auto text-base font-bold tabular-nums">
                            {points > 0 ? `−${money.format(points)} бонусов` : ""}
                          </span>
                          {items.length > 1 && (
                            <button
                              type="button"
                              aria-label={`Убрать позицию ${index + 1}`}
                              onClick={() => {
                                setCustomPercent(new Set());
                                void form.setFieldValue(
                                  "whatPurchased",
                                  items.filter((_, i) => i !== index),
                                );
                              }}
                              className="-my-2 -mr-2 grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <Icon icon={Cancel01Icon} />
                            </button>
                          )}
                        </div>

                        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                          <div>
                            <label htmlFor={`${cardId}-${index}-name`} className="sr-only">
                              Наименование товара (необязательно)
                            </label>
                            <Input
                              id={`${cardId}-${index}-name`}
                              name={`${base}.productName`}
                              placeholder="Товар (необязательно)"
                              value={item.productName}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                              invalid={Boolean(nameError)}
                            />
                            {nameError && <p className="mt-1 text-sm font-medium text-destructive">{nameError}</p>}
                          </div>
                          <div>
                            <label htmlFor={`${cardId}-${index}-price`} className="sr-only">
                              Цена, сом
                            </label>
                            <div className="relative">
                              <Input
                                id={`${cardId}-${index}-price`}
                                name={`${base}.price`}
                                inputMode="decimal"
                                placeholder="Цена"
                                className="pr-14 tabular-nums"
                                value={String(item.price)}
                                onChange={form.handleChange}
                                onBlur={form.handleBlur}
                                invalid={Boolean(priceError)}
                              />
                              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-base text-muted-foreground">
                                сом
                              </span>
                            </div>
                            {priceError && <p className="mt-1 text-sm font-medium text-destructive">{priceError}</p>}
                          </div>
                        </div>

                        <div
                          className="mt-3 grid gap-2"
                          style={{ gridTemplateColumns: `repeat(${choices.length + 1}, minmax(0, 1fr))` }}
                          role="radiogroup"
                          aria-label="Сколько процентов цены закрыть бонусами"
                        >
                          {choices.map((value) => {
                            const active = !custom && Number(item.deductionPercent) === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                onClick={() => {
                                  setCustomPercent((current) => {
                                    const next = new Set(current);
                                    next.delete(index);
                                    return next;
                                  });
                                  void form.setFieldValue(`${base}.deductionPercent`, value);
                                }}
                                className={`h-11 rounded-full text-base font-bold tabular-nums transition-colors ${
                                  active ? "bg-graphite text-white" : "bg-muted text-foreground hover:bg-border"
                                }`}
                              >
                                {value}%
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            role="radio"
                            aria-checked={custom}
                            onClick={() => {
                              setCustomPercent((current) => new Set(current).add(index));
                              setTimeout(() => document.getElementById(`${cardId}-${index}-percent`)?.focus(), 30);
                            }}
                            className={`h-11 rounded-full text-base font-bold transition-colors ${
                              custom ? "bg-graphite text-white" : "bg-muted text-foreground hover:bg-border"
                            }`}
                          >
                            Свой
                          </button>
                        </div>
                        {custom && (
                          <div className="mt-2 flex items-center gap-3">
                            <label htmlFor={`${cardId}-${index}-percent`} className="text-sm text-muted-foreground">
                              Свой процент
                            </label>
                            <div className="relative w-28">
                              <Input
                                id={`${cardId}-${index}-percent`}
                                name={`${base}.deductionPercent`}
                                inputMode="numeric"
                                placeholder={`1–${maxPercent}`}
                                className="pr-9 tabular-nums"
                                value={String(item.deductionPercent)}
                                onChange={form.handleChange}
                                onBlur={form.handleBlur}
                                invalid={Boolean(percentError)}
                              />
                              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-base text-muted-foreground">
                                %
                              </span>
                            </div>
                          </div>
                        )}
                        {percentError && <p className="mt-1 text-sm font-medium text-destructive">{percentError}</p>}
                      </li>
                    );
                  })}
                </ol>
                <FormStatus message={at("whatPurchased")} />
                <button
                  type="button"
                  disabled={items.length >= 50}
                  onClick={() => form.setFieldValue("whatPurchased", [...items, emptyItem(defaultPercent)])}
                  className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-base font-semibold text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
                >
                  <Icon icon={Add01Icon} />
                  Добавить позицию
                </button>
              </section>
            </div>

            {/* Итог: на телефоне прилипает к низу экрана, на десктопе — колонка справа */}
            <aside className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-5 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] shadow-[0_-0.75rem_2rem_rgb(22_21_21/0.08)] backdrop-blur lg:sticky lg:top-6 lg:inset-auto lg:z-auto lg:rounded-[24px] lg:border-0 lg:p-6 lg:shadow-[0_0.75rem_2rem_rgb(22_21_21/0.06)]">
              <FormStatus message={formError(form)} />
              <div className="flex items-center gap-4 lg:flex-col lg:items-stretch">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground lg:text-base">Спишется бонусов</p>
                  <p className="display text-[1.9rem] leading-none tabular-nums lg:text-[2.75rem]">
                    {money.format(total)}
                  </p>
                </div>
                <Button type="submit" size="lg" className="shrink-0 px-8" disabled={form.isSubmitting || total <= 0}>
                  {form.isSubmitting ? "Списываем…" : "Списать"}
                </Button>
              </div>
              <p className="mt-2 hidden text-sm text-muted-foreground lg:block">
                Точную сумму считает сервер: по каждой позиции вниз до целого.
              </p>
            </aside>
          </Form>
        );
      }}
    </Formik>
  );
}
