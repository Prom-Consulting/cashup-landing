import { ApiError, rejectInputSchema, type RejectInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, Dialog, DialogContent, FormField, FormStatus, Textarea } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useRejectMerchant } from "../../entities/merchant/api";

function rejectError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "MERCHANT_NOT_PENDING_REVIEW") return "Заведение уже одобрено — отклонить можно только то, что ждёт проверки.";
    if (error.code === "MERCHANT_DELETED") return "Заведение в архиве и не было отклонено.";
    if (error.code === "REGISTRATION_HAS_MERCHANT") return "По заявке уже создано заведение — отклоните его в карточке заведения.";
    if (error.code === "REGISTRATION_COMPLETED") return "Подключение по заявке уже завершено.";
    if (error.status === 403) return "Отклонять может только супер-админ.";
    if (error.status === 404) return "Заявки больше нет — обновите список.";
  }
  return "Не удалось отклонить";
}

/**
 * Отклонить заведение «ждёт проверки» или заявку без заведения: причина уходит владельцу в
 * WhatsApp, номер освобождается для новой заявки. Повтор (ownerNotified: false) шлёт сообщение снова.
 */
export function RejectButton({
  id,
  kind,
  name,
  resend = false,
  previousReason,
  onDone,
}: {
  id: string;
  kind: "merchant" | "application";
  name: string;
  /** Уже отклонено, но WhatsApp не дошёл: повтор с прежней причиной. */
  resend?: boolean;
  previousReason?: string | null;
  onDone?: () => void;
}) {
  const reject = useRejectMerchant();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<string>();
  const initialValues: RejectInput = { reason: previousReason ?? "" };

  return (
    <Dialog open={open} onOpenChange={(next) => (setOpen(next), setNotice(undefined))}>
      <Button variant={resend ? "outline" : "danger"} size="sm" onClick={() => setOpen(true)}>
        {resend ? "Отправить причину снова" : "Отклонить"}
      </Button>
      <DialogContent
        title={resend ? "Отправить отказ снова" : `Отклонить «${name}»?`}
        description={
          resend
            ? "Отказ в силе, но сообщение владельцу не дошло. Повтор отправит прежнюю причину в WhatsApp."
            : kind === "merchant"
              ? "Заведение уйдёт в архив с отметкой «отклонён», номер владельца освободится — с него можно подать новую заявку. Причину владелец получит в WhatsApp."
              : "Заявка закроется как отклонённая, номер освободится для новой заявки. Причину владелец получит в WhatsApp."
        }
        className="w-[min(560px,calc(100vw-2rem))]"
      >
        {notice ? (
          <div className="mt-5 flex flex-col gap-4">
            <p role="status" className="rounded-2xl bg-muted px-4 py-3 text-base">
              {notice}
            </p>
            <Button className="self-end" onClick={() => (setOpen(false), onDone?.())}>
              Готово
            </Button>
          </div>
        ) : (
          <Formik
            initialValues={initialValues}
            validate={zodValidate(rejectInputSchema)}
            onSubmit={async (values, helpers) => {
              helpers.setStatus(undefined);
              try {
                const result = await reject.mutateAsync({ id, kind, input: values });
                setNotice(
                  result.ownerNotified === false
                    ? "Отклонено. Сообщение в WhatsApp не дошло — его можно отправить снова из карточки."
                    : "Отклонено. Владелец получил причину в WhatsApp.",
                );
              } catch (error) {
                applyServerIssues(error, helpers, rejectError(error));
              } finally {
                helpers.setSubmitting(false);
              }
            }}
          >
            {(form) => (
              <Form className="mt-5 flex flex-col gap-4" noValidate>
                <FocusFirstError form={form} />
                <FormField label="Причина отказа" hint="Её дословно получит владелец" error={fieldError(form, "reason")}>
                  {(parts) => (
                    <Textarea
                      {...parts}
                      name="reason"
                      rows={3}
                      autoFocus
                      readOnly={resend}
                      value={form.values.reason}
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
                  <Button type="submit" variant={resend ? "primary" : "danger"} disabled={form.isSubmitting}>
                    {form.isSubmitting ? "Отправляем…" : resend ? "Отправить" : "Отклонить"}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </DialogContent>
    </Dialog>
  );
}
