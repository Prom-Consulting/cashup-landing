import {
  ApiError,
  clientSignUpSchema,
  clientSignUpStartSchema,
  otpRequestInputSchema,
  passwordResetInputSchema,
  phonePasswordLoginInputSchema,
  toPhoneDigits,
  type ClientSignUpInput,
  type PasswordResetInput,
  type PhonePasswordLoginInput,
} from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Field } from "@loal/ui/field";
import { Button, OtpInput, PasswordInput, PhoneInput, Spinner } from "@loal/ui/inputs";
import { Form, Formik } from "formik";
import { useState } from "react";
import { ConsentNote } from "./legal";
import { loginErrorText, useCooldown } from "./login-form";
import { OtpChannelPicker, otpSentText, useOtpChannel } from "./otp-channel";
import {
  useLoginByPassword,
  useRegisterByPhone,
  useRequestOtp,
  useRequestPasswordCode,
  useResetPassword,
} from "./session";

type Done = (result: { isNewAccount: boolean; phone: string }) => void;

const linkClass = "self-start text-base text-flame-ink underline underline-offset-4 disabled:opacity-60";

function errorText(error: unknown): string {
  if (error instanceof ApiError && error.code === "ACCOUNT_NOT_FOUND")
    return "Этот номер не зарегистрирован в Loal. Проверьте номер или зарегистрируйтесь.";
  return loginErrorText(error);
}

// ── Вход: телефон + пароль ────────────────────────────────────────────────────
function SignIn({ onDone, onForgot }: { onDone?: Done; onForgot: (phone: string) => void }) {
  const login = useLoginByPassword();
  const initial: PhonePasswordLoginInput = { phone: "", password: "" };
  return (
    <Formik
      initialValues={initial}
      validate={zodValidate(phonePasswordLoginInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          await login.mutateAsync(values);
          onDone?.({ isNewAccount: false, phone: toPhoneDigits(values.phone) ?? values.phone });
        } catch (error) {
          applyServerIssues(error, helpers, errorText(error));
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
              <PhoneInput {...parts} value={form.values.phone} onValueChange={(v) => form.setFieldValue("phone", v)} onBlur={() => form.setFieldTouched("phone", true)} />
            )}
          </Field>
          <Field label="Пароль" error={fieldError(form, "password")}>
            {(parts) => (
              <PasswordInput {...parts} name="password" autoComplete="current-password" value={form.values.password} onChange={form.handleChange} onBlur={form.handleBlur} />
            )}
          </Field>
          {formError(form) && <p role="alert" className="text-base font-medium text-flame-ink">{formError(form)}</p>}
          <Button type="submit" disabled={form.isSubmitting}>{form.isSubmitting ? <Spinner /> : "Войти"}</Button>
          <button type="button" className={linkClass} onClick={() => onForgot(form.values.phone)}>Забыли пароль?</button>
        </Form>
      )}
    </Formik>
  );
}

// ── Регистрация: телефон + пароль → код → аккаунт с паролем ───────────────────
function SignUp({ onDone, referralCode, siteUrl }: { onDone?: Done; referralCode?: string; siteUrl?: string }) {
  const requestOtp = useRequestOtp();
  const register = useRegisterByPhone();
  const cooldown = useCooldown();
  const { channel, choose, telegramAvailable } = useOtpChannel();
  const [sent, setSent] = useState(false);
  const initial: ClientSignUpInput = { phone: "", password: "", repeatPassword: "", otp: "" };

  return (
    <Formik
      initialValues={initial}
      validate={zodValidate(sent ? clientSignUpSchema : clientSignUpStartSchema)}
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
            const tokens = await register.mutateAsync({ phone: values.phone, otp: values.otp, password: values.password, referralCode });
            onDone?.({ isNewAccount: tokens.isNewAccount === true, phone: toPhoneDigits(values.phone) ?? values.phone });
          }
        } catch (error) {
          applyServerIssues(error, helpers, errorText(error));
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
              <PhoneInput {...parts} value={form.values.phone} onValueChange={(v) => form.setFieldValue("phone", v)} onBlur={() => form.setFieldTouched("phone", true)} disabled={sent} />
            )}
          </Field>
          <Field label="Пароль" hint="Не короче 8 символов" error={fieldError(form, "password")}>
            {(parts) => (
              <PasswordInput {...parts} name="password" autoComplete="new-password" value={form.values.password} onChange={form.handleChange} onBlur={form.handleBlur} disabled={sent} />
            )}
          </Field>
          <Field label="Повторите пароль" error={fieldError(form, "repeatPassword")}>
            {(parts) => (
              <PasswordInput {...parts} name="repeatPassword" autoComplete="new-password" value={form.values.repeatPassword} onChange={form.handleChange} onBlur={form.handleBlur} disabled={sent} />
            )}
          </Field>
          <OtpChannelPicker channel={channel} onChange={choose} available={telegramAvailable} disabled={form.isSubmitting || sent} />
          {sent && (
            <Field label="Код из сообщения" error={fieldError(form, "otp")}>
              {(parts) => (
                <OtpInput {...parts} value={form.values.otp} onValueChange={(code) => form.setFieldValue("otp", code)} onBlur={() => form.setFieldTouched("otp", true)} autoFocus disabled={form.isSubmitting} />
              )}
            </Field>
          )}
          {formError(form) && <p role="status" className="text-base font-medium text-flame-ink">{formError(form)}</p>}
          <Button type="submit" disabled={form.isSubmitting}>{form.isSubmitting ? <Spinner /> : sent ? "Создать аккаунт" : "Получить код"}</Button>
          {siteUrl && <ConsentNote siteUrl={siteUrl} action={sent ? "Создать аккаунт" : "Получить код"} />}
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
                  form.setStatus(errorText(error));
                }
              }}
              className="self-start text-base text-slate underline-offset-4 hover:underline disabled:no-underline disabled:opacity-60"
            >
              {cooldown.left > 0 ? `Запросить код снова через ${cooldown.left} с` : "Запросить код снова"}
            </button>
          )}
        </Form>
      )}
    </Formik>
  );
}

// ── Забыли пароль: код на номер → новый пароль ────────────────────────────────
function Forgot({ phone, onDone, onBack }: { phone: string; onDone?: Done; onBack: () => void }) {
  const requestOtp = useRequestPasswordCode();
  const reset = useResetPassword();
  const cooldown = useCooldown();
  const { channel, choose, telegramAvailable } = useOtpChannel();
  const [sent, setSent] = useState(false);
  const initial: PasswordResetInput = { phone, otp: "", newPassword: "", repeatPassword: "" };

  return (
    <Formik
      initialValues={initial}
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
            onDone?.({ isNewAccount: false, phone: toPhoneDigits(values.phone) ?? values.phone });
          }
        } catch (error) {
          if (error instanceof ApiError && error.code === "ACCOUNT_NOT_FOUND") {
            helpers.setFieldTouched("phone", true, false);
            helpers.setFieldError("phone", errorText(error));
          } else {
            applyServerIssues(error, helpers, errorText(error));
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
              <PhoneInput {...parts} value={form.values.phone} onValueChange={(v) => form.setFieldValue("phone", v)} onBlur={() => form.setFieldTouched("phone", true)} disabled={sent} />
            )}
          </Field>
          <OtpChannelPicker channel={channel} onChange={choose} available={telegramAvailable} disabled={form.isSubmitting} />
          {sent && (
            <>
              <Field label="Код из сообщения" error={fieldError(form, "otp")}>
                {(parts) => (
                  <OtpInput {...parts} value={form.values.otp} onValueChange={(code) => form.setFieldValue("otp", code)} onBlur={() => form.setFieldTouched("otp", true)} autoFocus disabled={form.isSubmitting} />
                )}
              </Field>
              <Field label="Новый пароль" hint="Не короче 8 символов" error={fieldError(form, "newPassword")}>
                {(parts) => (
                  <PasswordInput {...parts} name="newPassword" autoComplete="new-password" value={form.values.newPassword} onChange={form.handleChange} onBlur={form.handleBlur} />
                )}
              </Field>
              <Field label="Повторите пароль" error={fieldError(form, "repeatPassword")}>
                {(parts) => (
                  <PasswordInput {...parts} name="repeatPassword" autoComplete="new-password" value={form.values.repeatPassword} onChange={form.handleChange} onBlur={form.handleBlur} />
                )}
              </Field>
            </>
          )}
          {formError(form) && <p role="status" className="text-base font-medium text-flame-ink">{formError(form)}</p>}
          <Button type="submit" disabled={form.isSubmitting}>{form.isSubmitting ? <Spinner /> : sent ? "Сохранить пароль и войти" : "Получить код"}</Button>
          <button type="button" className={linkClass} onClick={onBack}>← Назад ко входу</button>
        </Form>
      )}
    </Formik>
  );
}

const tabClass = (active: boolean) =>
  `rounded-full px-4 py-2 text-base transition-colors ${active ? "bg-graphite text-paper" : "text-slate hover:text-graphite"}`;

/**
 * Вход и регистрация клиента. Вход — телефон и пароль; регистрация — телефон,
 * пароль и код из сообщения; забыли пароль — код на номер и новый пароль.
 * `referralCode` (REF-01) уходит в регистрацию.
 */
export function ClientAuthForm({ onDone, referralCode, siteUrl }: { onDone?: Done; referralCode?: string; siteUrl?: string }) {
  // По приглашению человека ведём сразу на регистрацию — бонус достаётся новым.
  const [mode, setMode] = useState<{ kind: "signin" } | { kind: "signup" } | { kind: "forgot"; phone: string }>(
    referralCode ? { kind: "signup" } : { kind: "signin" },
  );

  return (
    <div className="flex flex-col gap-6">
      {mode.kind !== "forgot" && (
        <div className="flex gap-1" role="tablist" aria-label="Вход или регистрация">
          <button type="button" role="tab" aria-selected={mode.kind === "signin"} className={tabClass(mode.kind === "signin")} onClick={() => setMode({ kind: "signin" })}>
            Вход
          </button>
          <button type="button" role="tab" aria-selected={mode.kind === "signup"} className={tabClass(mode.kind === "signup")} onClick={() => setMode({ kind: "signup" })}>
            Регистрация
          </button>
        </div>
      )}
      {mode.kind === "signin" ? (
        <SignIn onDone={onDone} onForgot={(phone) => setMode({ kind: "forgot", phone })} />
      ) : mode.kind === "signup" ? (
        <SignUp onDone={onDone} referralCode={referralCode} siteUrl={siteUrl} />
      ) : (
        <>
          <p className="text-base text-slate">Пришлём код на номер — после него задайте новый пароль, и вы сразу внутри.</p>
          <Forgot phone={mode.phone} onDone={onDone} onBack={() => setMode({ kind: "signin" })} />
        </>
      )}
    </div>
  );
}
