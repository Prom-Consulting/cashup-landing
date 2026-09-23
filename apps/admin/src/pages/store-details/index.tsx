import {
  ApiError,
  STORE_STATUS_LABELS,
  WORKFLOW_STATUS_LABELS,
  buyMonthsInputSchema,
  type BuyMonthsInput,
} from "@loal/api";
import { fieldError, formError, zodValidate } from "@loal/forms";
import { Field } from "@loal/ui/field";
import { Form, Formik } from "formik";
import { Input } from "@loal/ui/shadcn";
import { useState } from "react";
import { Badge, Card, EmptyState, ErrorState, Loading } from "@loal/ui/shadcn";
import { PageHeader } from "@loal/ui/page";
import { Button, Icon } from "@loal/ui/shadcn";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { Link, useParams } from "react-router";
import {
  useCreateInvite,
  useGrantSubscription,
  useStore,
  useStoreDeductions,
  useStoreInvites,
  useStoreMembers,
  useStoreSubscription,
  useSuspendStore,
} from "../../entities/store/api";
import { formatDate, formatDateTime } from "../../shared/lib/format";

const MEMBER_ROLE_LABELS: Record<string, string> = {
  admin: "Владелец",
  staff: "Сотрудник",
  partner: "Партнёр",
  partner_employee: "Сотрудник партнёра",
};

/** Карточка магазина: реквизиты, команда и коды приглашения владельца. */
export function StoreDetailsPage() {
  const { storeId = "" } = useParams();
  const store = useStore(storeId);
  const members = useStoreMembers(storeId);
  const invites = useStoreInvites(storeId);
  const createInvite = useCreateInvite(storeId);
  const subscription = useStoreSubscription(storeId);
  const grant = useGrantSubscription(storeId);
  const suspend = useSuspendStore(storeId);
  const deductions = useStoreDeductions(storeId, { page: 1, pageSize: 5 });
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  if (store.isPending) return <Loading />;
  if (store.isError) return <ErrorState error={store.error} onRetry={() => store.refetch()} />;

  return (
    <section className="flex flex-col gap-6">
      <Link to="/" className="text-base text-slate underline-offset-4 hover:underline">
        ← К списку магазинов
      </Link>

      <PageHeader
        title={store.data.name}
        description={`${store.data.slug} · создан ${formatDate(store.data.createdAt)}`}
        action={
          <Badge tone={store.data.status === "active" ? "good" : "warn"}>
            {STORE_STATUS_LABELS[store.data.status]}
          </Badge>
        }
      />

      <Card>
        <h2 className="text-xl font-bold">Реквизиты</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-base text-muted-foreground">Стадия работы</dt>
            <dd className="text-lg">{WORKFLOW_STATUS_LABELS[store.data.workflowStatus]}</dd>
          </div>
          <div>
            <dt className="text-base text-muted-foreground">Подписка оплачена до</dt>
            <dd className="text-lg">{formatDate(store.data.subscriptionPaidUntil)}</dd>
          </div>
          <div>
            <dt className="text-base text-muted-foreground">Почта</dt>
            <dd className="text-lg">{store.data.contactEmail ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-base text-muted-foreground">Телефон</dt>
            <dd className="text-lg">{store.data.contactPhone ?? "—"}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Подписка магазина</h2>
          {subscription.data && (
            <Badge tone={subscription.data.isActive ? "good" : "warn"}>
              {subscription.data.isActive ? `активна до ${formatDate(subscription.data.expiresAt)}` : "не активна"}
            </Badge>
          )}
        </div>
        <p className="mt-2 max-w-[70ch] text-base text-muted-foreground">
          Пока подписка неактивна, магазин не принимает бонусы ни через приложение, ни через 1С. Здесь доступ выдаётся
          без оплаты — обычный путь продления идёт через счёт в кабинете магазина.
        </p>
        {subscription.isPending && <Loading />}
        {subscription.isError && <ErrorState error={subscription.error} onRetry={() => subscription.refetch()} />}
        <Formik
          initialValues={{ months: 1 } as BuyMonthsInput}
          validate={zodValidate(buyMonthsInputSchema)}
          onSubmit={async (values, helpers) => {
            helpers.setStatus(undefined);
            try {
              await grant.mutateAsync(values);
              helpers.setStatus("Доступ выдан");
            } catch (error) {
              helpers.setStatus(error instanceof ApiError ? error.message : "Не удалось выдать доступ");
            } finally {
              helpers.setSubmitting(false);
            }
          }}
        >
          {(form) => (
            <Form className="mt-5 flex flex-wrap items-end gap-4" noValidate>
              <Field label="Месяцев" error={fieldError(form, "months")} className="w-[140px]">
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
              </Field>
              <Button type="submit" variant="outline" disabled={form.isSubmitting}>
                {form.isSubmitting ? "Выдаём…" : "Выдать доступ"}
              </Button>
              {formError(form) && (
                <p role="status" className="basis-full text-base font-medium text-destructive">
                  {formError(form)}
                </p>
              )}
            </Form>
          )}
        </Formik>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Клиенты и карты</h2>
          <Button asChild variant="outline" size="sm">
            <Link to={`/stores/${storeId}/customers`}>
              <Icon icon={UserGroupIcon} />
              Открыть
            </Link>
          </Button>
        </div>
        <p className="mt-2 max-w-[70ch] text-base text-muted-foreground">Список гостей магазина и выпуск новых карт.</p>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">Последние списания</h2>
        {deductions.isPending && <Loading />}
        {deductions.isSuccess && deductions.data.items.length === 0 && (
          <p className="mt-3 text-lg text-muted-foreground">Списаний ещё не было.</p>
        )}
        <ul className="mt-3 flex flex-col gap-3">
          {(deductions.data?.items ?? []).map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-3"
            >
              <span className="text-lg">
                {row.customerName ?? "Клиент"} · {row.productName ?? "покупка"}
              </span>
              <span className="text-lg tabular-nums">−{row.points}</span>
              <span className="basis-full text-base text-muted-foreground">
                {formatDateTime(row.createdAt)} · {row.channel === "onec" ? "1С" : "приложение"}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">Команда</h2>
        {members.isPending && <Loading />}
        {members.isError && <ErrorState error={members.error} onRetry={() => members.refetch()} />}
        {members.isSuccess && members.data.length === 0 && <EmptyState title="В магазине пока нет сотрудников" />}
        <ul className="mt-4 flex flex-col gap-3">
          {(members.data ?? []).map((member) => (
            <li
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"
            >
              <span className="text-lg">{MEMBER_ROLE_LABELS[member.role] ?? member.role}</span>
              <span className="text-base text-muted-foreground">
                {member.acceptedAt
                  ? `принял приглашение ${formatDateTime(member.acceptedAt)}`
                  : "приглашение не принято"}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">Приостановить магазин</h2>
        <p className="mt-2 max-w-[70ch] text-base text-muted-foreground">
          Магазин перестаёт обслуживаться платформой. Действие видно всем его сотрудникам.
        </p>
        {suspend.isError && <ErrorState error={suspend.error} />}
        {confirmSuspend ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={suspend.isPending}
              onClick={() => {
                suspend.mutate();
                setConfirmSuspend(false);
              }}
            >
              {suspend.isPending ? "Останавливаем…" : "Да, приостановить"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirmSuspend(false)}>
              Отмена
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            disabled={store.data.status === "suspended"}
            onClick={() => setConfirmSuspend(true)}
          >
            {store.data.status === "suspended" ? "Уже приостановлен" : "Приостановить"}
          </Button>
        )}
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Коды приглашения владельца</h2>
          <Button
            type="button"
            variant="outline"
            disabled={createInvite.isPending}
            onClick={() => createInvite.mutate()}
          >
            {createInvite.isPending ? "Создаём…" : "Создать код"}
          </Button>
        </div>
        <p className="mt-2 max-w-[70ch] text-base text-muted-foreground">
          По коду владелец регистрируется сам и сразу получает права на этот магазин.
        </p>
        {createInvite.isError && <ErrorState error={createInvite.error} />}
        {invites.isPending && <Loading />}
        {invites.isSuccess && invites.data.length === 0 && <EmptyState title="Кодов пока нет" />}
        <ul className="mt-4 flex flex-col gap-3">
          {(invites.data ?? []).map((invite) => (
            <li
              key={invite.id}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"
            >
              <code className="rounded-lg bg-muted px-3 py-2 text-lg tracking-wide">{invite.code}</code>
              <span className="text-base text-muted-foreground">
                {invite.redeemedAt ? `использован ${formatDateTime(invite.redeemedAt)}` : "не использован"}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
