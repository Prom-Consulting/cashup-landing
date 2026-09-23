import { ApiError, createStoreInputSchema, storeKindSchema, type CreateStoreInput } from "@loal/api";
import { fieldError, formError, zodValidate } from "@loal/forms";
import { Field } from "@loal/ui/field";
import { Button } from "@loal/ui/shadcn";
import { TextInput } from "@loal/ui/inputs";
import { Select } from "@loal/ui/select";
import { Form, Formik } from "formik";
import { useCreateStore } from "../../entities/store/api";

const kindOptions = [
  { id: storeKindSchema.enum.merchant, label: "Принимает карты" },
  { id: storeKindSchema.enum.issuer, label: "Выпускает карты" },
];

const initialValues: CreateStoreInput = { slug: "", name: "", kind: "merchant", contactEmail: "", contactPhone: "" };

/** Новый магазин заводит платформа: slug попадает в адреса, поэтому только латиница. */
export function CreateStoreForm({ onCreated }: { onCreated?: (storeId: string) => void }) {
  const createStore = useCreateStore();

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(createStoreInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          const store = await createStore.mutateAsync(values);
          helpers.resetForm();
          onCreated?.(store.id);
        } catch (error) {
          helpers.setStatus(
            error instanceof ApiError && error.isConflict
              ? "Магазин с таким адресом уже есть"
              : error instanceof Error
                ? error.message
                : "Не удалось создать магазин",
          );
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Название" error={fieldError(form, "name")}>
              {(parts) => (
                <TextInput
                  {...parts}
                  name="name"
                  value={form.values.name}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              )}
            </Field>
            <Field label="Адрес (slug)" hint="Латиница, цифры и дефис" error={fieldError(form, "slug")}>
              {(parts) => (
                <TextInput
                  {...parts}
                  name="slug"
                  value={form.values.slug}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              )}
            </Field>
            <Field label="Роль магазина" error={fieldError(form, "kind")}>
              {(parts) => (
                <Select
                  {...parts}
                  value={form.values.kind}
                  options={kindOptions}
                  onChange={(value) => form.setFieldValue("kind", value)}
                />
              )}
            </Field>
            <Field label="Телефон" optional error={fieldError(form, "contactPhone")}>
              {(parts) => (
                <TextInput
                  {...parts}
                  name="contactPhone"
                  value={form.values.contactPhone ?? ""}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              )}
            </Field>
            <Field label="Почта" optional error={fieldError(form, "contactEmail")}>
              {(parts) => (
                <TextInput
                  {...parts}
                  type="email"
                  name="contactEmail"
                  value={form.values.contactEmail ?? ""}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              )}
            </Field>
          </div>

          {formError(form) && (
            <p role="alert" className="text-base font-medium text-flame-ink">
              {formError(form)}
            </p>
          )}

          <Button type="submit" disabled={form.isSubmitting} className="self-start">
            {form.isSubmitting ? "Создаём…" : "Создать магазин"}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
