import { ApiError, updateProfileInputSchema, type UpdateProfileInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, ErrorState, FormField, FormStatus, Input, Loading } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useProfile, useUpdateProfile } from "./session";

/** Имя и почта в кабинетах агентства и партнёра. Занятая почта — 409, ошибка у самого поля. */
export function ProfileForm() {
  const profile = useProfile();
  const update = useUpdateProfile();
  const [saved, setSaved] = useState(false);

  if (profile.isPending) return <Loading rows={2} />;
  if (profile.isError) return <ErrorState error={profile.error} onRetry={() => profile.refetch()} />;

  const initialValues: UpdateProfileInput = { fullName: profile.data.fullName ?? "", email: profile.data.email ?? "" };

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize
      validate={zodValidate(updateProfileInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        setSaved(false);
        try {
          await update.mutateAsync(values);
          await profile.refetch();
          setSaved(true);
        } catch (error) {
          if (error instanceof ApiError && error.status === 409)
            return helpers.setFieldError("email", "Эта почта уже используется другим аккаунтом");
          applyServerIssues(error, helpers, "Не удалось сохранить профиль");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="mt-5 flex flex-col gap-5" noValidate onChange={() => setSaved(false)}>
          <FocusFirstError form={form} />
          <FormField label="Имя" error={fieldError(form, "fullName")}>
            {(parts) => (
              <Input
                {...parts}
                name="fullName"
                autoComplete="name"
                value={form.values.fullName}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </FormField>
          <FormField label="Почта" hint="По ней вы входите в кабинет" error={fieldError(form, "email")}>
            {(parts) => (
              <Input
                {...parts}
                type="email"
                name="email"
                autoComplete="email"
                value={form.values.email}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </FormField>
          <FormStatus message={formError(form)} />
          <FormStatus tone="success" message={saved ? "Сохранено" : undefined} />
          <Button type="submit" disabled={form.isSubmitting || !form.dirty} className="self-start">
            {form.isSubmitting ? "Сохраняем…" : "Сохранить"}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
