import { ApiError, PROMO_AUDIENCE_LABELS, createPromoFormSchema, type CreatePromoForm } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, Dialog, DialogContent, FormField, FormStatus, Input, NativeSelect, Textarea } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useCreatePromo } from "../../entities/promo/api";

const initialValues: CreatePromoForm = {
  code: "",
  audience: "merchant",
  months: 1,
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
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    options={Object.entries(PROMO_AUDIENCE_LABELS).map(([value, label]) => ({
                      value,
                      label: value === "merchant" ? `${label} — подписка магазина` : `${label} — подписка карты`,
                    }))}
                  />
                )}
              </FormField>
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
                <FormField label="Бесплатных месяцев" hint="От 1 до 36" error={fieldError(form, "months")}>
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
