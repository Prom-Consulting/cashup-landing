import { ApiError, createMerchantInputSchema, type CreateMerchantInput } from "@loal/api";
import { fieldError, formError, zodValidate } from "@loal/forms";
import { Button, Input, Label } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useCreateMerchant } from "../../entities/merchant/api";

const initialValues: CreateMerchantInput = { slug: "", name: "", contactEmail: "", contactPhone: "" };

/** Новое заведение заводит платформа: slug попадает в адреса, поэтому только латиница. */
export function CreateMerchantForm({ onCreated }: { onCreated?: (merchantId: string) => void }) {
  const createMerchant = useCreateMerchant();

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(createMerchantInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          const merchant = await createMerchant.mutateAsync(values);
          helpers.resetForm();
          onCreated?.(merchant.id);
        } catch (error) {
          helpers.setStatus(
            error instanceof ApiError && error.isConflict
              ? "Заведение с таким адресом уже есть"
              : error instanceof Error
                ? error.message
                : "Не удалось создать заведение",
          );
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                name="name"
                className="mt-2"
                value={form.values.name}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                invalid={Boolean(fieldError(form, "name"))}
              />
              {fieldError(form, "name") && (
                <p className="mt-2 text-base text-destructive">{fieldError(form, "name")}</p>
              )}
            </div>
            <div>
              <Label htmlFor="slug">Адрес (slug)</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="dolce-vita"
                className="mt-2"
                value={form.values.slug}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                invalid={Boolean(fieldError(form, "slug"))}
              />
              {fieldError(form, "slug") && (
                <p className="mt-2 text-base text-destructive">{fieldError(form, "slug")}</p>
              )}
            </div>
            <div>
              <Label htmlFor="contactPhone">Телефон</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                className="mt-2"
                value={form.values.contactPhone ?? ""}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            </div>
            <div>
              <Label htmlFor="contactEmail">Почта</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                className="mt-2"
                value={form.values.contactEmail ?? ""}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                invalid={Boolean(fieldError(form, "contactEmail"))}
              />
              {fieldError(form, "contactEmail") && (
                <p className="mt-2 text-base text-destructive">{fieldError(form, "contactEmail")}</p>
              )}
            </div>
          </div>

          {formError(form) && (
            <p role="alert" className="text-base font-medium text-destructive">
              {formError(form)}
            </p>
          )}

          <Button type="submit" disabled={form.isSubmitting} className="self-start">
            {form.isSubmitting ? "Создаём…" : "Создать заведение"}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
