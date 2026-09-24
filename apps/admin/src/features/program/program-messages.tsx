import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { appleRelevanceInputSchema, googleMessageInputSchema, type GoogleMessageInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, ConfirmDialog, FormField, FormStatus, Icon, Input, Textarea } from "@loal/ui/shadcn";
import { Form, Formik, getIn } from "formik";
import { useSendGoogleMessage, useSetAppleRelevance } from "../../entities/platform/api";

type RelevanceForm = {
  relevantDate: string;
  locations: { latitude: string; longitude: string; relevantText: string }[];
};

/**
 * Экран блокировки Apple: карта всплывает рядом с точкой или в нужное время.
 * Сервер прописывает это во все шаблоны программы и пушит обновление картам.
 */
export function AppleRelevanceForm({ programId }: { programId: string }) {
  const save = useSetAppleRelevance(programId);
  const initialValues: RelevanceForm = { relevantDate: "", locations: [] };

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate<RelevanceForm>(appleRelevanceInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          await save.mutateAsync({
            relevantDate: values.relevantDate ? new Date(values.relevantDate).toISOString() : undefined,
            locations: values.locations.map((location) => ({
              latitude: Number(location.latitude),
              longitude: Number(location.longitude),
              relevantText: location.relevantText || undefined,
            })),
          });
          helpers.setStatus("Обновление отправлено на карты");
        } catch (error) {
          applyServerIssues(error, helpers, "Не удалось отправить");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => {
        const at = (path: string) => {
          const error = getIn(form.errors, path);
          return form.submitCount > 0 || getIn(form.touched, path)
            ? typeof error === "string"
              ? error
              : undefined
            : undefined;
        };
        return (
          <Form noValidate className="flex flex-col gap-4">
            <FocusFirstError form={form} />
            <FormField
              label="Показать в момент"
              hint="Необязательно. На iOS 18.1 и новее Apple почти не учитывает время — надёжнее точки."
            >
              {(parts) => (
                <Input
                  {...parts}
                  type="datetime-local"
                  name="relevantDate"
                  className="max-w-[280px]"
                  value={form.values.relevantDate}
                  onChange={form.handleChange}
                />
              )}
            </FormField>
            <ol className="flex flex-col gap-3">
              {form.values.locations.map((location, index) => (
                <li
                  key={index}
                  className="grid gap-3 rounded-2xl border-2 border-border p-4 sm:grid-cols-[1fr_1fr_1.6fr_auto] sm:items-end"
                >
                  {(["latitude", "longitude"] as const).map((axis) => (
                    <FormField
                      key={axis}
                      label={axis === "latitude" ? "Широта" : "Долгота"}
                      error={at(`locations.${index}.${axis}`)}
                    >
                      {(parts) => (
                        <Input
                          {...parts}
                          name={`locations.${index}.${axis}`}
                          inputMode="decimal"
                          value={location[axis]}
                          onChange={form.handleChange}
                          onBlur={form.handleBlur}
                        />
                      )}
                    </FormField>
                  ))}
                  <FormField label="Текст" error={at(`locations.${index}.relevantText`)}>
                    {(parts) => (
                      <Input
                        {...parts}
                        name={`locations.${index}.relevantText`}
                        placeholder="Вы рядом с партнёром Loal"
                        value={location.relevantText}
                        onChange={form.handleChange}
                      />
                    )}
                  </FormField>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Убрать точку"
                    onClick={() =>
                      form.setFieldValue(
                        "locations",
                        form.values.locations.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <Icon icon={Delete02Icon} />
                  </Button>
                </li>
              ))}
            </ol>
            <FormStatus message={at("locations")} />
            <div className="flex flex-wrap gap-3">
              <Button
                variant="ghost"
                disabled={form.values.locations.length >= 10}
                onClick={() =>
                  form.setFieldValue("locations", [
                    ...form.values.locations,
                    { latitude: "42.8746", longitude: "74.5698", relevantText: "" },
                  ])
                }
              >
                <Icon icon={Add01Icon} />
                Точка ({form.values.locations.length} из 10)
              </Button>
              <ConfirmDialog
                trigger={<Button variant="outline">Применить ко всем картам</Button>}
                title="Обновить все карты программы?"
                tone="primary"
                description="Точки и время пропишутся во все шаблоны программы и заменят прежние. Карты у держателей обновятся сразу."
                confirmLabel="Применить"
                onConfirm={async () => {
                  const errors = await form.validateForm();
                  await form.submitForm();
                  if (Object.keys(errors).length > 0) throw new Error("Исправьте ошибки в форме.");
                }}
              />
            </div>
            <FormStatus
              tone={form.status === "Обновление отправлено на карты" ? "success" : "error"}
              message={formError(form)}
            />
          </Form>
        );
      }}
    </Formik>
  );
}

/** Текстовое сообщение держателям — Google умеет, Apple нет. */
export function GoogleMessageForm({ programId }: { programId: string }) {
  const send = useSendGoogleMessage(programId);
  const initialValues: GoogleMessageInput = { header: "", body: "" };

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(googleMessageInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          await send.mutateAsync(values);
          helpers.resetForm();
          helpers.setStatus("Сообщение отправлено");
        } catch (error) {
          applyServerIssues(error, helpers, "Не удалось отправить сообщение");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form noValidate className="flex flex-col gap-4">
          <FocusFirstError form={form} />
          <FormField label="Заголовок" hint={`${form.values.header.length} из 60`} error={fieldError(form, "header")}>
            {(parts) => (
              <Input
                {...parts}
                name="header"
                value={form.values.header}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </FormField>
          <FormField label="Текст" hint={`${form.values.body.length} из 200`} error={fieldError(form, "body")}>
            {(parts) => (
              <Textarea
                {...parts}
                name="body"
                value={form.values.body}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </FormField>
          <FormStatus tone={form.status === "Сообщение отправлено" ? "success" : "error"} message={formError(form)} />
          <div>
            <ConfirmDialog
              trigger={<Button variant="outline">Отправить</Button>}
              title="Отправить сообщение?"
              tone="primary"
              description="Его получат все держатели карты в Google Wallet. Владельцы iPhone его не увидят — у Apple такой возможности нет."
              confirmLabel="Отправить"
              onConfirm={async () => {
                const errors = await form.validateForm();
                await form.submitForm();
                if (Object.keys(errors).length > 0) throw new Error("Заполните заголовок и текст.");
              }}
            />
          </div>
        </Form>
      )}
    </Formik>
  );
}
