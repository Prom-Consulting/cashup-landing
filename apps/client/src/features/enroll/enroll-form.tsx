import { enrollInputSchema, type EnrollInfo, type EnrollInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { PhoneInput } from "@loal/ui/inputs";
import { Button, FormField, FormStatus, Input } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useNavigate } from "react-router";
import { useEnroll, type EnrollTarget } from "../../entities/enroll/api";

/**
 * Карта без регистрации: имя, фамилия и телефон — и она сразу ваша. Баллы на неё
 * приносит подписка; без подписки карта просто ждёт.
 */
export function EnrollForm({ info, target, via }: { info: EnrollInfo; target?: EnrollTarget; via?: string }) {
  const enroll = useEnroll(target);
  const navigate = useNavigate();
  const initialValues: EnrollInput = { firstName: "", lastName: "", phone: "", customField1: "", customField2: "" };

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(enrollInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          const { serialNumber } = await enroll.mutateAsync({
            ...values,
            customField1: values.customField1 || undefined,
            customField2: values.customField2 || undefined,
            // Чужой или неверный id партнёра сервер просто отбросит, выдачу это не ломает
            enrolledByMemberId: via && /^[0-9a-f-]{36}$/i.test(via) ? via : undefined,
          });
          navigate(`/c/${encodeURIComponent(serialNumber)}`, { replace: true });
        } catch (error) {
          applyServerIssues(error, helpers, "Не удалось выдать карту. Проверьте данные и попробуйте ещё раз.");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form noValidate className="flex flex-col gap-5">
          <FocusFirstError form={form} />
          <FormField label="Имя" error={fieldError(form, "firstName")}>
            {(parts) => (
              <Input
                {...parts}
                name="firstName"
                autoComplete="given-name"
                value={form.values.firstName}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </FormField>
          <FormField label="Фамилия" error={fieldError(form, "lastName")}>
            {(parts) => (
              <Input
                {...parts}
                name="lastName"
                autoComplete="family-name"
                value={form.values.lastName}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </FormField>
          <FormField
            label="Телефон"
            hint="По нему вы потом войдёте в кабинет и увидите баланс."
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
          </FormField>
          {info.customField1Label && (
            <FormField label={info.customField1Label} error={fieldError(form, "customField1")}>
              {(parts) => (
                <Input
                  {...parts}
                  name="customField1"
                  value={form.values.customField1 ?? ""}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              )}
            </FormField>
          )}
          {info.customField2Label && (
            <FormField label={info.customField2Label} error={fieldError(form, "customField2")}>
              {(parts) => (
                <Input
                  {...parts}
                  name="customField2"
                  value={form.values.customField2 ?? ""}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              )}
            </FormField>
          )}
          <FormStatus message={formError(form)} />
          <Button type="submit" size="lg" disabled={form.isSubmitting}>
            {form.isSubmitting ? "Выдаём карту…" : "Получить карту"}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
