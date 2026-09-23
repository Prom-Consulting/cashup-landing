import { ApiError, authApi, registerInputSchema, type RegisterInput } from "@loal/api";
import { fieldError, formError, zodValidate } from "@loal/forms";
import { Field } from "@loal/ui/field";
import { Button, PhoneInput, Spinner, TextInput } from "@loal/ui/inputs";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useRequestOtp, useSession } from "./session";

const initialValues: RegisterInput = { fullName: "", email: "", password: "", phone: "", otp: "", inviteCode: "" };

/** Телефон подтверждаем до заполнения остального: код одноразовый и живёт 5 минут. */
const phoneOnlySchema = registerInputSchema.pick({ phone: true });

function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return "Такая почта или телефон уже зарегистрированы";
    if (error.status === 401) return "Код неверный или истёк";
    return error.message;
  }
  return error instanceof Error ? error.message : "Не удалось зарегистрироваться";
}

/**
 * Регистрация владельца заведения по коду приглашения. Без кода платформа заводит
 * обычного сотрудника без доступа к кабинету, поэтому код здесь обязателен.
 */
export function RegisterForm({ onDone }: { onDone?: () => void }) {
  const { api, signIn } = useSession();
  const requestOtp = useRequestOtp();
  const [codeSent, setCodeSent] = useState(false);

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(codeSent ? registerInputSchema : phoneOnlySchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          if (!codeSent) {
            await requestOtp.mutateAsync({ phone: values.phone });
            setCodeSent(true);
            helpers.setStatus("Код отправлен в WhatsApp");
            return;
          }
          const tokens = await authApi(api).register(values);
          await signIn(tokens.accessToken);
          onDone?.();
        } catch (error) {
          helpers.setStatus(errorText(error));
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-5" noValidate>
          <Field label="Телефон" hint="На него придёт код в WhatsApp" error={fieldError(form, "phone")}>
            {(parts) => (
              <PhoneInput
                {...parts}
                value={form.values.phone}
                onValueChange={(value) => form.setFieldValue("phone", value)}
                onBlur={() => form.setFieldTouched("phone", true)}
              />
            )}
          </Field>

          {codeSent && (
            <>
              <Field label="Код из сообщения" error={fieldError(form, "otp")}>
                {(parts) => (
                  <TextInput
                    {...parts}
                    name="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={form.values.otp}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </Field>

              <Field
                label="Код приглашения"
                hint="Его выдаёт Loal при подключении"
                error={fieldError(form, "inviteCode")}
              >
                {(parts) => (
                  <TextInput
                    {...parts}
                    name="inviteCode"
                    value={form.values.inviteCode ?? ""}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </Field>

              <Field label="Имя и фамилия" error={fieldError(form, "fullName")}>
                {(parts) => (
                  <TextInput
                    {...parts}
                    name="fullName"
                    autoComplete="name"
                    value={form.values.fullName}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </Field>

              <Field label="Почта" error={fieldError(form, "email")}>
                {(parts) => (
                  <TextInput
                    {...parts}
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={form.values.email}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </Field>

              <Field label="Пароль" hint="Не короче 8 символов" error={fieldError(form, "password")}>
                {(parts) => (
                  <TextInput
                    {...parts}
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    value={form.values.password}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </Field>
            </>
          )}

          {formError(form) && (
            <p role="status" className="text-base font-medium text-flame-ink">
              {formError(form)}
            </p>
          )}

          <Button type="submit" disabled={form.isSubmitting}>
            {form.isSubmitting ? <Spinner /> : codeSent ? "Зарегистрироваться" : "Получить код"}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
