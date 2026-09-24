import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import {
  ApiError,
  SCANNER_MAX_COVERAGE_PERCENT,
  pointsForItem,
  redemptionInputSchema,
  type RedemptionForm,
  type RedemptionResult,
} from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Badge, Button, Card, FormField, FormStatus, Icon, Input } from "@loal/ui/shadcn";
import { Form, Formik, getIn } from "formik";
import { useMemo, useState } from "react";
import { useRedeem } from "../../entities/merchant/api";

const money = new Intl.NumberFormat("ru-RU");

/** Номер операции по умолчанию: повтор с ним не спишет второй раз. */
const newOperationId = () =>
  `web-${new Date().toISOString().slice(0, 19).replace(/\D/g, "")}-${Math.random().toString(36).slice(2, 6)}`;

const emptyItem = (percent: number) => ({ productName: "", price: "", deductionPercent: percent });

/** Отказы кассы — человеческим языком: при любом из них ничего не списано. */
function redeemErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403)
      return "Подписка заведения неактивна — принимать бонусы сейчас нельзя. Ничего не списано.";
    if (error.status === 404) return "Карты с таким номером нет. Ничего не списано.";
    if (error.status === 409) return `${error.message || "Не хватает баллов или карта не активна"}. Ничего не списано.`;
    return `${error.message}. Ничего не списано.`;
  }
  return "Не удалось списать. Ничего не списано — можно повторить с тем же номером операции.";
}

/**
 * Касса в браузере: что купили, почём и какую долю закрывают бонусы. Баллы
 * считает сервер — здесь та же формула, чтобы кассир видел итог до отправки.
 */
export function RedeemForm({ ceiling, merchantId }: { ceiling: number | null; merchantId?: string }) {
  const redeem = useRedeem();
  const [result, setResult] = useState<RedemptionResult | null>(null);
  const maxPercent = Math.min(SCANNER_MAX_COVERAGE_PERCENT, ceiling ?? SCANNER_MAX_COVERAGE_PERCENT);
  const schema = useMemo(() => redemptionInputSchema(maxPercent), [maxPercent]);
  const defaultPercent = Math.min(5, maxPercent);

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
        } catch (error) {
          applyServerIssues(error, helpers, redeemErrorText(error));
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => {
        const items = form.values.whatPurchased;
        const total = items.reduce(
          (sum, item) => sum + pointsForItem(Number(item.price), Number(item.deductionPercent)),
          0,
        );
        const at = (path: string) => {
          const error = getIn(form.errors, path);
          return (form.submitCount > 0 || getIn(form.touched, path)) && typeof error === "string" ? error : undefined;
        };

        return (
          <Form noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <FocusFirstError form={form} />
            <Card className="flex flex-col gap-5">
              <FormField
                label="Номер карты"
                hint="Под QR-кодом на карте клиента."
                error={fieldError(form, "cardSerialNumber")}
              >
                {(parts) => (
                  <Input
                    {...parts}
                    name="cardSerialNumber"
                    autoComplete="off"
                    className="text-xl tabular-nums"
                    value={form.values.cardSerialNumber}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </FormField>

              <fieldset className="flex flex-col gap-3">
                <legend className="text-base font-medium">Что купили</legend>
                <p className="text-sm text-muted-foreground">
                  Процент — какую долю цены позиции закрывают бонусы. Не больше {maxPercent}%
                  {ceiling !== null && ceiling < SCANNER_MAX_COVERAGE_PERCENT
                    ? " — потолок заведения"
                    : " — предел кассы"}
                  .
                </p>
                <ol className="flex flex-col gap-3">
                  {items.map((item, index) => {
                    const base = `whatPurchased.${index}`;
                    return (
                      <li
                        key={index}
                        className="grid gap-3 rounded-2xl border-2 border-border p-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_100px_auto] sm:items-start"
                      >
                        <FormField label="Товар" error={at(`${base}.productName`)}>
                          {(parts) => (
                            <Input
                              {...parts}
                              name={`${base}.productName`}
                              value={item.productName}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                            />
                          )}
                        </FormField>
                        <FormField label="Цена, сом" error={at(`${base}.price`)}>
                          {(parts) => (
                            <Input
                              {...parts}
                              name={`${base}.price`}
                              inputMode="decimal"
                              className="tabular-nums"
                              value={String(item.price)}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                            />
                          )}
                        </FormField>
                        <FormField label="%" error={at(`${base}.deductionPercent`)}>
                          {(parts) => (
                            <Input
                              {...parts}
                              name={`${base}.deductionPercent`}
                              inputMode="numeric"
                              className="tabular-nums"
                              value={String(item.deductionPercent)}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                            />
                          )}
                        </FormField>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="sm:mt-8"
                          aria-label="Убрать позицию"
                          disabled={items.length === 1}
                          onClick={() =>
                            form.setFieldValue(
                              "whatPurchased",
                              items.filter((_, i) => i !== index),
                            )
                          }
                        >
                          <Icon icon={Delete02Icon} />
                        </Button>
                      </li>
                    );
                  })}
                </ol>
                <FormStatus message={at("whatPurchased")} />
                <div>
                  <Button
                    variant="ghost"
                    disabled={items.length >= 50}
                    onClick={() => form.setFieldValue("whatPurchased", [...items, emptyItem(defaultPercent)])}
                  >
                    <Icon icon={Add01Icon} />
                    Позиция
                  </Button>
                </div>
              </fieldset>

              <FormField
                label="Номер операции"
                hint="Номер чека. Повтор с тем же номером не спишет второй раз — можно смело повторять при обрыве связи."
                error={fieldError(form, "operationId")}
              >
                {(parts) => (
                  <Input
                    {...parts}
                    name="operationId"
                    className="font-mono text-base"
                    value={form.values.operationId}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </FormField>
            </Card>

            <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
              <Card className="flex flex-col gap-3">
                <p className="text-base text-muted-foreground">Спишется бонусов</p>
                <p className="display text-[2.75rem] leading-none tabular-nums">{money.format(total)}</p>
                <p className="text-sm text-muted-foreground">
                  Точную сумму считает сервер: по каждой позиции вниз до целого.
                </p>
                <FormStatus message={formError(form)} />
                <Button type="submit" size="lg" disabled={form.isSubmitting || total <= 0}>
                  {form.isSubmitting ? "Списываем…" : "Списать"}
                </Button>
              </Card>

              {result && (
                <Card className="flex flex-col gap-2" role="status">
                  {result.duplicate ? (
                    <Badge tone="quiet">Эта операция уже проведена — повторно ничего не списано</Badge>
                  ) : (
                    <Badge tone="good">Списано</Badge>
                  )}
                  <p className="text-lg">
                    {result.duplicate ? "Было списано" : "Списано"}{" "}
                    <span className="font-bold tabular-nums">{money.format(result.deducted)}</span> бонусов.
                  </p>
                  <p className="text-base text-muted-foreground">
                    На карте осталось <span className="tabular-nums">{money.format(result.balanceAfter)}</span>.
                  </p>
                </Card>
              )}
            </aside>
          </Form>
        );
      }}
    </Formik>
  );
}
