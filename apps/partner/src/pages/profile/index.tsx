import {
  ApiError,
  MERCHANT_ROLE_LABELS,
  changePasswordInputSchema,
  type ChangePasswordInput,
  authApi,
} from "@loal/api";
import { GoogleLink, ProfileForm, useApi } from "@loal/app-kit";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Field } from "@loal/ui/field";
import { TextInput } from "@loal/ui/inputs";
import { Button, Card, PageHeader } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useCurrentMerchant } from "../../entities/session/model";
import { ExitRequestCard } from "../../features/merchant-exit/exit-request-card";
import { GOOGLE_CLIENT_ID } from "../../shared/config/env";

const initialValues: ChangePasswordInput = { currentPassword: "", newPassword: "", repeatPassword: "" };

/** Профиль: кто вошёл, вход через Google, имя и почта, смена пароля. */
export function ProfilePage() {
  const api = useApi();
  const { label, membership, merchantId, canManage } = useCurrentMerchant();

  return (
    <section className="flex max-w-[560px] flex-col gap-6">
      <PageHeader title="Профиль" description={label} />

      <Card>
        <h2 className="text-xl font-bold">Доступ</h2>
        <p className="mt-2 text-lg text-muted-foreground">
          {membership?.role && MERCHANT_ROLE_LABELS[membership.role]
            ? `${MERCHANT_ROLE_LABELS[membership.role]!.title}. ${MERCHANT_ROLE_LABELS[membership.role]!.can}`
            : "Сотрудник магазина"}
        </p>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">Вход через Google</h2>
        <GoogleLink clientId={GOOGLE_CLIENT_ID} />
      </Card>

      <Card>
        <h2 className="text-xl font-bold">Имя и почта</h2>
        <ProfileForm />
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
              applyServerIssues(
                error,
                helpers,
                error instanceof ApiError && error.status === 400 ? "Текущий пароль не подошёл" : undefined,
              );
            } finally {
              helpers.setSubmitting(false);
            }
          }}
        >
          {(form) => (
            <Form className="mt-5 flex flex-col gap-5" noValidate>
              <FocusFirstError form={form} />
              <Field label="Текущий пароль" error={fieldError(form, "currentPassword")}>
                {(parts) => (
                  <TextInput
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
                  <TextInput
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
                  <TextInput
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

      {/* Заявку подаёт только владелец — кассиру и администратору филиала сервер ответит 403 */}
      {canManage && merchantId && <ExitRequestCard merchantId={merchantId} />}
    </section>
  );
}
