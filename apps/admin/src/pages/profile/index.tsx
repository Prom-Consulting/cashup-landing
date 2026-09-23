import { ApiError, changePasswordInputSchema, type ChangePasswordInput, authApi } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { fieldError, formError, zodValidate } from "@loal/forms";
import { Field } from "@loal/ui/field";
import { Button, Input } from "@loal/ui/shadcn";
import { Card } from "@loal/ui/shadcn";
import { PageHeader } from "@loal/ui/page";
import { Form, Formik } from "formik";
import { useCurrentUser } from "../../entities/session/model";

const initialValues: ChangePasswordInput = { currentPassword: "", newPassword: "", repeatPassword: "" };

/** Профиль: кто вошёл и смена пароля. */
export function ProfilePage() {
  const api = useApi();
  const { session, label } = useCurrentUser();

  return (
    <section className="flex max-w-[560px] flex-col gap-6">
      <PageHeader title="Профиль" description={label} />

      <Card>
        <h2 className="text-xl font-bold">Доступ</h2>
        <p className="mt-2 text-lg text-muted-foreground">
          Роль: {session?.role === "super_admin" ? "администратор платформы" : (session?.role ?? "—")}
        </p>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">Смена пароля</h2>
        <Formik
          initialValues={initialValues}
          validate={zodValidate(changePasswordInputSchema)}
          onSubmit={async (values, helpers) => {
            helpers.setStatus(undefined);
            try {
              await authApi(api).changePassword(values);
              helpers.resetForm();
              helpers.setStatus("Пароль изменён");
            } catch (error) {
              helpers.setStatus(
                error instanceof ApiError && error.status === 400
                  ? "Текущий пароль не подошёл"
                  : error instanceof Error
                    ? error.message
                    : "Не удалось сменить пароль",
              );
            } finally {
              helpers.setSubmitting(false);
            }
          }}
        >
          {(form) => (
            <Form className="mt-5 flex flex-col gap-5" noValidate>
              <Field label="Текущий пароль" error={fieldError(form, "currentPassword")}>
                {(parts) => (
                  <Input
                    {...parts}
                    type="password"
                    name="currentPassword"
                    autoComplete="current-password"
                    value={form.values.currentPassword}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </Field>
              <Field label="Новый пароль" hint="Не короче 8 символов" error={fieldError(form, "newPassword")}>
                {(parts) => (
                  <Input
                    {...parts}
                    type="password"
                    name="newPassword"
                    autoComplete="new-password"
                    value={form.values.newPassword}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </Field>
              <Field label="Повторите новый пароль" error={fieldError(form, "repeatPassword")}>
                {(parts) => (
                  <Input
                    {...parts}
                    type="password"
                    name="repeatPassword"
                    autoComplete="new-password"
                    value={form.values.repeatPassword}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </Field>
              {formError(form) && (
                <p role="status" className="text-base font-medium text-destructive">
                  {formError(form)}
                </p>
              )}
              <Button type="submit" disabled={form.isSubmitting} className="self-start">
                {form.isSubmitting ? "Сохраняем…" : "Сохранить"}
              </Button>
            </Form>
          )}
        </Formik>
      </Card>
    </section>
  );
}
