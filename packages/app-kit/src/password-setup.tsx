import { ApiError, passwordSetupInputSchema, type PasswordSetupInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Field } from "@loal/ui/field";
import { Button, PasswordInput, Spinner } from "@loal/ui/inputs";
import { Form, Formik } from "formik";
import { useSetupPassword } from "./session";

const initialValues: PasswordSetupInput = { newPassword: "", repeatPassword: "" };

/**
 * Свой пароль без текущего: впервые или вместо временного из WhatsApp. Сессия — доказательство,
 * что это вы. Когда пароль уже свой, сервер ответит 409 — тогда меняют через текущий.
 */
export function PasswordSetupForm({ onDone, submitLabel = "Сохранить пароль" }: { onDone?: () => void; submitLabel?: string }) {
  const setup = useSetupPassword();
  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(passwordSetupInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          await setup.mutateAsync(values.newPassword);
          helpers.resetForm();
          onDone?.();
        } catch (error) {
          applyServerIssues(
            error,
            helpers,
            error instanceof ApiError && error.code === "PASSWORD_ALREADY_SET"
              ? "Пароль уже задан — обновите страницу"
              : undefined,
          );
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-5" noValidate>
          <FocusFirstError form={form} />
          <Field label="Новый пароль" hint="Не короче 8 символов, не только цифры" error={fieldError(form, "newPassword")}>
            {(parts) => (
              <PasswordInput
                {...parts}
                name="newPassword"
                autoComplete="new-password"
                value={form.values.newPassword}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </Field>
          <Field label="Повторите пароль" error={fieldError(form, "repeatPassword")}>
            {(parts) => (
              <PasswordInput
                {...parts}
                name="repeatPassword"
                autoComplete="new-password"
                value={form.values.repeatPassword}
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
          <Button type="submit" disabled={form.isSubmitting} className="self-start">
            {form.isSubmitting ? <Spinner /> : submitLabel}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
