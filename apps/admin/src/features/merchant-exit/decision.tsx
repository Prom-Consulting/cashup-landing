import { ApiError, rejectExitInputSchema, type ExitRequest, type RejectExitInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, ConfirmDialog, Dialog, DialogContent, FormField, FormStatus, Textarea } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useApproveExit, useRejectExit } from "../../entities/merchant-exit/api";

function decisionError(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.code === "EXIT_REQUEST_DECIDED") return "По этой заявке уже приняли другое решение — обновите список.";
    if (error.code === "EXIT_REQUEST_NOT_FOUND") return "Заявки больше нет — обновите список.";
    return error.message || fallback;
  }
  return fallback;
}

/** Подтвердить = удалить магазин. Повтор подтверждённой доводит удаление и заново шлёт WhatsApp. */
export function ApproveExitButton({ request, again = false }: { request: ExitRequest; again?: boolean }) {
  const approve = useApproveExit();
  const name = request.merchantName ?? "магазин";
  return (
    <ConfirmDialog
      trigger={
        <Button variant={again ? "outline" : "danger"} size="sm">
          {again ? "Отправить WhatsApp снова" : "Подтвердить выход"}
        </Button>
      }
      title={again ? "Отправить решение снова?" : `Отключить «${name}»?`}
      description={
        again
          ? "Выход уже подтверждён. Повтор доведёт удаление до конца, если оно прервалось, и снова отправит владельцу сообщение в WhatsApp."
          : `Магазин сразу пропадёт из каталога и перестанет принимать бонусы, сотрудников выкинет из кабинета, их номера освободятся.${
              request.octopay === "delete" ? " Аккаунт OctōPAY тоже закроется — так выбрал владелец." : ""
            } Вернуть можно в течение 30 дней, потом данные обезличатся. Владелец получит сообщение в WhatsApp.`
      }
      confirmLabel={again ? "Отправить" : "Подтвердить и удалить"}
      tone={again ? "primary" : "danger"}
      onConfirm={async () => {
        try {
          await approve.mutateAsync(request.id);
        } catch (error) {
          throw new Error(decisionError(error, "Не удалось подтвердить заявку"));
        }
      }}
    />
  );
}

/** Отказ — только с причиной: её дословно получит владелец в WhatsApp. */
export function RejectExitButton({ request, again = false }: { request: ExitRequest; again?: boolean }) {
  const reject = useRejectExit();
  const [open, setOpen] = useState(false);
  const initialValues: RejectExitInput = { comment: request.decisionComment ?? "" };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {again ? "Отправить WhatsApp снова" : "Отклонить"}
      </Button>
      <DialogContent
        title={again ? "Отправить отказ снова" : "Отклонить заявку"}
        description={`Магазин «${request.merchantName ?? "—"}» продолжит работать. Владелец получит в WhatsApp: «заявка отклонена. Причина: …».`}
        className="w-[min(560px,calc(100vw-2rem))]"
      >
        <Formik
          initialValues={initialValues}
          validate={zodValidate(rejectExitInputSchema)}
          onSubmit={async (values, helpers) => {
            helpers.setStatus(undefined);
            try {
              await reject.mutateAsync({ id: request.id, input: values });
              setOpen(false);
            } catch (error) {
              applyServerIssues(error, helpers, decisionError(error, "Не удалось отклонить заявку"));
            } finally {
              helpers.setSubmitting(false);
            }
          }}
        >
          {(form) => (
            <Form className="mt-5 flex flex-col gap-5" noValidate>
              <FocusFirstError form={form} />
              <FormField label="Причина отказа" hint="Например: сначала закройте счета" error={fieldError(form, "comment")}>
                {(parts) => (
                  <Textarea
                    {...parts}
                    name="comment"
                    rows={3}
                    autoFocus
                    readOnly={again}
                    value={form.values.comment}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </FormField>
              <FormStatus message={formError(form)} />
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={form.isSubmitting}>
                  Отмена
                </Button>
                <Button type="submit" disabled={form.isSubmitting}>
                  {form.isSubmitting ? "Отправляем…" : again ? "Отправить" : "Отклонить"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}
