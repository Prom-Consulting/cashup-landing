import { ApiError, createCustomerInputSchema, type CreateCustomerInput } from "@loal/api";
import { fieldError, formError, zodValidate } from "@loal/forms";
import { Badge, Button, Dialog, DialogContent, DialogTrigger, ErrorState, Icon, Input, Label } from "@loal/ui/shadcn";
import { CreditCardIcon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { Form, Formik } from "formik";
import { useId, useState } from "react";
import { useCreateCustomer, useIssueCard, useIssueCatalog } from "../../entities/customer/api";

const emptyCustomer: CreateCustomerInput = { firstName: "", lastName: "", phone: "", email: "" };

/**
 * Выпуск карты в два шага: сначала заводим гостя, потом сразу выпускаем ему карту
 * по выбранному шаблону. Шаблон и программа приходят из настроек магазина — если их
 * нет, выпускать нечего, и мы честно об этом говорим.
 */
export function IssueCardDialog({ storeId }: { storeId: string }) {
  const [open, setOpen] = useState(false);
  const [issued, setIssued] = useState<{ serial: string; name: string } | null>(null);
  const [templateId, setTemplateId] = useState("");

  const catalog = useIssueCatalog(storeId, open);
  const createCustomer = useCreateCustomer(storeId);
  const issueCard = useIssueCard(storeId);
  const templateFieldId = useId();

  const templates = catalog.data?.templates ?? [];
  const programs = catalog.data?.programs ?? [];
  const chosen = templates.find((template) => template.id === templateId) ?? templates[0];
  // У шаблона уже задана своя программа; если её нет — берём первую в магазине
  const programId = chosen?.programId ?? programs[0]?.id ?? "";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setIssued(null);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Icon icon={CreditCardIcon} />
          Выпустить карту
        </Button>
      </DialogTrigger>

      <DialogContent
        title="Выпуск карты"
        description="Заведите гостя — карта появится у него в Apple Wallet по ссылке."
      >
        {issued ? (
          <div className="flex flex-col gap-4">
            <Badge tone="good">Карта выпущена</Badge>
            <p className="text-lg">
              {issued.name}: номер <span className="font-bold tabular-nums">{issued.serial}</span>
            </p>
            <p className="text-base text-muted-foreground">
              Отправьте гостю ссылку на карту — по ней он добавит её в Apple Wallet.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIssued(null);
                }}
              >
                <Icon icon={UserAdd01Icon} />
                Выпустить ещё
              </Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Закрыть
              </Button>
            </div>
          </div>
        ) : (
          <Formik
            initialValues={emptyCustomer}
            validate={zodValidate(createCustomerInputSchema)}
            onSubmit={async (values, helpers) => {
              helpers.setStatus(undefined);
              if (!chosen || !programId) {
                helpers.setStatus("В магазине нет шаблона карты или программы — их настраивает Loal.");
                helpers.setSubmitting(false);
                return;
              }
              try {
                const customer = await createCustomer.mutateAsync(values);
                const card = await issueCard.mutateAsync({
                  customerId: customer.id,
                  templateId: chosen.id,
                  programId,
                });
                setIssued({
                  serial: card.serialNumber,
                  name: [values.firstName, values.lastName].filter(Boolean).join(" ") || "Гость",
                });
                helpers.resetForm();
              } catch (error) {
                helpers.setStatus(
                  error instanceof ApiError && error.status === 400
                    ? "Этот магазин не выпускает карты — их выпускает Loal. Напишите нам, и мы включим выпуск."
                    : error instanceof Error
                      ? error.message
                      : "Не удалось выпустить карту",
                );
              } finally {
                helpers.setSubmitting(false);
              }
            }}
          >
            {(form) => (
              <Form className="flex flex-col gap-5" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="firstName">Имя</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      className="mt-2"
                      value={form.values.firstName ?? ""}
                      onChange={form.handleChange}
                      onBlur={form.handleBlur}
                      aria-invalid={Boolean(fieldError(form, "firstName"))}
                    />
                    {fieldError(form, "firstName") && (
                      <p className="mt-1 text-sm text-destructive">{fieldError(form, "firstName")}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Фамилия</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      className="mt-2"
                      value={form.values.lastName ?? ""}
                      onChange={form.handleChange}
                      onBlur={form.handleBlur}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      name="phone"
                      inputMode="tel"
                      className="mt-2"
                      value={form.values.phone ?? ""}
                      onChange={form.handleChange}
                      onBlur={form.handleBlur}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Почта</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      className="mt-2"
                      value={form.values.email ?? ""}
                      onChange={form.handleChange}
                      onBlur={form.handleBlur}
                      aria-invalid={Boolean(fieldError(form, "email"))}
                    />
                    {fieldError(form, "email") && (
                      <p className="mt-1 text-sm text-destructive">{fieldError(form, "email")}</p>
                    )}
                  </div>
                </div>

                {templates.length > 1 && (
                  <div>
                    <Label htmlFor={templateFieldId}>Шаблон карты</Label>
                    <select
                      id={templateFieldId}
                      value={chosen?.id ?? ""}
                      onChange={(event) => setTemplateId(event.target.value)}
                      className="mt-2 w-full rounded-2xl border-2 border-border bg-surface px-4 py-3 text-lg"
                    >
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {catalog.isError && <ErrorState error={catalog.error} onRetry={() => catalog.refetch()} />}
                {catalog.isSuccess && templates.length === 0 && (
                  <p className="text-base text-destructive">
                    В магазине нет ни одного шаблона карты. Их настраивает Loal — напишите нам.
                  </p>
                )}

                {formError(form) && (
                  <p role="alert" className="text-base font-medium text-destructive">
                    {formError(form)}
                  </p>
                )}

                <Button type="submit" disabled={form.isSubmitting || catalog.isPending}>
                  {form.isSubmitting ? "Выпускаем…" : "Выпустить"}
                </Button>
              </Form>
            )}
          </Formik>
        )}
      </DialogContent>
    </Dialog>
  );
}
