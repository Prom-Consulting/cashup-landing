import {
  ApiError,
  connectOctopayInputSchema,
  isOctopayIntegrationReady,
  type ConnectOctopayInput,
} from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Badge, Button, ConfirmDialog, FormField, FormStatus, Input, Skeleton } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useRef } from "react";
import {
  useConnectOctopay,
  useDisconnectOctopay,
  useOctopayIntegration,
} from "../../entities/merchant/api";
import { formatDateTime } from "../../shared/lib/format";

function connectErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return "Не удалось подключить Octopay. Попробуйте ещё раз.";
  if (error.status === 400) return "Код недействителен или истёк";
  if (error.status === 401) return "Сессия закончилась. Войдите в кабинет заново.";
  if (error.status === 403) return "Подключить Octopay может только владелец магазина.";
  if (error.status === 409) return "Этот магазин или аккаунт Octopay уже привязан.";
  if (error.status === 502) return "Octopay временно недоступен. Попробуйте позже.";
  return "Не удалось подключить Octopay. Попробуйте ещё раз.";
}

function disconnectErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Сессия закончилась. Войдите в кабинет заново.";
    if (error.status === 403) return "Отключить Octopay может только владелец магазина.";
    if (error.status === 502) return "Octopay временно недоступен. Попробуйте позже.";
  }
  return "Не удалось отключить Octopay. Попробуйте ещё раз.";
}

function readinessHint(reason?: string | null, activeAccounts?: number) {
  if (reason === "KGS_BANK_ACCOUNT_REQUIRED") {
    return "Добавьте и активируйте в Octopay один банковский счёт в KGS.";
  }
  if (reason === "KGS_BANK_ACCOUNT_NOT_PAYABLE") {
    return "Активный счёт в KGS пока не готов принимать оплату. Проверьте поддерживаемый банк, реквизиты и подключение счёта в Octopay.";
  }
  if (reason === "KGS_BANK_ACCOUNT_AMBIGUOUS") {
    return `Для счетов Loal нужен ровно один активный банковский счёт в KGS, готовый к оплате${
      activeAccounts === undefined ? "" : `; сейчас активных: ${activeAccounts}`
    }. Отключите лишние активные счета в Octopay.`;
  }
  if (reason === "LOAL_LINK_INACTIVE") {
    return "Откройте «Интеграции → Бонусы Loal» в кабинете Octopay и нажмите «Включить бонусы».";
  }
  return "Octopay пока не подтвердил готовность интеграции. Обновите страницу или проверьте настройки в Octopay.";
}

export function OctopayIntegration({ merchantId }: { merchantId: string }) {
  const integration = useOctopayIntegration(merchantId);
  const connect = useConnectOctopay(merchantId);
  const disconnect = useDisconnectOctopay(merchantId);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const ready = Boolean(integration.data && isOctopayIntegrationReady(integration.data));

  const focusUpdatedState = () => {
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  return (
    <div className="mt-6 border-t border-border pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="rounded-lg text-lg font-bold outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Octopay
        </h3>
        {integration.isSuccess && (
          <Badge role="status" aria-live="polite" tone={ready ? "good" : integration.data.connected ? "warn" : "quiet"}>
            {ready ? "Подключено" : integration.data.connected ? "Приём приостановлен" : "Не подключено"}
          </Badge>
        )}
      </div>

      {integration.isPending && (
        <div role="status" aria-label="Проверяем подключение Octopay">
          <Skeleton className="mt-4 h-28 w-full" />
        </div>
      )}

      {integration.isError && (
        <div role="alert" className="mt-4 rounded-2xl bg-muted p-4">
          <p className="text-base font-medium">Не удалось проверить подключение Octopay.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={integration.isFetching}
            onClick={() => integration.refetch()}
          >
            {integration.isFetching ? "Проверяем…" : "Повторить"}
          </Button>
        </div>
      )}

      {integration.isSuccess && integration.data.connected && (
        <div className="mt-4">
          <p className="text-base text-muted-foreground">Связанный магазин</p>
          <p className="mt-1 text-lg font-bold">{integration.data.octopayBusinessName ?? "Магазин Octopay"}</p>
          {integration.data.connectedAt && (
            <p className="mt-1 text-sm text-muted-foreground">
              Подключено {formatDateTime(integration.data.connectedAt)}
            </p>
          )}
          {ready ? (
            <p className="mt-3 text-base text-muted-foreground">
              В счетах этого магазина доступна оплата бонусами Loal.
            </p>
          ) : (
            <div role="alert" className="mt-3 rounded-2xl bg-muted p-4 text-base">
              {readinessHint(
                integration.data.invoiceNotReadyReason,
                integration.data.activeKgsBankAccountCount,
              )}
            </div>
          )}
          <ConfirmDialog
            trigger={
              <Button type="button" variant="outline" size="sm" className="mt-4">
                Отключить
              </Button>
            }
            title="Отключить Octopay?"
            description="Кнопка оплаты баллами исчезнет с новых и уже открытых счетов этого магазина."
            confirmLabel={disconnect.isPending ? "Отключаем…" : "Отключить"}
            onConfirm={async () => {
              try {
                await disconnect.mutateAsync();
                focusUpdatedState();
              } catch (error) {
                throw new Error(disconnectErrorMessage(error));
              }
            }}
          />
        </div>
      )}

      {integration.isSuccess && !integration.data.connected && (
        <div className="mt-4">
          <p className="text-base text-muted-foreground">
            Свяжите магазин с Octopay, чтобы клиенты могли оплачивать часть счёта бонусами Loal.
          </p>
          <div className="mt-4 rounded-2xl bg-muted p-4">
            <p className="text-base font-bold">Как подключить</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>В кабинете Octopay создайте одноразовый код для Loal.</li>
              <li>Вставьте код ниже и нажмите «Подключить».</li>
            </ol>
          </div>

          <Formik<ConnectOctopayInput>
            initialValues={{ token: "" }}
            validate={zodValidate(connectOctopayInputSchema)}
            onSubmit={async (values, helpers) => {
              helpers.setStatus(undefined);
              try {
                await connect.mutateAsync(values);
                helpers.resetForm();
                focusUpdatedState();
              } catch (error) {
                const message = connectErrorMessage(error);
                applyServerIssues(new Error(message), helpers, message);
              } finally {
                connect.reset();
                helpers.setSubmitting(false);
              }
            }}
          >
            {(form) => (
              <Form noValidate className="mt-4 flex flex-col gap-4">
                <FocusFirstError form={form} />
                <FormField
                  label="Одноразовый код"
                  hint="Код действует недолго, используется один раз и не сохраняется в Loal."
                  error={fieldError(form, "token")}
                >
                  {(parts) => (
                    <Input
                      {...parts}
                      name="token"
                      type="password"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="loal_link_…"
                      value={form.values.token}
                      onChange={form.handleChange}
                      onBlur={form.handleBlur}
                    />
                  )}
                </FormField>
                <FormStatus message={formError(form)} />
                <div>
                  <Button type="submit" disabled={form.isSubmitting || connect.isPending}>
                    {form.isSubmitting || connect.isPending ? "Подключаем…" : "Подключить"}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      )}
    </div>
  );
}
