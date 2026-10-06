import {
  platformPricesInputSchema,
  platformSettingsInputSchema,
  type PlatformPricesInput,
  type PlatformSettings,
  type PlatformSettingsInput,
} from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import {
  Button,
  Card,
  ErrorState,
  FormField,
  FormStatus,
  Input,
  Label,
  Loading,
  PageHeader,
  Textarea,
} from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { Link } from "react-router";
import {
  useAuditLogs,
  usePlatformSettings,
  useSavePlatformPrices,
  useSavePlatformSettings,
} from "../../entities/platform/api";
import { formatDateTime } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");

const PRICE_FIELDS = [
  {
    name: "cardSubscriptionPriceKgs",
    label: "Подписка клиента",
    hint: "Месяц с 15 000 бонусов. По ней считаются оплаты клиентов по телефону и по карте.",
  },
] as const;

/** Цены платформы: сервер сам считает по ним каждый счёт. Смена — со следующего счёта. */
function PricesCard({ settings }: { settings: PlatformSettings }) {
  const save = useSavePlatformPrices();
  // Отдельно от status: после сохранения форма пересоздаётся с новыми ценами и сбрасывает status
  const [saved, setSaved] = useState(false);
  const initialValues: PlatformPricesInput = {
    cardSubscriptionPriceKgs: settings.cardSubscriptionPriceKgs ?? "",
  };

  return (
    <Card>
      <h2 className="text-xl font-bold">Подписка клиента</h2>
      <p className="mt-1 max-w-[70ch] text-base text-muted-foreground">
        Целые сомы за месяц. Счёт считает сервер: цена × месяцы. Новая цена действует со следующего счёта — уже
        выставленные не меняются. Каждая смена попадает в журнал ниже. Цены тарифов магазинов — в разделе{" "}
        <Link to="/tariffs" className="text-flame-ink underline underline-offset-4">
          «Тарифы»
        </Link>
        .
      </p>
      <Formik
        initialValues={initialValues}
        enableReinitialize
        validate={zodValidate(platformPricesInputSchema)}
        onSubmit={async (values, helpers) => {
          helpers.setStatus(undefined);
          setSaved(false);
          try {
            await save.mutateAsync(values);
            setSaved(true);
          } catch (error) {
            applyServerIssues(error, helpers, "Не удалось сохранить цены");
          } finally {
            helpers.setSubmitting(false);
          }
        }}
      >
        {(form) => (
          <Form className="mt-5 flex flex-col gap-5" noValidate>
            <FocusFirstError form={form} />
            <div className="grid max-w-[420px] gap-5">
              {PRICE_FIELDS.map((field) => {
                const value = Number(form.values[field.name]);
                return (
                  <FormField
                    key={field.name}
                    label={field.label}
                    hint={value > 0 ? `${field.hint} 3 месяца = ${money.format(value * 3)} сом.` : field.hint}
                    error={fieldError(form, field.name)}
                  >
                    {(parts) => (
                      <div className="relative">
                        <Input
                          {...parts}
                          name={field.name}
                          inputMode="numeric"
                          className="pr-20 text-xl tabular-nums"
                          value={String(form.values[field.name] ?? "")}
                          onChange={form.handleChange}
                          onBlur={form.handleBlur}
                        />
                        <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-base text-muted-foreground">
                          сом/мес
                        </span>
                      </div>
                    )}
                  </FormField>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" disabled={form.isSubmitting || !form.dirty}>
                {form.isSubmitting ? "Сохраняем…" : "Сохранить цены"}
              </Button>
              <FormStatus message={formError(form)} />
              <FormStatus
                tone="success"
                message={saved && !form.dirty ? "Цены сохранены — действуют со следующего счёта" : undefined}
              />
            </div>
          </Form>
        )}
      </Formik>
    </Card>
  );
}

/** Цены подписок и текст «о компании» на обороте каждой выпущенной карты. */
export function SettingsPage() {
  const settings = usePlatformSettings();
  const save = useSavePlatformSettings();
  const audit = useAuditLogs();

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Настройки платформы"
        description="Цены подписок и сноска на обороте карт — общие для всей платформы."
      />

      {settings.isSuccess && <PricesCard settings={settings.data} />}

      {settings.isPending && <Loading rows={2} />}
      {settings.isError && <ErrorState error={settings.error} onRetry={() => settings.refetch()} />}

      {settings.isSuccess && (
        <Card>
          <h2 className="text-xl font-bold">Сноска на обороте карты</h2>
          <p className="mt-1 mb-5 max-w-[70ch] text-base text-muted-foreground">
            Её видят все держатели в Apple Wallet (в Google Wallet сноски нет). Пока поля пустые, там стоит «Карты
            лояльности» и loal.kg. Выданные карты получат изменение при следующем обновлении; чтобы разослать всем
            сразу, пересохраните шаблон карты.
          </p>
          <Formik
            initialValues={
              { infoText: settings.data.infoText ?? "", infoUrl: settings.data.infoUrl ?? "" } as PlatformSettingsInput
            }
            validate={zodValidate(platformSettingsInputSchema)}
            onSubmit={async (values, helpers) => {
              helpers.setStatus(undefined);
              try {
                await save.mutateAsync(values);
                helpers.setStatus("Сохранено");
              } catch (error) {
                applyServerIssues(error, helpers);
              } finally {
                helpers.setSubmitting(false);
              }
            }}
          >
            {(form) => (
              <Form className="flex flex-col gap-5" noValidate>
                <FocusFirstError form={form} />
                <div>
                  <Label htmlFor="infoText">О компании</Label>
                  <Textarea
                    id="infoText"
                    name="infoText"
                    className="mt-2"
                    value={form.values.infoText}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    invalid={Boolean(fieldError(form, "infoText"))}
                  />
                  {fieldError(form, "infoText") && (
                    <p className="mt-2 text-base text-destructive">{fieldError(form, "infoText")}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="infoUrl">Ссылка</Label>
                  <Input
                    id="infoUrl"
                    name="infoUrl"
                    placeholder="https://loal.kg"
                    className="mt-2"
                    value={form.values.infoUrl}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    invalid={Boolean(fieldError(form, "infoUrl"))}
                  />
                  {fieldError(form, "infoUrl") && (
                    <p className="mt-2 text-base text-destructive">{fieldError(form, "infoUrl")}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Button type="submit" disabled={form.isSubmitting}>
                    {form.isSubmitting ? "Сохраняем…" : "Сохранить"}
                  </Button>
                  {formError(form) && (
                    <p role="status" className="text-base text-muted-foreground">
                      {formError(form)}
                    </p>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </Card>
      )}

      <Card>
        <h2 className="text-xl font-bold">Что делало агентство</h2>
        {audit.isPending && <Loading rows={2} />}
        {audit.isSuccess && audit.data.length === 0 && (
          <p className="mt-3 text-base text-muted-foreground">Записей пока нет.</p>
        )}
        <ul className="mt-4 flex flex-col gap-2">
          {(audit.data ?? []).slice(0, 30).map((entry) => (
            <li key={entry.id} className="flex flex-wrap justify-between gap-3 text-base">
              <span>
                {entry.action ?? "действие"}
                {entry.entity ? ` · ${entry.entity}` : ""}
              </span>
              <span className="text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
