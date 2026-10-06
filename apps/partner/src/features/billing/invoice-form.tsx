import { ApiError, createInvoiceInputSchema, type CreateInvoiceInput, type Invoice } from "@loal/api";
import { FocusFirstError, applyServerIssues, formError, zodValidate } from "@loal/forms";
import { Button, FormStatus, cn } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useCreateInvoice } from "../../entities/merchant/api";

const money = new Intl.NumberFormat("ru-RU");

/** Частые сроки — плитками: набирать «3» руками незачем. */
const PRESETS = [1, 3, 6, 12];

const monthsWord = (n: number) => (n === 1 ? "месяц" : n < 5 ? "месяца" : "месяцев");

/**
 * Счёт на продление доступа. Сумму считает сервер по цене, которую задаёт агентство:
 * выбираем только срок, а итог показываем из ответа — перед тем как уйти на оплату.
 */
export function InvoiceForm({ merchantId }: { merchantId: string }) {
  const createInvoice = useCreateInvoice(merchantId);
  const [issued, setIssued] = useState<Invoice | null>(null);
  // Цена тарифа «Только Loal» — 0: счёт не нужен, бонусы и так принимаются
  const [free, setFree] = useState(false);
  const initialValues: CreateInvoiceInput = { months: 1 };

  if (free)
    return (
      <div role="status" className="rounded-[24px] bg-muted p-5">
        <p className="text-xl font-bold">Доступ сейчас бесплатный</p>
        <p className="mt-1 max-w-[60ch] text-base text-muted-foreground">
          Оплачивать Loal не нужно: магазин принимает бонусы и виден в каталоге и без подписки. Если агентство введёт
          цену, здесь снова можно будет выставить счёт.
        </p>
      </div>
    );

  if (issued)
    return (
      <div className="flex flex-col gap-4 rounded-[24px] bg-muted p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base text-muted-foreground">Счёт выставлен</p>
          <p className="display mt-1 text-[2rem] leading-none tabular-nums">
            {issued.amount ? `${money.format(issued.amount)} сом` : "Счёт готов"}
          </p>
          {issued.months ? (
            <p className="mt-1 text-base text-muted-foreground">
              за {issued.months} {monthsWord(issued.months)} доступа
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          {issued.paymentUrl && (
            <Button asChild size="lg">
              <a href={issued.paymentUrl} target="_blank" rel="noreferrer">
                Оплатить
              </a>
            </Button>
          )}
          <Button variant="outline" size="lg" onClick={() => setIssued(null)}>
            Другой срок
          </Button>
        </div>
      </div>
    );

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(createInvoiceInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          setIssued(await createInvoice.mutateAsync(values));
        } catch (error) {
          if (error instanceof ApiError && error.code === "MERCHANT_ACCESS_FREE") return setFree(true);
          applyServerIssues(error, helpers, invoiceErrorText(error));
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-5" noValidate>
          <FocusFirstError form={form} />
          <fieldset>
            <legend className="text-base font-medium">Срок</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRESETS.map((months) => {
                const active = Number(form.values.months) === months;
                return (
                  <button
                    key={months}
                    type="button"
                    aria-pressed={active}
                    onClick={() => form.setFieldValue("months", months)}
                    className={cn(
                      "h-14 rounded-2xl border-2 px-4 text-lg font-bold transition-colors",
                      active ? "border-primary bg-primary/8" : "border-border bg-surface hover:border-foreground",
                    )}
                  >
                    {months} {monthsWord(months)}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <p className="text-base text-muted-foreground">
            Сумму считает Loal по действующей цене — вы увидите её до оплаты.
          </p>
          <FormStatus message={formError(form)} />
          <Button type="submit" size="lg" disabled={form.isSubmitting} className="self-start">
            {form.isSubmitting ? "Выставляем…" : "Выставить счёт"}
          </Button>
        </Form>
      )}
    </Formik>
  );
}

/**
 * Почему счёт не выставился — словами, а не общим «не удалось»: иначе владелец не узнает,
 * что дело в телефоне магазина или в OctōPAY, а не в нём.
 */
function invoiceErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Сессия закончилась. Войдите в кабинет заново и выставьте счёт.";
    if (error.status === 403) return "Выставить счёт на Loal может только владелец магазина.";
    // 400 — сервер объясняет сам: например, у магазина не указан телефон для счёта
    if (error.status === 400 && error.message) return error.message;
    if (error.status === 502 || error.status === 503 || error.status === 504)
      return "OctōPAY не принял счёт. Попробуйте через пару минут; если повторяется — напишите нам.";
    if (error.message) return `Не удалось выставить счёт: ${error.message}`;
  }
  if (error instanceof TypeError) return "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.";
  return "Не удалось выставить счёт. Попробуйте ещё раз.";
}
