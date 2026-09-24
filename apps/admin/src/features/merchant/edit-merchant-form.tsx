import {
  WORKFLOW_STATUS_LABELS,
  WORKFLOW_STATUS_ORDER,
  updateMerchantInputSchema,
  type Merchant,
  type UpdateMerchantInput,
} from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, FormField, FormStatus, Input, NativeSelect } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useUpdateMerchant } from "../../entities/merchant/api";

/** Реквизиты заведения глазами агентства: название, контакты и стадия подключения. */
export function EditMerchantForm({ merchant }: { merchant: Merchant }) {
  const update = useUpdateMerchant(merchant.id);
  const [saved, setSaved] = useState(false);
  const initialValues: UpdateMerchantInput = {
    name: merchant.name,
    contactEmail: merchant.contactEmail ?? "",
    contactPhone: merchant.contactPhone ?? "",
    workflowStatus: merchant.workflowStatus,
  };

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize
      validate={zodValidate(updateMerchantInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        setSaved(false);
        try {
          await update.mutateAsync(values);
          setSaved(true);
        } catch (error) {
          applyServerIssues(error, helpers, "Не удалось сохранить реквизиты");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form noValidate className="flex flex-col gap-4">
          <FocusFirstError form={form} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Название" error={fieldError(form, "name")}>
              {(parts) => (
                <Input
                  {...parts}
                  name="name"
                  value={form.values.name ?? ""}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              )}
            </FormField>
            <FormField label="Стадия подключения" error={fieldError(form, "workflowStatus")}>
              {(parts) => (
                <NativeSelect
                  {...parts}
                  name="workflowStatus"
                  value={form.values.workflowStatus ?? ""}
                  onChange={form.handleChange}
                  options={WORKFLOW_STATUS_ORDER.map((status) => ({
                    value: status,
                    label: WORKFLOW_STATUS_LABELS[status],
                  }))}
                />
              )}
            </FormField>
            <FormField label="Почта" error={fieldError(form, "contactEmail")}>
              {(parts) => (
                <Input
                  {...parts}
                  type="email"
                  name="contactEmail"
                  value={form.values.contactEmail ?? ""}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              )}
            </FormField>
            <FormField label="Телефон" error={fieldError(form, "contactPhone")}>
              {(parts) => (
                <Input
                  {...parts}
                  type="tel"
                  name="contactPhone"
                  value={form.values.contactPhone ?? ""}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              )}
            </FormField>
          </div>
          <FormStatus message={formError(form)} />
          {saved && !form.dirty && <FormStatus tone="success" message="Сохранено" />}
          <div>
            <Button type="submit" variant="outline" disabled={!form.dirty || form.isSubmitting}>
              Сохранить реквизиты
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
