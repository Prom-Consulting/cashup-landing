import {
  ApiError,
  MERCHANT_ROLE_LABELS,
  changePasswordInputSchema,
  type ChangePasswordInput,
  authApi,
} from "@loal/api";
import { GoogleLink, ProfileForm, useApi, useProfile } from "@loal/app-kit";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Field } from "@loal/ui/field";
import { PasswordInput, formatPhone } from "@loal/ui/inputs";
import { Badge, Button, Card, PageHeader } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useMerchant } from "../../entities/merchant/api";
import { useCurrentMerchant } from "../../entities/session/model";
import { ExitRequestCard } from "../../features/merchant-exit/exit-request-card";
import { GOOGLE_CLIENT_ID } from "../../shared/config/env";

const initialValues: ChangePasswordInput = { currentPassword: "", newPassword: "", repeatPassword: "" };

/** Смена пароля — для тех, кто входит по почте. Глазик в каждом поле. */
function ChangePasswordCard() {
  const api = useApi();
  return (
    <Card className="flex flex-col">
      <h2 className="text-xl font-bold">Пароль</h2>
      <p className="mt-1 text-base text-muted-foreground">Для входа по почте. По номеру и через Google пароль не нужен.</p>
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
                  <PasswordInput
                    {...parts}
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
              <Field label="Повторите новый пароль" error={fieldError(form, "repeatPassword")}>
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
  );
}

function initials(name: string) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
  return letters.toUpperCase() || "L";
}

/** Кто вошёл: имя, контакты, роль и заведение — одной карточкой над настройками. */
function AccountCard() {
  const profile = useProfile();
  const { membership, merchantId, label } = useCurrentMerchant();
  const merchant = useMerchant(merchantId ?? "");
  const role = membership?.role ? MERCHANT_ROLE_LABELS[membership.role] : undefined;
  const name = profile.data?.fullName || label || "Без имени";
  const contacts = [profile.data?.phone ? formatPhone(profile.data.phone) : null, profile.data?.email].filter(Boolean);

  return (
    <Card className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <span
        aria-hidden="true"
        className="brand-gradient display grid h-20 w-20 shrink-0 place-items-center rounded-full text-[1.75rem] text-white"
      >
        {initials(name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="display truncate text-[1.75rem] leading-tight">{name}</p>
        {contacts.length > 0 && <p className="mt-1 truncate text-base text-muted-foreground">{contacts.join(" · ")}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {role && <Badge tone="neutral">{role.title}</Badge>}
          {merchant.data?.name && <Badge tone="quiet">{merchant.data.name}</Badge>}
          {profile.isSuccess && (
            <Badge tone={profile.data.google ? "good" : "quiet"}>
              {profile.data.google ? "Google привязан" : "Google не привязан"}
            </Badge>
          )}
        </div>
      </div>
      {role && <p className="max-w-[34ch] text-sm leading-snug text-muted-foreground sm:text-right">{role.can}</p>}
    </Card>
  );
}

/** Настройки: кто вошёл, вход через Google, имя и почта, пароль, выход из программы. */
export function ProfilePage() {
  const { merchantId, canManage } = useCurrentMerchant();

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Настройки" description="Как вы входите в кабинет, ваши данные и доступ." />

      <AccountCard />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          {/* Первым — привязка Google: ради неё сюда чаще всего и заходят */}
          <Card>
            <h2 className="text-xl font-bold">Вход через Google</h2>
            <GoogleLink clientId={GOOGLE_CLIENT_ID} />
          </Card>
          <Card>
            <h2 className="text-xl font-bold">Имя и почта</h2>
            <ProfileForm />
          </Card>
        </div>
        <ChangePasswordCard />
      </div>

      {/* Заявку подаёт только владелец — кассиру и администратору филиала сервер ответит 403 */}
      {canManage && merchantId && <ExitRequestCard merchantId={merchantId} />}
    </section>
  );
}
