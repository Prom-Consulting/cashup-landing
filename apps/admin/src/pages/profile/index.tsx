import { ApiError, changePasswordInputSchema, type ChangePasswordInput, authApi } from "@loal/api";
import { ProfileForm, useApi, useProfile } from "@loal/app-kit";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Field } from "@loal/ui/field";
import { Badge, Button, Card, PageHeader, PasswordInput } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useCurrentUser } from "../../entities/session/model";

const initialValues: ChangePasswordInput = { currentPassword: "", newPassword: "", repeatPassword: "" };

function initials(name: string) {
  return (
    name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "L"
  );
}

/** Кто вошёл: имя, почта, роль — и выход, одной карточкой над настройками. */
function AccountCard() {
  const profile = useProfile();
  const { session, label, logout } = useCurrentUser();
  const name = profile.data?.fullName || label || "Администратор";
  const email = profile.data?.email ?? session?.email;
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
        {email && email !== name && <p className="mt-1 truncate text-base text-muted-foreground">{email}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="neutral">
            {session?.role === "super_admin" ? "Администратор платформы" : (session?.role ?? "—")}
          </Badge>
        </div>
      </div>
      <Button variant="outline" className="self-start sm:self-center" onClick={logout}>
        Выйти
      </Button>
    </Card>
  );
}

/** Профиль агентства: кто вошёл, имя и почта, пароль. Google здесь нет — он только у сотрудников магазинов. */
export function ProfilePage() {
  const api = useApi();

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Профиль" description="Ваши данные и вход в админку." />

      <AccountCard />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold">Имя и почта</h2>
          <p className="mt-1 text-base text-muted-foreground">Почтой вы входите в админку.</p>
          <ProfileForm />
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Пароль</h2>
          <p className="mt-1 text-base text-muted-foreground">Для входа по почте. Не короче 8 символов.</p>
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
      </div>
    </section>
  );
}
