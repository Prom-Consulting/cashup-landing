import { ApiError, otpLoginInputSchema, otpRequestInputSchema, toPhoneDigits, type OtpLoginInput } from "@loal/api";
import { FocusFirstError, fieldError, zodValidate } from "@loal/forms";
import { Field } from "@loal/ui/field";
import { Button, OtpInput, PhoneInput, Spinner } from "@loal/ui/inputs";
import { Form, Formik, type FormikHelpers } from "formik";
import { useEffect, useState } from "react";
import { useLoginByOtp, useRegisterByPhone, useRequestOtp, useSession } from "./session";

type Step = "phone" | "code";

const isSpentCode = (error: unknown) =>
  error instanceof ApiError && error.status === 401 && /missing or expired/i.test(error.message);
const isWrongCode = (error: unknown) =>
  error instanceof ApiError && error.status === 401 && /invalid otp/i.test(error.message);

function readable(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isTooManyRequests)
      return /attempts/i.test(error.message)
        ? "Слишком много неверных попыток. Запросите новый код."
        : error.message.replace(/^Try again in (\d+) seconds$/i, "Повторить можно через $1 с");
    if (isSpentCode(error)) return "Код истёк или уже использован. Запросите новый.";
    // 503 — недоступно хранилище кодов (или WhatsApp): это не «неверный код», а временный сбой
    if (error.status === 503) return "Сервис кодов временно недоступен. Попробуйте через минуту.";
    if (error.status === 502) return "WhatsApp сейчас не отвечает. Попробуйте через минуту.";
    return error.message;
  }
  return error instanceof Error ? error.message : "Не получилось, попробуйте ещё раз";
}

/** Повтор кода не чаще раза в минуту — отсюда обратный отсчёт. */
function useCooldown() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);
  return { left, start: () => setLeft(60) };
}

/**
 * Вход и регистрация клиента в одном потоке: телефон → код из WhatsApp → внутри.
 * Код проверяется один раз, а войти или создать аккаунт решает сервер: в ответе
 * isNewAccount. Человеку не нужно знать, заходил ли он раньше.
 */
export function PhoneSignInForm({
  onDone,
  referralCode,
  onReferralRejected,
}: {
  /** phone — номер, с которым вошли, цифрами с кодом страны: кабинет может его запомнить. */
  onDone?: (result: { isNewAccount: boolean; phone: string }) => void;
  /** REF-01: пришли по приглашению — регистрируемся с кодом (известный номер просто войдёт). */
  referralCode?: string;
  /** Приглашение не приняли (404 — недействительно, 409 — своё же): кабинет забывает код. */
  onReferralRejected?: () => void;
}) {
  const requestOtp = useRequestOtp();
  const loginByOtp = useLoginByOtp();
  const registerByPhone = useRegisterByPhone();
  const { endedReason } = useSession();
  const cooldown = useCooldown();
  const [step, setStep] = useState<Step>("phone");
  const [notice, setNotice] = useState<string | null>(null);
  const initialValues: OtpLoginInput = { phone: "", otp: "" };

  /** Новый код — чистое поле: без красной ошибки, пока человек ничего не ввёл. */
  const clearCode = (
    helpers: Pick<FormikHelpers<OtpLoginInput>, "setFieldValue" | "setFieldTouched" | "setFieldError">,
  ) => {
    helpers.setFieldValue("otp", "", false);
    helpers.setFieldTouched("otp", false, false);
    helpers.setFieldError("otp", undefined);
    // Курсор — в первую клетку: следующий код вводят сразу
    requestAnimationFrame(() => document.querySelector<HTMLInputElement>('input[name="otp"]')?.focus());
  };

  const sendCode = async (phone: string) => {
    await requestOtp.mutateAsync({ phone });
    cooldown.start();
  };

  const submitCode = async (values: OtpLoginInput, helpers: FormikHelpers<OtpLoginInput>) => {
    try {
      const tokens = referralCode
        ? await registerByPhone.mutateAsync({ ...values, referralCode })
        : await loginByOtp.mutateAsync(values);
      onDone?.({ isNewAccount: tokens.isNewAccount === true, phone: toPhoneDigits(values.phone) ?? values.phone });
    } catch (error) {
      if (isWrongCode(error)) return helpers.setFieldError("otp", "Неверный код");
      // Приглашение не приняли — говорим почему и даём продолжить без него
      if (referralCode && error instanceof ApiError && (error.status === 404 || error.status === 409)) {
        onReferralRejected?.();
        return helpers.setStatus(
          error.status === 409
            ? "Это ваше собственное приглашение — по нему можно звать друзей. Нажмите «Войти» ещё раз, чтобы войти как обычно."
            : "Приглашение больше не действует. Нажмите «Войти» ещё раз — войдём без него.",
        );
      }
      if (isSpentCode(error)) {
        clearCode(helpers);
        return helpers.setStatus("Код истёк или уже использован. Запросите новый.");
      }
      helpers.setStatus(readable(error));
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(step === "phone" ? otpRequestInputSchema : otpLoginInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          if (step === "phone") {
            await sendCode(values.phone);
            setStep("code");
            // Отправка телефона отметила все поля тронутыми — код ещё не вводили, ошибку не показываем
            helpers.setFieldTouched("otp", false, false);
            setNotice("Отправили код в WhatsApp.");
          } else {
            await submitCode(values, helpers);
          }
        } catch (error) {
          helpers.setStatus(readable(error));
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-6" noValidate>
          <FocusFirstError form={form} />
          {endedReason && (
            <p role="alert" className="rounded-2xl bg-cream px-4 py-3 text-base">
              {endedReason}
            </p>
          )}

          <Field
            label="Телефон"
            hint={
              step === "phone" ? "Пришлём код в WhatsApp. Если вы у нас впервые — просто зарегистрируем." : undefined
            }
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

          {step === "code" && (
            <Field label="Код из WhatsApp" error={fieldError(form, "otp")}>
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

          {notice && !form.status && (
            <p role="status" className="text-base text-muted-foreground">
              {notice}
            </p>
          )}
          {typeof form.status === "string" && (
            <p role="alert" className="text-base font-medium text-flame-ink">
              {form.status}
            </p>
          )}

          <Button type="submit" disabled={form.isSubmitting}>
            {form.isSubmitting ? <Spinner /> : step === "phone" ? "Получить код" : "Войти"}
          </Button>

          {step === "code" && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={cooldown.left > 0 || form.isSubmitting}
                onClick={async () => {
                  form.setStatus(undefined);
                  try {
                    await sendCode(form.values.phone);
                    setNotice("Отправили код ещё раз.");
                  } catch (error) {
                    form.setStatus(readable(error));
                  }
                }}
                className="text-base text-slate underline-offset-4 hover:underline disabled:no-underline disabled:opacity-60"
              >
                {cooldown.left > 0 ? `Новый код через ${cooldown.left} с` : "Прислать код ещё раз"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setNotice(null);
                  clearCode(form);
                  form.setStatus(undefined);
                }}
                className="text-base text-slate underline-offset-4 hover:underline"
              >
                Другой номер
              </button>
            </div>
          )}
        </Form>
      )}
    </Formik>
  );
}
