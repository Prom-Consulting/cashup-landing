import { platformSettingsInputSchema, type PlatformSettingsInput } from "@loal/api";
import { fieldError, formError, zodValidate } from "@loal/forms";
import { Button, Card, ErrorState, Input, Label, Loading, PageHeader, Textarea } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useAuditLogs, usePlatformSettings, useSavePlatformSettings } from "../../entities/platform/api";
import { formatDateTime } from "../../shared/lib/format";

/** Текст «о компании» уходит на оборот каждой выпущенной карты. */
export function SettingsPage() {
  const settings = usePlatformSettings();
  const save = useSavePlatformSettings();
  const audit = useAuditLogs();

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Настройки платформы"
        description="Этот текст дописывается на оборот каждой карты — его видят все держатели."
      />

      {settings.isPending && <Loading rows={2} />}
      {settings.isError && <ErrorState error={settings.error} onRetry={() => settings.refetch()} />}

      {settings.isSuccess && (
        <Card>
          <Formik
            initialValues={
              {
                infoText: settings.data.infoText ?? "",
                infoUrl: settings.data.infoUrl ?? "",
              } as PlatformSettingsInput
            }
            validate={zodValidate(platformSettingsInputSchema)}
            onSubmit={async (values, helpers) => {
              helpers.setStatus(undefined);
              try {
                await save.mutateAsync(values);
                helpers.setStatus("Сохранено");
              } catch (error) {
                helpers.setStatus(error instanceof Error ? error.message : "Не удалось сохранить");
              } finally {
                helpers.setSubmitting(false);
              }
            }}
          >
            {(form) => (
              <Form className="flex flex-col gap-5" noValidate>
                <div>
                  <Label htmlFor="infoText">О компании</Label>
                  <Textarea
                    id="infoText"
                    name="infoText"
                    className="mt-2"
                    value={form.values.infoText}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    invalid={Boolean(fieldError(form, "infoText"))}
                  />
                  {fieldError(form, "infoText") && (
                    <p className="mt-2 text-base text-destructive">{fieldError(form, "infoText")}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="infoUrl">Ссылка</Label>
                  <Input
                    id="infoUrl"
                    name="infoUrl"
                    placeholder="https://loal.kg"
                    className="mt-2"
                    value={form.values.infoUrl}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    invalid={Boolean(fieldError(form, "infoUrl"))}
                  />
                  {fieldError(form, "infoUrl") && (
                    <p className="mt-2 text-base text-destructive">{fieldError(form, "infoUrl")}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Button type="submit" disabled={form.isSubmitting}>
                    {form.isSubmitting ? "Сохраняем…" : "Сохранить"}
                  </Button>
                  {formError(form) && (
                    <p role="status" className="text-base text-muted-foreground">
                      {formError(form)}
                    </p>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </Card>
      )}

      <Card>
        <h2 className="text-xl font-bold">Что делало агентство</h2>
        {audit.isPending && <Loading rows={2} />}
        {audit.isSuccess && audit.data.length === 0 && (
          <p className="mt-3 text-base text-muted-foreground">Записей пока нет.</p>
        )}
        <ul className="mt-4 flex flex-col gap-2">
          {(audit.data ?? []).slice(0, 30).map((entry) => (
            <li key={entry.id} className="flex flex-wrap justify-between gap-3 text-base">
              <span>
                {entry.action ?? "действие"}
                {entry.entity ? ` · ${entry.entity}` : ""}
              </span>
              <span className="text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
