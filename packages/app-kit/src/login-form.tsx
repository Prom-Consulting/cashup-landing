import {
  ApiError,
  loginInputSchema,
  otpLoginInputSchema,
  otpRequestInputSchema,
  type LoginInput,
  type OtpLoginInput,
} from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Field } from "@loal/ui/field";
import { Button, PhoneInput, Spinner, TextInput, OtpInput, PasswordInput } from "@loal/ui/inputs";
import { Form, Formik } from "formik";
import { useEffect, useState } from "react";
import { OtpChannelPicker, otpChannelErrorText, otpSentText, useOtpChannel } from "./otp-channel";
import { useLogin, useLoginByOtp, useRequestOtp } from "./session";

/** Одно понятное сообщение вместо технической ошибки шлюза. */
export function loginErrorText(error: unknown): string {
  const channel = otpChannelErrorText(error);
  if (channel) return channel;
  if (error instanceof ApiError) {
    if (error.code === "INVALID_CREDENTIALS") return "Неверный номер или пароль";
    if (error.code === "PASSWORD_LOCKED")
      return error.message || "Слишком много попыток. Войдите по коду или попробуйте через 15 минут.";
    // Коды шлюза; текст — запасной путь для шлюза, который ещё отвечал без кода
    if (error.code === "OTP_INVALID" || (error.status === 401 && /invalid otp/i.test(error.message)))
      return "Неверный код";
    if (error.code === "OTP_EXPIRED" || (error.status === 401 && /missing or expired/i.test(error.message)))
      return "Код истёк или уже использован — запросите новый";
    if (error.status === 401) return "Неверные данные для входа";
    if (error.code === "OTP_TOO_MANY_ATTEMPTS") return "Слишком много неверных попыток. Запросите новый код.";
    if (error.code === "OTP_UNAVAILABLE" || error.status === 503)
      return "Сервис кодов временно недоступен. Попробуйте через минуту.";
    if (error.isTooManyRequests)
      return error.retryAfter
        ? `Повторить можно через ${error.retryAfter} с`
        : "Слишком часто. Попробуйте через минуту";
    return error.message;
  }
  return error instanceof Error ? error.message : "Не удалось войти";
}

function ByPassword({ onDone }: { onDone?: () => void }) {
  const login = useLogin();
  const initialValues: LoginInput = { email: "", password: "" };

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
          applyServerIssues(error, helpers, loginErrorText(error));
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-6" noValidate>
          <FocusFirstError form={form} />
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
        </Form>
      )}
    </Formik>
  );
}

/** Код живёт 5 минут, повторить можно раз в минуту — отсюда обратный отсчёт. */
export function useCooldown() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);
  return { left, start: () => setLeft(60) };
}

function ByPhone({ onDone }: { onDone?: () => void }) {
  const requestOtp = useRequestOtp();
  const { channel, choose, telegramAvailable } = useOtpChannel();
  const loginByOtp = useLoginByOtp();
  const cooldown = useCooldown();
  const [sent, setSent] = useState(false);
  const initialValues: OtpLoginInput = { phone: "", otp: "" };

  return (
    <Formik
      initialValues={initialValues}
      // Пока код не запрошен, проверяем только телефон
      validate={zodValidate(sent ? otpLoginInputSchema : otpRequestInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          if (!sent) {
            await requestOtp.mutateAsync({ phone: values.phone, channel });
            setSent(true);
            helpers.setFieldTouched("otp", false, false);
            cooldown.start();
            helpers.setStatus(otpSentText(channel));
          } else {
            await loginByOtp.mutateAsync(values);
            onDone?.();
          }
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
          <Field
            label="Телефон"
            hint={telegramAvailable ? undefined : "Код придёт в WhatsApp"}
            error={fieldError(form, "phone")}
          >
            {(parts) => (
              <PhoneInput
                {...parts}
                value={form.values.phone}
                onValueChange={(value) => form.setFieldValue("phone", value)}
                onBlur={() => form.setFieldTouched("phone", true)}
              />
            )}
          </Field>

          <OtpChannelPicker
            channel={channel}
            onChange={choose}
            available={telegramAvailable}
            disabled={form.isSubmitting}
          />

          {sent && (
            <Field label="Код из сообщения" error={fieldError(form, "otp")}>
              {(parts) => (
                <OtpInput
                  {...parts}
                  value={form.values.otp}
                  onValueChange={(code) => form.setFieldValue("otp", code)}
                  onComplete={(code) => {
                    // Шестая цифра — сразу отправляем: кнопку жать незачем
                    void form.setFieldValue("otp", code, true).then(() => form.submitForm());
                  }}
                  onBlur={() => form.setFieldTouched("otp", true)}
                  autoFocus
                  disabled={form.isSubmitting}
                />
              )}
            </Field>
          )}

          {formError(form) && (
            <p role="status" className="text-base font-medium text-flame-ink">
              {formError(form)}
            </p>
          )}

          <Button type="submit" disabled={form.isSubmitting}>
            {form.isSubmitting ? <Spinner /> : sent ? "Войти" : "Получить код"}
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
                  form.setStatus(loginErrorText(error));
                }
              }}
              className="text-base text-slate underline-offset-4 hover:underline disabled:no-underline disabled:opacity-60"
            >
              {cooldown.left > 0 ? `Запросить код снова через ${cooldown.left} с` : "Запросить код снова"}
            </button>
          )}
        </Form>
      )}
    </Formik>
  );
}

const tabClass = (active: boolean) =>
  `rounded-full px-4 py-2 text-base transition-colors ${active ? "bg-graphite text-paper" : "text-slate hover:text-graphite"}`;

/**
 * Вход в кабинет двумя способами: почта с паролем и телефон с кодом. Оба отправляют
 * deviceId — у аккаунта одна активная сессия, вход с другого устройства гасит эту.
 */
export function LoginForm({
  onDone,
  defaultMode = "password",
  phoneOnly = false,
}: {
  onDone?: () => void;
  defaultMode?: "password" | "phone";
  /** Только телефон с кодом — у кассира филиала нет ни почты, ни пароля. */
  phoneOnly?: boolean;
}) {
  const [mode, setMode] = useState(phoneOnly ? "phone" : defaultMode);

  return (
    <div className="flex flex-col gap-6">

      {!phoneOnly && (
        <div className="flex gap-1" role="tablist" aria-label="Способ входа">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "password"}
            className={tabClass(mode === "password")}
            onClick={() => setMode("password")}
          >
            По почте
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "phone"}
            className={tabClass(mode === "phone")}
            onClick={() => setMode("phone")}
          >
            По телефону
          </button>
        </div>
      )}

      {mode === "password" ? <ByPassword onDone={onDone} /> : <ByPhone onDone={onDone} />}
    </div>
  );
}
