import { ApiError, loginInputSchema, type LoginInput } from "@loal/api";
import { useLogin } from "./session";
import { fieldError, formError, zodValidate } from "@loal/forms";
import { Field } from "@loal/ui/field";
import { Button, Spinner, TextInput } from "@loal/ui/inputs";
import { Formik, Form } from "formik";

const initialValues: LoginInput = { email: "", password: "" };

/**
 * Вход в кабинет. Проверка полей — той же схемой, что уходит на сервер;
 * ошибку ответа кладём в status формы, чтобы её не стёр следующий ввод.
 */
export function LoginForm({ onDone }: { onDone?: () => void }) {
  const login = useLogin();

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(loginInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          await login.mutateAsync(values);
          onDone?.();
        } catch (error) {
          const message =
            error instanceof ApiError && error.status === 401
              ? "Неверная почта или пароль"
              : error instanceof Error
                ? error.message
                : "Не удалось войти";
          helpers.setStatus(message);
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-6" noValidate>
          <Field label="Почта" error={fieldError(form, "email")}>
            {(parts) => (
              <TextInput
                {...parts}
                type="email"
                name="email"
                autoComplete="username"
                value={form.values.email}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </Field>

          <Field label="Пароль" error={fieldError(form, "password")}>
            {(parts) => (
              <TextInput
                {...parts}
                type="password"
                name="password"
                autoComplete="current-password"
                value={form.values.password}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </Field>

          {formError(form) && (
            <p role="alert" className="text-base font-medium text-flame-ink">
              {formError(form)}
            </p>
          )}

          <Button type="submit" disabled={form.isSubmitting}>
            {form.isSubmitting ? <Spinner /> : "Войти"}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
