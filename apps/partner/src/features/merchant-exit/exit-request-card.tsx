import { exitRequestInputSchema, type ExitRequestInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Badge, Button, Card, ErrorState, FormField, FormStatus, Loading, Textarea } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useExitRequest, useRequestExit } from "../../entities/merchant/api";
import { formatDateTime } from "../../shared/lib/format";

/**
 * Выход из программы: сам магазин себя не удаляет — владелец подаёт заявку, агентство решает,
 * ответ приходит в WhatsApp. После подтверждения кабинет закрывается (410), поэтому статус
 * «подтверждена» здесь почти не увидеть.
 */
export function ExitRequestCard({ merchantId }: { merchantId: string }) {
  const current = useExitRequest(merchantId, true);
  const request = useRequestExit(merchantId);
  const [writing, setWriting] = useState(false);
  const initialValues: ExitRequestInput = { reason: "" };

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">Выход из программы Loal</h2>
      {current.isPending && <Loading rows={1} />}
      {current.isError && <ErrorState error={current.error} onRetry={() => current.refetch()} />}

      {current.isSuccess && current.data?.status === "pending" && (
        <>
          <div>
            <Badge tone="warn">Заявка на рассмотрении</Badge>
          </div>
          <p className="max-w-[60ch] text-base text-muted-foreground">
            Подана {formatDateTime(current.data.createdAt)}
            {current.data.reason ? ` с причиной «${current.data.reason}»` : ""}. Решение придёт в WhatsApp. Пока
            заявку рассматривают, магазин работает как обычно.
          </p>
        </>
      )}

      {current.isSuccess && current.data?.status === "rejected" && !writing && (
        <p role="status" className="rounded-2xl bg-muted px-4 py-3 text-base">
          Прошлую заявку отклонили {formatDateTime(current.data.decidedAt)}
          {current.data.decisionComment ? `: «${current.data.decisionComment}»` : ""}. Можно подать новую.
        </p>
      )}

      {current.isSuccess && current.data?.status !== "pending" && !writing && (
        <>
          <p className="max-w-[60ch] text-base text-muted-foreground">
            Если решили уйти, оставьте заявку — агентство её рассмотрит. После подтверждения магазин пропадёт из каталога
            и перестанет принимать бонусы, а через 30 дней его данные удалятся.
          </p>
          <Button variant="outline" className="self-start" onClick={() => setWriting(true)}>
            Подать заявку на выход
          </Button>
        </>
      )}

      {writing && (
        <Formik
          initialValues={initialValues}
          validate={zodValidate(exitRequestInputSchema)}
          onSubmit={async (values, helpers) => {
            helpers.setStatus(undefined);
            try {
              await request.mutateAsync(values);
              setWriting(false);
            } catch (error) {
              applyServerIssues(error, helpers, "Не удалось отправить заявку");
            } finally {
              helpers.setSubmitting(false);
            }
          }}
        >
          {(form) => (
            <Form className="flex flex-col gap-4" noValidate>
              <FocusFirstError form={form} />
              <p className="max-w-[60ch] text-base text-muted-foreground">
                После подтверждения магазин отключится сразу: пропадёт из каталога, перестанет принимать бонусы,
                сотрудники не смогут войти. Через 30 дней контакты и витрина удалятся. Отменить это нельзя.
              </p>
              <FormField label="Почему уходите" hint="Необязательно" error={fieldError(form, "reason")}>
                {(parts) => (
                  <Textarea
                    {...parts}
                    name="reason"
                    rows={3}
                    value={form.values.reason}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </FormField>
              <FormStatus message={formError(form)} />
              <div className="flex flex-wrap gap-3">
                <Button type="submit" variant="danger" disabled={form.isSubmitting}>
                  {form.isSubmitting ? "Отправляем…" : "Отправить заявку"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setWriting(false)} disabled={form.isSubmitting}>
                  Отмена
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      )}
    </Card>
  );
}
