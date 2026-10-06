import { editPromoBody, editPromoFormSchema, editPromoInitialValues, type PromoCode } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, Checkbox, Dialog, DialogContent, DialogTrigger, FormField, FormStatus, Input, Textarea } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useUpdatePromo } from "../../entities/promo/api";

export function EditPromoDialog({ promo }: { promo: PromoCode }) {
  const [open, setOpen] = useState(false);
  const update = useUpdatePromo();
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant="ghost" size="sm">Изменить</Button></DialogTrigger>
    <DialogContent title={`Промокод ${promo.code}`} description="Измените срок, лимит и заметку. Уже выданные месяцы сохранятся.">
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
