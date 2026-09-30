import { bonusItemInputSchema, type BonusItemInput, type Program } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, FormField, FormStatus, Input, NativeSelect, Switch, Textarea } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useUpdateBonusItem } from "../../entities/platform/api";

/**
 * Бонусный товар — наследие прежнего продукта: подарок на карте, считаемый
 * числом или выбираемый из списка. К подписке Loal отношения не имеет.
 */
export function BonusItemForm({ program }: { program: Program }) {
  const update = useUpdateBonusItem(program.id);
  const initialValues: BonusItemInput = {
    bonusItemEnabled: program.bonusItemEnabled ?? false,
    bonusItemName: program.bonusItemName ?? "",
    bonusItemMode: program.bonusItemMode ?? null,
    bonusItemOptions: (program.bonusItemOptions ?? []).join("\n"),
  };

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize
      validate={zodValidate(bonusItemInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          await update.mutateAsync(values);
          helpers.setStatus("Сохранено");
        } catch (error) {
          applyServerIssues(error, helpers, "Не удалось сохранить");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form noValidate className="flex flex-col gap-4">
          <FocusFirstError form={form} />
          <Switch
            checked={form.values.bonusItemEnabled}
            onCheckedChange={(checked) => form.setFieldValue("bonusItemEnabled", checked)}
            label="Бонусный товар включён"
          />
          {form.values.bonusItemEnabled && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Название" error={fieldError(form, "bonusItemName")}>
                  {(parts) => (
                    <Input
                      {...parts}
                      name="bonusItemName"
                      placeholder="Бесплатный кофе"
                      value={form.values.bonusItemName}
                      onChange={form.handleChange}
                      onBlur={form.handleBlur}
                    />
                  )}
                </FormField>
                <FormField label="Режим" error={fieldError(form, "bonusItemMode")}>
                  {(parts) => (
                    <NativeSelect
                      {...parts}
                      value={form.values.bonusItemMode ?? ""}
                      onChange={(event) => form.setFieldValue("bonusItemMode", event.target.value || null)}
                      placeholder="Выберите"
                      options={[
                        { value: "number", label: "Счётчик — сколько штук накоплено" },
                        { value: "text", label: "Список — что именно подарено" },
                      ]}
                    />
                  )}
                </FormField>
              </div>
              {form.values.bonusItemMode === "text" && (
                <FormField label="Варианты" hint="По одному на строку.">
                  {(parts) => (
                    <Textarea
                      {...parts}
                      name="bonusItemOptions"
                      value={form.values.bonusItemOptions}
                      onChange={form.handleChange}
                    />
                  )}
                </FormField>
              )}
            </>
          )}
          <FormStatus tone={form.status === "Сохранено" ? "success" : "error"} message={formError(form)} />
          <div>
            <Button type="submit" variant="outline" disabled={!form.dirty || form.isSubmitting}>
              Сохранить
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
