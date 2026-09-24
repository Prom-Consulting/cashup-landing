import {
  DEDUCTION_CHANNEL_LABELS,
  MEMBER_ROLE_LABELS,
  MERCHANT_STATUS_LABELS,
  buyMonthsInputSchema,
  invoiceState,
  type BuyMonthsInput,
} from "@loal/api";
import { CoverageLimitForm, StorefrontForm, useMerchantProfile } from "@loal/app-kit";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Field } from "@loal/ui/field";
import { Form, Formik } from "formik";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  Loading,
  PageHeader,
} from "@loal/ui/shadcn";
import { Link, useNavigate, useParams } from "react-router";
import {
  useAcceptMember,
  useCreateInvite,
  useDeleteMerchant,
  useGrantSubscription,
  useMerchant,
  useMerchantDeductions,
  useMerchantInvites,
  useMerchantInvoices,
  useMerchantMembers,
  useMerchantSubscription,
  useRemoveMember,
  useSuspendMerchant,
} from "../../entities/merchant/api";
import { EditMerchantForm } from "../../features/merchant/edit-merchant-form";
import { formatDate, formatDateTime } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");

/** Витрина заведения: агентство может поправить её за заведение. */
function Storefront({ merchantId }: { merchantId: string }) {
  const profile = useMerchantProfile(merchantId);
  if (profile.isPending) return <Loading rows={2} />;
  if (profile.isError) return <ErrorState error={profile.error} onRetry={() => profile.refetch()} />;
  return <StorefrontForm merchantId={merchantId} profile={profile.data} />;
}

/** Карточка заведения: реквизиты, команда и коды приглашения владельца. */
export function MerchantDetailsPage() {
  const { merchantId = "" } = useParams();
  const merchant = useMerchant(merchantId);
  const members = useMerchantMembers(merchantId);
  const invites = useMerchantInvites(merchantId);
  const createInvite = useCreateInvite(merchantId);
  const subscription = useMerchantSubscription(merchantId);
  const grant = useGrantSubscription(merchantId);
  const suspend = useSuspendMerchant(merchantId);
  const deductions = useMerchantDeductions(merchantId, { page: 1, pageSize: 5 });
  const invoices = useMerchantInvoices(merchantId);
  const accept = useAcceptMember(merchantId);
  const removeMember = useRemoveMember(merchantId);
  const remove = useDeleteMerchant();
  const navigate = useNavigate();

  if (merchant.isPending) return <Loading />;
  if (merchant.isError) return <ErrorState error={merchant.error} onRetry={() => merchant.refetch()} />;

  return (
    <section className="flex flex-col gap-6">
      <Link to="/" className="text-base text-slate underline-offset-4 hover:underline">
        ← К списку заведений
      </Link>

      <PageHeader
        title={merchant.data.name}
        description={`${merchant.data.slug} · создан ${formatDate(merchant.data.createdAt)}`}
        action={
          <Badge tone={merchant.data.status === "active" ? "good" : "warn"}>
            {MERCHANT_STATUS_LABELS[merchant.data.status]}
          </Badge>
        }
      />

      <Card>
        <h2 className="text-xl font-bold">Реквизиты</h2>
        <div className="mt-5">
          <EditMerchantForm merchant={merchant.data} />
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">Витрина</h2>
        <p className="mt-1 mb-5 max-w-[62ch] text-base text-muted-foreground">
          Что клиент видит о заведении в каталоге. Обычно её заполняет само заведение.
        </p>
        <Storefront merchantId={merchantId} />
      </Card>

      <Card>
        <h2 className="text-xl font-bold">Потолок процента</h2>
        <div className="mt-4">
          <CoverageLimitForm merchantId={merchantId} asAgency />
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Подписка заведения</h2>
          {subscription.data && (
            <Badge tone={subscription.data.isActive ? "good" : "warn"}>
              {subscription.data.isActive ? `активна до ${formatDate(subscription.data.expiresAt)}` : "не активна"}
            </Badge>
          )}
        </div>
        <p className="mt-2 max-w-[70ch] text-base text-muted-foreground">
          Пока подписка неактивна, заведение не принимает бонусы ни через приложение, ни через 1С. Здесь доступ выдаётся
          без оплаты — обычный путь продления идёт через счёт в кабинете заведения.
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
              applyServerIssues(error, helpers);
            } finally {
              helpers.setSubmitting(false);
            }
          }}
        >
          {(form) => (
            <Form className="mt-5 flex flex-wrap items-end gap-4" noValidate>
              <FocusFirstError form={form} />
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
                {formatDateTime(row.createdAt)} · {DEDUCTION_CHANNEL_LABELS[row.channel ?? ""] ?? row.channel ?? "—"}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">Команда</h2>
        {members.isPending && <Loading />}
        {members.isError && <ErrorState error={members.error} onRetry={() => members.refetch()} />}
        {members.isSuccess && members.data.length === 0 && <EmptyState title="В заведении пока нет сотрудников" />}
        <ul className="mt-4 flex flex-col gap-3">
          {(members.data ?? []).map((member) => (
            <li
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"
            >
              <span>
                <span className="text-lg">{MEMBER_ROLE_LABELS[member.role] ?? member.role}</span>
                <span className="block text-sm text-muted-foreground tabular-nums">{member.userId}</span>
              </span>
              <span className="flex flex-wrap items-center gap-2">
                {member.acceptedAt ? (
                  <span className="text-base text-muted-foreground">в команде с {formatDate(member.acceptedAt)}</span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={accept.isPending}
                    onClick={() => accept.mutate(member.id)}
                  >
                    Подтвердить
                  </Button>
                )}
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="sm">
                      Убрать
                    </Button>
                  }
                  title="Убрать из команды?"
                  description="Человек потеряет доступ к кабинету заведения. Его аккаунт останется."
                  confirmLabel="Убрать"
                  onConfirm={() => removeMember.mutateAsync(member.id)}
                />
              </span>
            </li>
          ))}
        </ul>
        {accept.isError && <ErrorState error={accept.error} />}
      </Card>

      <Card>
        <h2 className="text-xl font-bold">Счета</h2>
        {invoices.isPending && <Loading rows={2} />}
        {invoices.isError && <ErrorState error={invoices.error} onRetry={() => invoices.refetch()} />}
        {invoices.isSuccess && invoices.data.length === 0 && (
          <p className="mt-3 text-lg text-muted-foreground">Счетов ещё не выставляли.</p>
        )}
        <ul className="mt-3 flex flex-col gap-3">
          {(invoices.data ?? []).map((invoice) => {
            const state = invoiceState(invoice);
            return (
              <li
                key={invoice.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-3"
              >
                <span className="text-lg tabular-nums">
                  {invoice.amount != null ? `${money.format(invoice.amount)} сом` : "—"}
                  {invoice.months ? ` · ${invoice.months} мес.` : ""}
                </span>
                <Badge tone={state.tone}>{state.label}</Badge>
                <span className="basis-full text-base text-muted-foreground">
                  {invoice.createdAt ? formatDateTime(invoice.createdAt) : ""}
                  {invoice.paidAt ? ` · оплачен ${formatDateTime(invoice.paidAt)}` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">Приостановить или удалить</h2>
        <p className="mt-2 max-w-[70ch] text-base text-muted-foreground">
          Приостановленное заведение перестаёт обслуживаться платформой. Удаление убирает его насовсем — клиенты, карты
          и их баланс остаются: они принадлежат платформе, а не заведению.
        </p>
        {suspend.isError && <ErrorState error={suspend.error} />}
        <div className="mt-4 flex flex-wrap gap-3">
          <ConfirmDialog
            trigger={
              <Button variant="outline" disabled={merchant.data.status === "suspended"}>
                {merchant.data.status === "suspended" ? "Уже приостановлено" : "Приостановить"}
              </Button>
            }
            title="Приостановить заведение?"
            description="Оно перестанет принимать бонусы. Это увидят все его сотрудники."
            confirmLabel="Приостановить"
            onConfirm={() => suspend.mutateAsync()}
          />
          <ConfirmDialog
            trigger={<Button variant="danger">Удалить заведение</Button>}
            title={`Удалить «${merchant.data.name}»?`}
            description="Заведение, его сотрудники, витрина и журнал исчезнут из кабинетов. Держатели карт ничего не потеряют. Отменить нельзя."
            confirmLabel="Удалить"
            onConfirm={async () => {
              await remove.mutateAsync(merchantId);
              navigate("/");
            }}
          />
        </div>
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
          По коду владелец регистрируется сам и сразу получает права на это заведение.
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
                {invite.usedAt ? `использован ${formatDateTime(invite.usedAt)}` : "не использован"}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
