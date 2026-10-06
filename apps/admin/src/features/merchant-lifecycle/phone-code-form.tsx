import { ApiError, otpLoginInputSchema, otpRequestInputSchema } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { OtpInput, PhoneInput } from "@loal/ui/inputs";
import { Button, FormField, FormStatus } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useEffect, useState } from "react";

/** Понятный текст по коду ошибки смены номера (docs/API.md, «Смена номера сотрудника»). */
export function phoneCodeError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "PHONE_HAS_ACTIVE_MERCHANT":
        return "Этот номер уже работает в другом заведении — код не отправлен.";
      case "SAME_PHONE":
        return "Это тот же номер. Укажите новый.";
      case "OTP_INVALID":
        return "Неверный код. Номер не изменился.";
      case "OTP_EXPIRED":
        return "Код истёк — запросите новый.";
      case "OTP_TOO_MANY_ATTEMPTS":
        return "Пять неверных попыток. Запросите новый код.";
      case "OTP_RATE_LIMITED":
        return error.retryAfter ? `Новый код можно запросить через ${error.retryAfter} с.` : "Подождите минуту и запросите код снова.";
      case "PHONE_TAKEN":
        return "Этот номер занят в OctōPAY другим аккаунтом — в Loal ничего не изменилось.";
      case "OCTOPAY_SYNC_PENDING":
        return "OctōPAY ещё не получил прошлое изменение. Повторите через минуту — код не потрачен.";
    }
    if (error.status === 403) return "Номер может менять только супер-админ.";
    if (error.status === 409) return error.message || "Этот номер сейчас использовать нельзя.";
    if (error.message) return error.message;
  }
  return fallback;
}

/**
 * Новый номер и код из WhatsApp. Код получает человек с новым номером и диктует его
 * супер-админу; одноразовый, 5 минут, повтор — раз в минуту.
 */
export function PhoneCodeForm({
  sendCode,
  submit,
  submitLabel,
  phoneLabel = "Новый номер",
}: {
  sendCode: (phone: string) => Promise<unknown>;
  submit: (input: { phone: string; code: string }) => Promise<unknown>;
  submitLabel: string;
  phoneLabel?: string;
}) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  return (
    <Formik
      initialValues={{ phone: "", otp: "" }}
      validate={zodValidate(sentTo ? otpLoginInputSchema : otpRequestInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          if (!sentTo) {
            await sendCode(values.phone);
            setSentTo(values.phone);
            setCooldown(60);
            helpers.setFieldTouched("otp", false, false);
          } else {
            await submit({ phone: values.phone, code: values.otp });
          }
        } catch (error) {
          const message = phoneCodeError(error, sentTo ? "Не удалось сменить номер" : "Не удалось отправить код");
          if (error instanceof ApiError && ["PHONE_HAS_ACTIVE_MERCHANT", "SAME_PHONE", "PHONE_TAKEN"].includes(error.code ?? ""))
            helpers.setFieldError("phone", message);
          else if (error instanceof ApiError && (error.code ?? "").startsWith("OTP_INVALID")) helpers.setFieldError("otp", message);
          else applyServerIssues(error, helpers, message);
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-4" noValidate>
          <FocusFirstError form={form} />
          <FormField label={phoneLabel} hint="Код придёт в WhatsApp на этот номер" error={fieldError(form, "phone")}>
            {(parts) => (
              <PhoneInput
                {...parts}
                value={form.values.phone}
                disabled={Boolean(sentTo) || form.isSubmitting}
                onValueChange={(value) => form.setFieldValue("phone", value)}
                onBlur={() => form.setFieldTouched("phone", true)}
              />
            )}
          </FormField>
          {sentTo && (
            <FormField label="Код из WhatsApp" hint="Человек с новым номером диктует его вам" error={fieldError(form, "otp")}>
              {(parts) => (
                <OtpInput
                  {...parts}
                  value={form.values.otp}
                  autoFocus
                  disabled={form.isSubmitting}
                  onValueChange={(code) => form.setFieldValue("otp", code)}
                  // Шестая цифра — сразу отправляем, как на экране входа
                  onComplete={(code) => void form.setFieldValue("otp", code, true).then(() => form.submitForm())}
                  onBlur={() => form.setFieldTouched("otp", true)}
                />
              )}
            </FormField>
          )}
          <FormStatus message={formError(form)} />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={form.isSubmitting}>
              {form.isSubmitting ? "Подождите…" : sentTo ? submitLabel : "Отправить код"}
            </Button>
            {sentTo && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={cooldown > 0 || form.isSubmitting}
                  onClick={async () => {
                    form.setStatus(undefined);
                    try {
                      await sendCode(sentTo);
                      setCooldown(60);
                    } catch (error) {
                      form.setStatus(phoneCodeError(error, "Не удалось отправить код"));
                    }
                  }}
                >
                  {cooldown > 0 ? `Код снова через ${cooldown} с` : "Отправить код снова"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={form.isSubmitting}
                  onClick={() => {
                    setSentTo(null);
                    void form.setFieldValue("otp", "");
                  }}
                >
                  Другой номер
                </Button>
              </>
            )}
          </div>
        </Form>
      )}
    </Formik>
  );
}
