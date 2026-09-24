import { Delete02Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { TIER_REWARD_LABELS, tierFormValues, tierInputSchema, type Tier, type TierInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  FormField,
  FormStatus,
  Icon,
  Input,
  Loading,
  NativeSelect,
} from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useCreateTier, useDeleteTier, useTiers, useUpdateTier } from "../../entities/platform/api";

const money = new Intl.NumberFormat("ru-RU");

function TierForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: TierInput;
  submitLabel: string;
  onSubmit: (values: TierInput) => Promise<unknown>;
  onCancel?: () => void;
}) {
  return (
    <Formik
      initialValues={initial}
      validate={zodValidate<TierInput>(tierInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          await onSubmit(values);
          helpers.resetForm();
        } catch (error) {
          applyServerIssues(error, helpers, "Не удалось сохранить уровень");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => {
        const number = (name: keyof TierInput, label: string, hint?: string) => (
          <FormField label={label} hint={hint} error={fieldError(form, name)}>
            {(parts) => (
              <Input
                {...parts}
                name={name}
                inputMode="decimal"
                className="tabular-nums"
                value={String(form.values[name])}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </FormField>
        );
        return (
          <Form noValidate className="flex flex-col gap-4 rounded-2xl bg-muted p-4">
            <FocusFirstError form={form} />
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Уровень" error={fieldError(form, "name")}>
                {(parts) => (
                  <Input
                    {...parts}
                    name="name"
                    value={form.values.name}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </FormField>
              {number("threshold", "Порог покупок, сом", "По накопленной сумме, не по балансу")}
              {number("sortOrder", "Порядок")}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {number("earnPercent", "Начисление, %", "Пусто — как у программы")}
              <FormField label="Награда" error={fieldError(form, "rewardType")}>
                {(parts) => (
                  <NativeSelect
                    {...parts}
                    name="rewardType"
                    value={form.values.rewardType}
                    onChange={form.handleChange}
                    placeholder="Без награды"
                    options={Object.entries(TIER_REWARD_LABELS).map(([value, label]) => ({ value, label }))}
                  />
                )}
              </FormField>
              {number("rewardValue", "Размер награды")}
            </div>
            <FormStatus message={formError(form)} />
            <div className="flex gap-3">
              <Button type="submit" variant="outline" disabled={form.isSubmitting}>
                {submitLabel}
              </Button>
              {onCancel && (
                <Button variant="ghost" onClick={onCancel}>
                  Отмена
                </Button>
              )}
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}

function describe(tier: Tier) {
  const parts = [`от ${money.format(tier.threshold ?? 0)} сом покупок`];
  if (tier.earnPercent != null) parts.push(`начисление ${tier.earnPercent}%`);
  if (tier.rewardType && tier.rewardValue != null)
    parts.push(
      tier.rewardType === "fixed_discount_percent"
        ? `скидка ${tier.rewardValue}%`
        : `скидка ${money.format(tier.rewardValue)} сом`,
    );
  return parts.join(" · ");
}

/** Уровни программы: порог по накопленной сумме покупок, свой процент и награда. */
export function TierList({ programId }: { programId: string }) {
  const tiers = useTiers(programId);
  const create = useCreateTier(programId);
  const update = useUpdateTier(programId);
  const remove = useDeleteTier(programId);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {tiers.isPending && <Loading rows={2} />}
      {tiers.isSuccess && tiers.data.length === 0 && (
        <EmptyState
          title="Уровней нет"
          description="У подписки Loal они не обязательны: все держатели получают одинаково."
        />
      )}
      <ul className="flex flex-col gap-3">
        {(tiers.data ?? []).map((tier) =>
          editing === tier.id ? (
            <li key={tier.id}>
              <TierForm
                initial={tierFormValues(tier)}
                submitLabel="Сохранить уровень"
                onSubmit={async (input) => {
                  await update.mutateAsync({ tierId: tier.id, input });
                  setEditing(null);
                }}
                onCancel={() => setEditing(null)}
              />
            </li>
          ) : (
            <li
              key={tier.id}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 first:border-t-0"
            >
              <span>
                <span className="text-lg font-medium">{tier.name}</span>
                <span className="block text-sm text-muted-foreground">{describe(tier)}</span>
              </span>
              <span className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Изменить уровень ${tier.name}`}
                  onClick={() => setEditing(tier.id)}
                >
                  <Icon icon={PencilEdit02Icon} />
                </Button>
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="icon" aria-label={`Убрать уровень ${tier.name}`}>
                      <Icon icon={Delete02Icon} />
                    </Button>
                  }
                  title={`Убрать уровень «${tier.name}»?`}
                  description="Держатели на этом уровне опустятся на ближайший ниже."
                  confirmLabel="Убрать"
                  onConfirm={() => remove.mutateAsync(tier.id)}
                />
              </span>
            </li>
          ),
        )}
      </ul>
      <TierForm
        initial={tierFormValues()}
        submitLabel="Добавить уровень"
        onSubmit={(input) => create.mutateAsync(input)}
      />
    </div>
  );
}
