import { Delete02Icon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { ApiError, createCashierInputSchema, type CreateCashierInput } from "@loal/api";
import { useJustRegistered } from "@loal/app-kit";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { PhoneInput, formatPhone } from "@loal/ui/inputs";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FormField,
  FormStatus,
  Icon,
  Input,
  Loading,
  Toast,
} from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useCashiers, useCreateCashier, useRemoveCashier } from "../../entities/partner/api";
import { CASHIER_APP_URL } from "../../shared/config/env";
import { formatDate } from "../../shared/lib/format";

const emptyCashier: CreateCashierInput = { fullName: "", phone: "" };

/**
 * Кассиры филиала: партнёр заводит их по имени и телефону, филиал сервер назначает сам —
 * выбирать нечего. Кассир входит кодом из WhatsApp на cashier.loal.kg и видит только
 * обзор филиала, списание и свою историю.
 */
export function PartnerCashiers({ memberId }: { memberId: string }) {
  const cashiers = useCashiers(memberId);
  const create = useCreateCashier(memberId);
  const remove = useRemoveCashier(memberId);
  const [added, setAdded] = useState<string>();
  const cabinet = CASHIER_APP_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const registered = useJustRegistered(
    cashiers.data,
    (cashier) => cashier.memberId,
    () => "Кассир",
  );

  return (
    <div className="flex flex-col gap-5">
      <Toast message={registered.message} onDismiss={registered.dismiss} />
      {cashiers.isPending && <Loading rows={2} />}
      {cashiers.isError && <ErrorState error={cashiers.error} onRetry={() => cashiers.refetch()} />}
      {cashiers.isSuccess && cashiers.data.length === 0 && (
        <EmptyState title="Кассиров пока нет" description="Добавьте первого — ниже, по имени и телефону." />
      )}

      {(cashiers.data?.length ?? 0) > 0 && (
        <ul className="flex flex-col">
          {cashiers.data!.map((cashier) => (
            <li
              key={cashier.memberId}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border py-3 first:border-t-0 first:pt-0"
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-lg font-semibold">{cashier.fullName || "Без имени"}</span>
                  {cashier.registrationStatus === "pending" && <Badge tone="quiet">Ждёт первого входа</Badge>}
                  {cashier.active === false && <Badge tone="quiet">Отключён</Badge>}
                </p>
                <p className="text-base text-muted-foreground tabular-nums">
                  {cashier.phone ? formatPhone(cashier.phone) : "—"}
                  {cashier.registeredAt
                    ? ` · вошёл ${formatDate(cashier.registeredAt)}`
                    : cashier.createdAt
                      ? ` · добавлен ${formatDate(cashier.createdAt)}`
                      : ""}
                </p>
              </div>
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="sm">
                    <Icon icon={Delete02Icon} />
                    Удалить
                  </Button>
                }
                title="Удалить кассира?"
                description={`${cashier.fullName || "Кассир"} сразу потеряет доступ: открытый кабинет разлогинится, списывать бонусы он больше не сможет. Его прошлые списания останутся в истории.`}
                confirmLabel="Удалить"
                onConfirm={() => remove.mutateAsync(cashier.memberId)}
              />
            </li>
          ))}
        </ul>
      )}

      <Formik
        initialValues={emptyCashier}
        validate={zodValidate(createCashierInputSchema)}
        onSubmit={async (values, helpers) => {
          helpers.setStatus(undefined);
          setAdded(undefined);
          try {
            const cashier = await create.mutateAsync(values);
            helpers.resetForm();
            // Повтор для того же номера сервер не дублирует, а возвращает ту же запись
            setAdded(
              cashier.registrationStatus === "registered"
                ? `${cashier.fullName || values.fullName} уже в вашем списке и входил в кабинет.`
                : `${cashier.fullName || values.fullName} добавлен(а). Пусть откроет ${cabinet} и войдёт по номеру ${formatPhone(values.phone)} — код придёт в WhatsApp.`,
            );
          } catch (error) {
            // 409 — номер занят другим заведением или административным аккаунтом
            if (error instanceof ApiError && error.isConflict)
              return helpers.setFieldError("phone", error.message || "Этот номер уже занят другим аккаунтом");
            // 400 без полей — партнёр ещё не привязан к филиалу
            if (error instanceof ApiError && error.status === 400 && error.issues.length === 0)
              return helpers.setStatus(
                error.message || "Вы ещё не привязаны к филиалу — попросите владельца заведения указать его в «Команде».",
              );
            applyServerIssues(error, helpers, "Не удалось добавить кассира");
          } finally {
            helpers.setSubmitting(false);
          }
        }}
      >
        {(form) => (
          <Form noValidate className="flex flex-col gap-4 border-t border-border pt-5">
            <FocusFirstError form={form} />
            <h3 className="text-lg font-bold">Новый кассир</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Имя" error={fieldError(form, "fullName")}>
                {(parts) => (
                  <Input
                    {...parts}
                    name="fullName"
                    autoComplete="off"
                    placeholder="Айжан К."
                    value={form.values.fullName}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </FormField>
              <FormField
                label="Телефон"
                hint="По нему кассир входит — код придёт в WhatsApp."
                error={fieldError(form, "phone")}
              >
                {(parts) => (
                  <PhoneInput
                    {...parts}
                    name="phone"
                    value={form.values.phone}
                    onValueChange={(value) => form.setFieldValue("phone", value)}
                    onBlur={() => form.setFieldTouched("phone", true)}
                  />
                )}
              </FormField>
            </div>
            <FormStatus message={formError(form)} />
            <FormStatus tone="success" message={added} />
            <div>
              <Button type="submit" variant="outline" disabled={form.isSubmitting}>
                <Icon icon={UserAdd01Icon} />
                {form.isSubmitting ? "Добавляем…" : "Добавить кассира"}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
