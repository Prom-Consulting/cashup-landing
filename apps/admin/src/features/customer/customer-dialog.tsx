import { buyMonthsInputSchema, type Card, type Customer } from "@loal/api";
import { useCustomerCards, useRevokeCard } from "@loal/app-kit";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  EmptyState,
  ErrorState,
  FormField,
  FormStatus,
  Input,
  Loading,
  NativeSelect,
} from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import {
  useArchiveCustomer,
  useCancelCardSubscription,
  useCardSubscription,
  useIssueDefaultCard,
  useSetCardTier,
  useStartCardSubscription,
} from "../../entities/card/api";
import { useTiers } from "../../entities/platform/api";
import { formatDate } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");
const CARD_STATUS: Record<string, string> = { active: "действует", suspended: "приостановлена", revoked: "отозвана" };
const SUBSCRIPTION_STATUS: Record<string, string> = { active: "идёт", canceled: "отменена", expired: "закончилась" };

/** Подписка держателя: сколько периодов оплачено, когда сгорят баллы, продлить или отменить. */
function Subscription({ serial }: { serial: string }) {
  const subscription = useCardSubscription(serial);
  const start = useStartCardSubscription(serial);
  const cancel = useCancelCardSubscription(serial);
  const [done, setDone] = useState<string>();

  if (subscription.isPending) return <Loading rows={1} />;
  if (subscription.isError) return <ErrorState error={subscription.error} onRetry={() => subscription.refetch()} />;
  const data = subscription.data;
  const active = data?.status === "active";

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-muted p-4">
      <p className="text-base">
        {data ? (
          <>
            Подписка {SUBSCRIPTION_STATUS[data.status] ?? data.status}: выдано {data.periodsGranted} из{" "}
            {data.periodsTotal} мес.
            {data.currentPeriodEnd && active
              ? ` Баллы текущего периода сгорят ${formatDate(data.currentPeriodEnd).replace(/\.$/, "")}.`
              : ""}
          </>
        ) : (
          "Подписки нет — баллы на карту не приходят."
        )}
      </p>
      <Formik
        initialValues={{ months: 1 }}
        validate={zodValidate(buyMonthsInputSchema)}
        onSubmit={async (values, helpers) => {
          helpers.setStatus(undefined);
          setDone(undefined);
          try {
            await start.mutateAsync(values);
            setDone(
              active
                ? "Продлено: баллы за новые месяцы придут в начале периодов"
                : "Подписка включена, баллы уже на карте",
            );
          } catch (error) {
            applyServerIssues(error, helpers, "Не удалось выдать месяцы");
          } finally {
            helpers.setSubmitting(false);
          }
        }}
      >
        {(form) => (
          <Form noValidate className="flex flex-wrap items-start gap-3">
            <FocusFirstError form={form} />
            <FormField label="Месяцев" className="w-[120px]" error={fieldError(form, "months")}>
              {(parts) => (
                <Input
                  {...parts}
                  name="months"
                  inputMode="numeric"
                  value={String(form.values.months)}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              )}
            </FormField>
            <Button type="submit" variant="outline" size="sm" className="mt-9" disabled={form.isSubmitting}>
              {active ? "Продлить без оплаты" : "Включить без оплаты"}
            </Button>
            {active && (
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="sm" className="mt-9">
                    Отменить подписку
                  </Button>
                }
                title="Отменить подписку?"
                description="Новые периоды не начнутся. Баллы текущего периода останутся до его конца."
                confirmLabel="Отменить подписку"
                onConfirm={() => cancel.mutateAsync()}
              />
            )}
            <div className="basis-full">
              <FormStatus message={formError(form)} />
              <FormStatus tone="success" message={done} />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

function CardRow({ card }: { card: Card }) {
  const revoke = useRevokeCard();
  const tiers = useTiers(card.programId ?? null);
  const setTier = useSetCardTier();
  const active = card.status === "active";

  return (
    <li className="flex flex-col gap-4 rounded-2xl border-2 border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>
          <span className="text-lg font-medium tabular-nums">{card.serialNumber}</span>{" "}
          <Badge tone={active ? "good" : "quiet"}>{CARD_STATUS[card.status] ?? card.status}</Badge>
          <span className="block text-sm text-muted-foreground">
            Баланс {money.format(card.pointsBalance)}
            {card.createdAt ? ` · выдана ${formatDate(card.createdAt)}` : ""}
          </span>
        </span>
        {active && (
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="sm">
                Отозвать
              </Button>
            }
            title="Отозвать карту?"
            description="Карта в Wallet станет недействительной. Баланс остаётся за человеком: при выдаче новой карты он переедет на неё."
            confirmLabel="Отозвать"
            onConfirm={() => revoke.mutateAsync(card.serialNumber)}
          />
        )}
      </div>
      {active && (tiers.data?.length ?? 0) > 0 && (
        <FormField label="Уровень" hint="Обычно считается сам по сумме покупок; здесь — поставить руками.">
          {(parts) => (
            <NativeSelect
              {...parts}
              value={card.tierId ?? ""}
              placeholder="Как посчитает программа"
              disabled={setTier.isPending}
              onChange={(event) =>
                event.target.value && setTier.mutate({ serial: card.serialNumber, tierId: event.target.value })
              }
              options={(tiers.data ?? []).map((tier) => ({ value: tier.id, label: tier.name }))}
            />
          )}
        </FormField>
      )}
      {active && <Subscription serial={card.serialNumber} />}
      <FormStatus message={[revoke, setTier].find((mutation) => mutation.isError)?.error?.message} />
    </li>
  );
}

/** Всё о держателе: его карты, подписка, уровень, выдача новой карты и архив. */
export function CustomerDialog({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const cards = useCustomerCards(customer?.id ?? null);
  const issue = useIssueDefaultCard();
  const archive = useArchiveCustomer();
  const name = customer ? [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Без имени" : "";
  const hasActive = cards.data?.some((card) => card.status === "active");

  return (
    <Dialog open={Boolean(customer)} onOpenChange={(open) => !open && onClose()}>
      {customer && (
        <DialogContent
          title={name}
          description={[customer.phone, customer.email].filter(Boolean).join(" · ") || undefined}
          className="w-[min(680px,calc(100vw-2rem))]"
        >
          <div className="flex flex-col gap-5">
            {cards.isPending && <Loading rows={2} />}
            {cards.isError && <ErrorState error={cards.error} onRetry={() => cards.refetch()} />}
            {cards.isSuccess && cards.data.length === 0 && <EmptyState title="Карт ещё не выдавали" />}
            <ul className="flex flex-col gap-3">
              {(cards.data ?? []).map((card) => (
                <CardRow key={card.serialNumber} card={card} />
              ))}
            </ul>

            {!customer.archivedAt && (
              <div className="flex flex-wrap gap-3 border-t border-border pt-5">
                <ConfirmDialog
                  trigger={<Button variant="outline">{hasActive ? "Перевыпустить карту" : "Выдать карту"}</Button>}
                  title={hasActive ? "Перевыпустить карту?" : "Выдать карту платформы?"}
                  tone="primary"
                  description={
                    hasActive
                      ? "У человека одна действующая карта: текущая будет отозвана, весь баланс переедет на новую. Подписку это не трогает."
                      : "Человек получит карту платформы по умолчанию."
                  }
                  confirmLabel={hasActive ? "Перевыпустить" : "Выдать"}
                  onConfirm={() => issue.mutateAsync(customer.id)}
                />
                <ConfirmDialog
                  trigger={<Button variant="ghost">В архив</Button>}
                  title="Отправить клиента в архив?"
                  description="Это необратимо: его карты будут отозваны тем же действием."
                  confirmLabel="В архив"
                  onConfirm={async () => {
                    await archive.mutateAsync(customer.id);
                    onClose();
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
