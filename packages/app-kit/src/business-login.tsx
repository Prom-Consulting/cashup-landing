import {
  ApiError,
  otpRequestInputSchema,
  passwordResetInputSchema,
  phonePasswordLoginInputSchema,
  type PasswordResetInput,
  type PhonePasswordLoginInput,
} from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Field } from "@loal/ui/field";
import { Button, OtpInput, PasswordInput, PhoneInput, Spinner } from "@loal/ui/inputs";
import { Form, Formik } from "formik";
import { useState } from "react";
import { loginErrorText, useCooldown } from "./login-form";
import { OtpChannelPicker, otpSentText, useOtpChannel } from "./otp-channel";
import { useLoginByPassword, useRequestPasswordCode, useResetPassword } from "./session";

function resetErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "ACCOUNT_NOT_FOUND") return "Этот номер не работает ни в одном заведении Loal. Проверьте номер.";
    if (error.code === "NOT_BUSINESS_ACCOUNT")
      return "Этот номер не привязан к заведению. Попросите владельца добавить вас в команду.";
  }
  return loginErrorText(error);
}

const linkClass = "self-start text-base text-flame-ink underline underline-offset-4 disabled:opacity-60";

function ByPassword({ onDone, onForgot }: { onDone?: () => void; onForgot: (phone: string) => void }) {
  const login = useLoginByPassword();
  const initialValues: PhonePasswordLoginInput = { phone: "", password: "" };

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(phonePasswordLoginInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          await login.mutateAsync(values);
          onDone?.();
        } catch (error) {
          applyServerIssues(error, helpers, loginErrorText(error));
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-6" noValidate>
          <FocusFirstError form={form} />
          <Field label="Телефон" error={fieldError(form, "phone")}>
            {(parts) => (
              <PhoneInput
                {...parts}
                value={form.values.phone}
                onValueChange={(value) => form.setFieldValue("phone", value)}
                onBlur={() => form.setFieldTouched("phone", true)}
              />
            )}
          </Field>

          <Field label="Пароль" error={fieldError(form, "password")}>
            {(parts) => (
              <PasswordInput
                {...parts}
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

          <button type="button" className={linkClass} onClick={() => onForgot(form.values.phone)}>
            Нет пароля или забыли? Войти по коду
          </button>
        </Form>
      )}
    </Formik>
  );
}

/** Код на номер и сразу свой пароль: так же входят в первый раз, если временный не дошёл. */
function ByCode({ phone, onDone, onBack }: { phone: string; onDone?: () => void; onBack: () => void }) {
  const requestOtp = useRequestPasswordCode();
  const reset = useResetPassword();
  const cooldown = useCooldown();
  const { channel, choose, telegramAvailable } = useOtpChannel();
  const [sent, setSent] = useState(false);
  const initialValues: PasswordResetInput = { phone, otp: "", newPassword: "", repeatPassword: "" };

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(sent ? passwordResetInputSchema : otpRequestInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          if (!sent) {
            await requestOtp.mutateAsync({ phone: values.phone, channel });
            setSent(true);
            for (const field of ["otp", "newPassword", "repeatPassword"]) helpers.setFieldTouched(field, false, false);
            cooldown.start();
            helpers.setStatus(otpSentText(channel));
          } else {
            await reset.mutateAsync(values);
            onDone?.();
          }
        } catch (error) {
          // Номер не из заведения — это про поле «Телефон», и код при этом не отправлен
          if (error instanceof ApiError && (error.code === "ACCOUNT_NOT_FOUND" || error.code === "NOT_BUSINESS_ACCOUNT")) {
            helpers.setFieldTouched("phone", true, false);
            helpers.setFieldError("phone", resetErrorText(error));
          } else {
            applyServerIssues(error, helpers, resetErrorText(error));
          }
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-6" noValidate>
          <FocusFirstError form={form} />
          <Field label="Телефон" error={fieldError(form, "phone")}>
            {(parts) => (
              <PhoneInput
                {...parts}
                value={form.values.phone}
                onValueChange={(value) => form.setFieldValue("phone", value)}
                onBlur={() => form.setFieldTouched("phone", true)}
                disabled={sent}
              />
            )}
          </Field>

          <OtpChannelPicker channel={channel} onChange={choose} available={telegramAvailable} disabled={form.isSubmitting} />

          {sent && (
            <>
              <Field label="Код из сообщения" error={fieldError(form, "otp")}>
                {(parts) => (
                  <OtpInput
                    {...parts}
                    value={form.values.otp}
                    onValueChange={(code) => form.setFieldValue("otp", code)}
                    onBlur={() => form.setFieldTouched("otp", true)}
                    autoFocus
                    disabled={form.isSubmitting}
                  />
                )}
              </Field>
              <Field
                label="Новый пароль"
                hint="Не короче 8 символов, не только цифры"
                error={fieldError(form, "newPassword")}
              >
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
            </>
          )}

          {formError(form) && (
            <p role="status" className="text-base font-medium text-flame-ink">
              {formError(form)}
            </p>
          )}

          <Button type="submit" disabled={form.isSubmitting}>
            {form.isSubmitting ? <Spinner /> : sent ? "Сохранить пароль и войти" : "Получить код"}
          </Button>

          {sent && (
            <button
              type="button"
              disabled={cooldown.left > 0 || form.isSubmitting}
              onClick={async () => {
                form.setStatus(undefined);
                try {
                  await requestOtp.mutateAsync({ phone: form.values.phone, channel });
                  cooldown.start();
                  form.setStatus(otpSentText(channel, true));
                } catch (error) {
                  form.setStatus(resetErrorText(error));
                }
              }}
              className="self-start text-base text-slate underline-offset-4 hover:underline disabled:no-underline disabled:opacity-60"
            >
              {cooldown.left > 0 ? `Запросить код снова через ${cooldown.left} с` : "Запросить код снова"}
            </button>
          )}

          <button type="button" className={linkClass} onClick={onBack}>
            Войти по паролю
          </button>
        </Form>
      )}
    </Formik>
  );
}

/**
 * Вход в кабинет партнёра: номер и пароль. Нет пароля или забыли — код на номер и новый
 * пароль в той же форме, человек сразу внутри.
 */
export function BusinessLoginForm({ onDone }: { onDone?: () => void }) {
  const [mode, setMode] = useState<{ kind: "password" } | { kind: "code"; phone: string }>({ kind: "password" });
  // «Аккаунт открыт на другом устройстве» здесь не показываем: владелец заходит заново, а
  // плашка рядом с объявлением о паролях только пугала (решение владельца продукта).
  return (
    <div className="flex flex-col gap-6">
      {mode.kind === "password" ? (
        <ByPassword onDone={onDone} onForgot={(phone) => setMode({ kind: "code", phone })} />
      ) : (
        <>
          <p className="text-base text-slate">Пришлём код на номер — после него задайте пароль, и вы сразу в кабинете.</p>
          <ByCode phone={mode.phone} onDone={onDone} onBack={() => setMode({ kind: "password" })} />
        </>
      )}
    </div>
  );
}
