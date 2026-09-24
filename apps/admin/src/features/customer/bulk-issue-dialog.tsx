import { bulkIssueInputSchema, type BulkIssueInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, Dialog, DialogContent, DialogTrigger, FormField, FormStatus, NativeSelect } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useIssueCardsBulk, usePrograms, useTemplates } from "../../entities/platform/api";

/** Выдать выбранным клиентам карту одного вида — одним запросом. */
export function BulkIssueDialog({ customerIds, onDone }: { customerIds: string[]; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const templates = useTemplates();
  const programs = usePrograms();
  const issue = useIssueCardsBulk();
  const published = (templates.data ?? []).filter((template) => template.status === "published");
  const fallback = published.find((template) => template.isDefault) ?? published[0];
  const initialValues: BulkIssueInput = {
    customerIds,
    templateId: fallback?.id ?? "",
    programId: fallback?.programId ?? "",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={customerIds.length === 0}>
          Выдать карты выбранным ({customerIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Выдать карты"
        description={`Получат ${customerIds.length}. У кого карта уже есть, она будет отозвана, а баланс переедет на новую.`}
      >
        <Formik
          initialValues={initialValues}
          enableReinitialize
          validate={zodValidate(bulkIssueInputSchema)}
          onSubmit={async (values, helpers) => {
            helpers.setStatus(undefined);
            try {
              await issue.mutateAsync(values);
              setOpen(false);
              onDone();
            } catch (error) {
              applyServerIssues(error, helpers, "Не удалось выдать карты");
            } finally {
              helpers.setSubmitting(false);
            }
          }}
        >
          {(form) => (
            <Form noValidate className="flex flex-col gap-4">
              <FocusFirstError form={form} />
              <FormField
                label="Карта"
                hint="Только опубликованные: по черновику выдать нельзя."
                error={fieldError(form, "templateId")}
              >
                {(parts) => (
                  <NativeSelect
                    {...parts}
                    name="templateId"
                    value={form.values.templateId}
                    onChange={(event) => {
                      const chosen = published.find((template) => template.id === event.target.value);
                      form.setFieldValue("templateId", event.target.value);
                      if (chosen?.programId) form.setFieldValue("programId", chosen.programId);
                    }}
                    placeholder="Выберите карту"
                    options={published.map((template) => ({
                      value: template.id,
                      label: `${template.name}${template.isDefault ? " — карта платформы" : ""}`,
                    }))}
                  />
                )}
              </FormField>
              <FormField label="Программа" error={fieldError(form, "programId")}>
                {(parts) => (
                  <NativeSelect
                    {...parts}
                    name="programId"
                    value={form.values.programId}
                    onChange={form.handleChange}
                    placeholder="Выберите программу"
                    options={(programs.data ?? []).map((program) => ({ value: program.id, label: program.name }))}
                  />
                )}
              </FormField>
              <FormStatus
                message={
                  formError(form) ?? (typeof form.errors.customerIds === "string" ? form.errors.customerIds : undefined)
                }
              />
              <Button type="submit" disabled={form.isSubmitting}>
                {form.isSubmitting ? "Выдаём…" : "Выдать"}
              </Button>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}
