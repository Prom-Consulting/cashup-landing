import { WEBHOOK_EVENTS, createWebhookInputSchema, type CreateWebhookInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Badge, Button, Card, EmptyState, ErrorState, Input, Label, Loading, PageHeader } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useCreateWebhook, useWebhookDeliveries, useWebhooks } from "../../entities/merchant/api";
import { useCurrentMerchant } from "../../entities/session/model";
import { formatDateTime } from "../../shared/lib/format";

const initialValues: CreateWebhookInput = { url: "", events: ["points_changed"] };

/** Наши исходящие вызовы в систему заведения, когда на карте что-то произошло у него. */
export function WebhooksPage() {
  const { merchantId, canManage } = useCurrentMerchant();
  const webhooks = useWebhooks(merchantId ?? "");
  const create = useCreateWebhook(merchantId ?? "");
  const [openDeliveries, setOpenDeliveries] = useState<string | null>(null);
  const [freshSecret, setFreshSecret] = useState<string | null>(null);
  const deliveries = useWebhookDeliveries(merchantId ?? "", openDeliveries);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Вебхуки"
        description="Мы вызываем ваш адрес, когда на карте клиента что-то произошло у вас: списание, выпуск, отзыв."
      />

      {freshSecret && (
        <Card className="border-2 border-primary">
          <h2 className="text-xl font-bold">Секрет вебхука</h2>
          <p className="mt-2 text-base text-muted-foreground">
            Показываем один раз — им подписываются наши вызовы. Скопируйте сейчас, второй раз мы его не покажем.
          </p>
          <p className="mt-3 rounded-2xl bg-muted px-4 py-3 text-lg break-all">{freshSecret}</p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => setFreshSecret(null)}>
            Я сохранил
          </Button>
        </Card>
      )}

      {canManage && (
        <Card>
          <h2 className="text-xl font-bold">Новый вебхук</h2>
          <Formik
            initialValues={initialValues}
            validate={zodValidate(createWebhookInputSchema)}
            onSubmit={async (values, helpers) => {
              helpers.setStatus(undefined);
              try {
                const created = await create.mutateAsync(values);
                helpers.resetForm();
                if (created.secret) setFreshSecret(created.secret);
              } catch (error) {
                applyServerIssues(error, helpers);
              } finally {
                helpers.setSubmitting(false);
              }
            }}
          >
            {(form) => (
              <Form className="mt-5 flex flex-col gap-5" noValidate>
                <FocusFirstError form={form} />
                <div>
                  <Label htmlFor="url">Адрес</Label>
                  <Input
                    id="url"
                    name="url"
                    placeholder="https://example.kg/loal-hook"
                    className="mt-2"
                    value={form.values.url}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    invalid={Boolean(fieldError(form, "url"))}
                  />
                  {fieldError(form, "url") && (
                    <p className="mt-2 text-base text-destructive">{fieldError(form, "url")}</p>
                  )}
                </div>

                <div>
                  <span className="text-base font-medium">События</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {WEBHOOK_EVENTS.map((event) => {
                      const chosen = form.values.events.includes(event.id);
                      return (
                        <button
                          key={event.id}
                          type="button"
                          aria-pressed={chosen}
                          onClick={() =>
                            form.setFieldValue(
                              "events",
                              chosen
                                ? form.values.events.filter((item) => item !== event.id)
                                : [...form.values.events, event.id],
                            )
                          }
                          className={`h-11 rounded-2xl border-2 px-4 text-base transition-colors ${
                            chosen
                              ? "border-secondary bg-secondary text-secondary-foreground"
                              : "border-border bg-surface hover:border-foreground"
                          }`}
                        >
                          {event.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formError(form) && <p className="text-base text-destructive">{formError(form)}</p>}

                <Button type="submit" variant="outline" className="self-start" disabled={form.isSubmitting}>
                  {form.isSubmitting ? "Создаём…" : "Создать"}
                </Button>
              </Form>
            )}
          </Formik>
        </Card>
      )}

      {webhooks.isPending && <Loading rows={2} />}
      {webhooks.isError && <ErrorState error={webhooks.error} onRetry={() => webhooks.refetch()} />}
      {webhooks.isSuccess && webhooks.data.length === 0 && (
        <EmptyState title="Вебхуков нет" description="Пока мы никуда не сообщаем о событиях на картах." />
      )}

      <div className="flex flex-col gap-3">
        {(webhooks.data ?? []).map((webhook) => (
          <Card key={webhook.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg break-all">{webhook.url}</p>
                <p className="mt-2 flex flex-wrap gap-2">
                  {webhook.events.map((event) => (
                    <Badge key={event} tone="quiet">
                      {WEBHOOK_EVENTS.find((item) => item.id === event)?.label ?? event}
                    </Badge>
                  ))}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpenDeliveries(openDeliveries === webhook.id ? null : webhook.id)}
              >
                {openDeliveries === webhook.id ? "Скрыть доставки" : "Доставки"}
              </Button>
            </div>

            {openDeliveries === webhook.id && (
              <div className="mt-4 border-t border-border pt-4">
                {deliveries.isPending && <Loading rows={2} />}
                {deliveries.isSuccess && deliveries.data.length === 0 && (
                  <p className="text-base text-muted-foreground">Доставок пока не было.</p>
                )}
                <ul className="flex flex-col gap-2">
                  {(deliveries.data ?? []).map((delivery) => (
                    <li key={delivery.id} className="flex flex-wrap justify-between gap-3 text-base">
                      <span>{delivery.event ?? "событие"}</span>
                      <span className="text-muted-foreground">
                        {delivery.status ?? "—"}
                        {delivery.responseStatus ? ` · ответ ${delivery.responseStatus}` : ""} ·{" "}
                        {formatDateTime(delivery.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
