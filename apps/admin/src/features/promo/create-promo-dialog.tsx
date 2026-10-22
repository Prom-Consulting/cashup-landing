import { ApiError, PROMO_AUDIENCE_LABELS, PROMO_CLIENT_ELIGIBILITY_LABELS, PROMO_KIND_LABELS, createPromoFormSchema, type CreatePromoForm, type PromoAudience, type PromoKind } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, Dialog, DialogContent, FormField, FormStatus, Input, NativeSelect, Textarea } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useCreatePromo } from "../../entities/promo/api";

const initialValues: CreatePromoForm = {
  code: "",
  audience: "merchant",
  kind: "months",
  months: 1,
  cycleBalance: 10_000,
  clientEligibility: "all",
  maxUses: "",
  expiresAt: "",
  note: "",
};

/** Новый промокод. Код можно не придумывать — сервер выдаст LOAL-XXXXXX. */
export function CreatePromoDialog({ onCreated }: { onCreated?: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const create = useCreatePromo();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>Создать промокод</Button>
      <DialogContent
        title="Новый промокод"
        description="Код многоразовый: каждый магазин или клиент применяет его один раз."
      >
        <Formik
          initialValues={initialValues}
          validate={zodValidate(createPromoFormSchema)}
          onSubmit={async (values, helpers) => {
            helpers.setStatus(undefined);
            try {
              const promo = await create.mutateAsync(values);
              helpers.resetForm();
              setOpen(false);
              onCreated?.(promo.code);
            } catch (error) {
              if (error instanceof ApiError && error.status === 409)
                return helpers.setFieldError("code", "Такой код уже есть — придумайте другой");
              applyServerIssues(error, helpers, "Не удалось создать промокод");
            } finally {
              helpers.setSubmitting(false);
            }
          }}
        >
          {(form) => (
            <Form noValidate className="mt-5 flex flex-col gap-4">
              <FocusFirstError form={form} />
              <FormField label="Кому" error={fieldError(form, "audience")}>
                {(parts) => (
                  <NativeSelect
                    {...parts}
                    name="audience"
                    value={form.values.audience}
                    onChange={(event) => {
                      const audience = event.target.value as PromoAudience;
                      void form.setValues({
                        ...form.values,
                        audience,
                        ...(audience === "merchant" ? { kind: "months", clientEligibility: "all" } : {}),
                      });
                    }}
                    onBlur={form.handleBlur}
                    options={Object.entries(PROMO_AUDIENCE_LABELS).map(([value, label]) => ({
                      value,
                      label: value === "merchant" ? `${label} — подписка магазина` : `${label} — подписка карты`,
                    }))}
                  />
                )}
              </FormField>
              {form.values.audience === "client" && (
                <>
                  <FormField label="Вид промокода" error={fieldError(form, "kind")}>
                    {(parts) => (
                      <NativeSelect
                        {...parts}
                        name="kind"
                        value={form.values.kind}
                        onChange={(event) => {
                          const kind = event.target.value as PromoKind;
                          void form.setValues({
                            ...form.values,
                            kind,
                            ...(kind === "subscription_cycle" ? { months: 1, clientEligibility: "without_subscription" } : {}),
                          });
                        }}
                        onBlur={form.handleBlur}
                        options={Object.entries(PROMO_KIND_LABELS).map(([value, label]) => ({ value, label }))}
                      />
                    )}
                  </FormField>
                  <FormField
                    label="Доступность"
                    hint={form.values.clientEligibility === "without_subscription"
                      ? "Даже истёкшая, отменённая или бесплатная подписка считается предыдущей."
                      : undefined}
                    error={fieldError(form, "clientEligibility")}
                  >
                    {(parts) => form.values.kind === "subscription_cycle" ? (
                      <Textarea {...parts} name="clientEligibility" readOnly rows={2} className="resize-none" value={PROMO_CLIENT_ELIGIBILITY_LABELS.without_subscription} />
                    ) : (
                      <NativeSelect
                        {...parts}
                        name="clientEligibility"
                        value={form.values.clientEligibility}
                        onChange={form.handleChange}
                        onBlur={form.handleBlur}
                        options={Object.entries(PROMO_CLIENT_ELIGIBILITY_LABELS).map(([value, label]) => ({ value, label }))}
                      />
                    )}
                  </FormField>
                </>
              )}
              <FormField
                label="Код"
                hint="Латиница, цифры и дефис, 4–32 символа. Пусто — придумаем сами."
                error={fieldError(form, "code")}
              >
                {(parts) => (
                  <Input
                    {...parts}
                    name="code"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="SUMMER-2026"
                    className="font-mono uppercase"
                    value={form.values.code}
                    onChange={(event) => form.setFieldValue("code", event.target.value.toUpperCase())}
                    onBlur={form.handleBlur}
                  />
                )}
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                {form.values.kind === "subscription_cycle" ? (
                  <>
                    <FormField label="Срок" hint="Фиксированный срок подписки">
                      {(parts) => <Input {...parts} readOnly value="30 дней" />}
                    </FormField>
                    <FormField label="Количество баллов" hint="Обязательное положительное целое число" error={fieldError(form, "cycleBalance")}>
                      {(parts) => (
                        <Input
                          {...parts}
                          name="cycleBalance"
                          required
                          inputMode="numeric"
                          value={form.values.cycleBalance}
                          onChange={form.handleChange}
                          onBlur={form.handleBlur}
                        />
                      )}
                    </FormField>
                  </>
                ) : <FormField label="Бесплатных месяцев" hint="От 1 до 36" error={fieldError(form, "months")}>
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
                </FormField>}
                <FormField
                  label="Сколько раз можно применить"
                  hint="Пусто — без лимита"
                  error={fieldError(form, "maxUses")}
                >
                  {(parts) => (
                    <Input
                      {...parts}
                      name="maxUses"
                      inputMode="numeric"
                      value={String(form.values.maxUses)}
                      onChange={form.handleChange}
                      onBlur={form.handleBlur}
                    />
                  )}
                </FormField>
              </div>
              <FormField
                label="Действует до"
                hint="Включительно. Пусто — бессрочно"
                error={fieldError(form, "expiresAt")}
              >
                {(parts) => (
                  <Input
                    {...parts}
                    type="date"
                    name="expiresAt"
                    value={form.values.expiresAt}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </FormField>
              <FormField label="Заметка" hint="Видна только агентству" error={fieldError(form, "note")}>
                {(parts) => (
                  <Textarea
                    {...parts}
                    name="note"
                    rows={2}
                    placeholder="Летняя акция"
                    value={form.values.note}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </FormField>
              <FormStatus message={formError(form)} />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={form.isSubmitting}>
                  {form.isSubmitting ? "Создаём…" : "Создать промокод"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}
