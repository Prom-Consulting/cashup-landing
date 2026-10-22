import { PROMO_AUDIENCE_LABELS, PROMO_CLIENT_ELIGIBILITY_LABELS, PROMO_KIND_LABELS, editPromoBody, editPromoFormSchema, editPromoInitialValues, type PromoCode } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, Checkbox, Dialog, DialogContent, DialogTrigger, FormField, FormStatus, Input, NativeSelect, Textarea } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useUpdatePromo } from "../../entities/promo/api";

export function EditPromoDialog({ promo }: { promo: PromoCode }) {
  const [open, setOpen] = useState(false);
  const update = useUpdatePromo();
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant="ghost" size="sm">Изменить</Button></DialogTrigger>
    <DialogContent title={`Промокод ${promo.code}`} description="Измените срок действия кода, лимит и заметку. Уже выданные подписки и баллы сохранятся.">
      <Formik initialValues={editPromoInitialValues(promo)} enableReinitialize validate={zodValidate(editPromoFormSchema)}
        onSubmit={async (values, helpers) => {
          helpers.setStatus(undefined);
          try {
            await update.mutateAsync({ id: promo.id, input: editPromoBody(values, promo) });
            setOpen(false);
          } catch (error) { applyServerIssues(error, helpers, "Не удалось сохранить промокод"); }
          finally { helpers.setSubmitting(false); }
        }}>
        {(form) => <Form noValidate className="flex flex-col gap-4">
          <FocusFirstError form={form} />
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Кому</dt><dd>{PROMO_AUDIENCE_LABELS[promo.audience]}</dd>
            <dt className="text-muted-foreground">Вид</dt><dd>{PROMO_KIND_LABELS[promo.kind]}</dd>
            <dt className="text-muted-foreground">Срок подписки</dt><dd>{promo.kind === "subscription_cycle" ? "30 дней" : `${promo.months} мес.`}</dd>
            <dt className="text-muted-foreground">Количество баллов</dt><dd>{promo.cycleBalance == null ? "—" : new Intl.NumberFormat("ru-RU").format(promo.cycleBalance)}</dd>
          </dl>
          {promo.audience === "client" && (
            <FormField label="Доступность" error={fieldError(form, "clientEligibility")}
              hint={form.values.clientEligibility === "without_subscription" ? "Даже истёкшая, отменённая или бесплатная подписка считается предыдущей." : undefined}>
              {(parts) => promo.kind === "subscription_cycle" ? (
                <Textarea {...parts} name="clientEligibility" readOnly rows={2} className="resize-none" value={PROMO_CLIENT_ELIGIBILITY_LABELS.without_subscription} />
              ) : (
                <NativeSelect {...parts} name="clientEligibility" value={form.values.clientEligibility}
                  onChange={form.handleChange} onBlur={form.handleBlur}
                  options={Object.entries(PROMO_CLIENT_ELIGIBILITY_LABELS).map(([value, label]) => ({ value, label }))} />
              )}
            </FormField>
          )}
          <label className="flex items-center gap-2"><Checkbox name="active" checked={form.values.active} onChange={form.handleChange} />Промокод действует</label>
          <FormField label="Лимит использований" hint={`Уже применили: ${promo.uses}. Пусто — без лимита.`} error={fieldError(form, "maxUses")}>
            {(parts) => <Input {...parts} name="maxUses" inputMode="numeric" value={form.values.maxUses} onChange={form.handleChange} onBlur={form.handleBlur} />}
          </FormField>
          <FormField label="Действует до" hint="До конца выбранного дня. Пусто — бессрочно." error={fieldError(form, "expiresAt")}>
            {(parts) => <Input {...parts} type="date" name="expiresAt" value={form.values.expiresAt} onChange={form.handleChange} onBlur={form.handleBlur} />}
          </FormField>
          <FormField label="Заметка" hint="Видна только агентству" error={fieldError(form, "note")}>
            {(parts) => <Textarea {...parts} name="note" rows={2} value={form.values.note} onChange={form.handleChange} onBlur={form.handleBlur} />}
          </FormField>
          <FormStatus message={formError(form)} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Отмена</Button>
            <Button type="submit" disabled={form.isSubmitting}>{form.isSubmitting ? "Сохраняем…" : "Сохранить"}</Button>
          </div>
        </Form>}
      </Formik>
    </DialogContent>
  </Dialog>;
}
