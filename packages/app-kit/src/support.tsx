import {
  SUPPORT_STATUS_LABELS,
  supportReplyInputSchema,
  supportTicketInputSchema,
  type SupportMessage,
  type SupportReplyInput,
  type SupportStatus,
  type SupportTicket,
  type SupportTicketInput,
} from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Badge, Button, FormField, Input, Textarea, cn } from "@loal/ui/shadcn";
import { formatPhone } from "@loal/ui/inputs";
import { Form, Formik } from "formik";
import { useEffect, useRef } from "react";

/**
 * Поддержка: вопрос магазина агентству и переписка по нему. Один набор на оба кабинета —
 * side говорит, с чьей стороны смотрим: свои сообщения справа, статус подписан для этой стороны.
 */
type Side = "merchant" | "agency";

const time = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" });
const day = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });
const dayYear = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" });

/** «сегодня, 19:06», «вчера, 11:32», «24 сент., 11:32». */
export function supportWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const today = new Date();
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((start(today) - start(date)) / 86_400_000);
  if (days === 0) return `сегодня, ${time.format(date)}`;
  if (days === 1) return `вчера, ${time.format(date)}`;
  return `${date.getFullYear() === today.getFullYear() ? day.format(date) : dayYear.format(date)}, ${time.format(date)}`;
}

const isStatus = (status: string): status is SupportStatus => status in SUPPORT_STATUS_LABELS.merchant;

/** Тон — то, что ждёт действия этой стороны: у агентства новый вопрос, у магазина ответ. */
export function SupportStatusBadge({ status, side }: { status: string; side: Side }) {
  if (!isStatus(status)) return <Badge tone="quiet">{status}</Badge>;
  const waitsForMe = (side === "agency" && status === "open") || (side === "merchant" && status === "answered");
  return (
    <Badge tone={status === "closed" ? "quiet" : waitsForMe ? "warn" : "neutral"}>
      {SUPPORT_STATUS_LABELS[side][status]}
    </Badge>
  );
}

export function SupportTicketList({
  tickets,
  selectedId,
  onSelect,
  side,
}: {
  tickets: SupportTicket[];
  selectedId?: string;
  onSelect: (ticket: SupportTicket) => void;
  side: Side;
}) {
  return (
    <ul className="divide-y divide-border">
      {tickets.map((ticket) => {
        const selected = ticket.id === selectedId;
        const preview = ticket.lastMessage
          ? `${ticket.lastMessage.side === side ? "Вы: " : side === "merchant" ? "Loal: " : ""}${ticket.lastMessage.body}`
          : "";
        return (
          <li key={ticket.id}>
            <button
              type="button"
              onClick={() => onSelect(ticket)}
              aria-current={selected || undefined}
              className={cn(
                "relative grid w-full gap-1 px-5 py-4 text-left transition-colors hover:bg-muted/60",
                selected && "bg-muted/70 shadow-[inset_-3px_0_0_var(--foreground)]",
              )}
            >
              {ticket.unread && (
                <span aria-hidden="true" className="absolute top-4 bottom-4 left-0 w-1 rounded-r-full bg-primary" />
              )}
              <span className="flex items-baseline justify-between gap-3">
                <span className={cn("min-w-0 truncate text-lg leading-tight", ticket.unread ? "font-bold" : "font-semibold")}>
                  {ticket.subject}
                </span>
                <span className="shrink-0 text-sm text-muted-foreground">{supportWhen(ticket.lastMessageAt)}</span>
              </span>
              {side === "agency" && (
                <span className="truncate text-base text-muted-foreground">
                  {[ticket.merchantName, ticket.author?.name || (ticket.author?.phone ? formatPhone(ticket.author.phone) : null)]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}
              <span className="flex items-center justify-between gap-3">
                <span className="line-clamp-1 min-w-0 text-base text-muted-foreground">{preview}</span>
                <span className="shrink-0">
                  <SupportStatusBadge status={ticket.status} side={side} />
                </span>
              </span>
              {ticket.unread && <span className="sr-only">Есть новое сообщение</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function SupportMessages({
  messages,
  side,
  otherName,
}: {
  messages: SupportMessage[];
  side: Side;
  /** Как подписать другую сторону, если у автора нет имени, — например, название заведения. */
  otherName?: string | null;
}) {
  const end = useRef<HTMLDivElement>(null);
  // Новое сообщение — внизу ленты, туда и прокручиваем
  // В фигурных скобках: новый Chrome возвращает из scrollIntoView промис, а React ждёт от эффекта только функцию
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  return (
    <ol className="flex flex-col gap-4" aria-label="Переписка">
      {messages.map((message) => {
        const mine = message.side === side;
        return (
          <li key={message.id} className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}>
            <span className="px-1 text-sm text-muted-foreground">
              {mine ? "Вы" : message.authorName || otherName || (message.side === "agency" ? "Поддержка Loal" : "Заведение")} ·{" "}
              {supportWhen(message.createdAt)}
            </span>
            <p
              className={cn(
                "max-w-[min(62ch,88%)] rounded-3xl px-5 py-3 text-base leading-relaxed break-words whitespace-pre-wrap",
                mine ? "rounded-br-lg bg-graphite text-paper" : "rounded-bl-lg bg-muted text-foreground",
              )}
            >
              {message.body}
            </p>
          </li>
        );
      })}
      <div ref={end} />
    </ol>
  );
}

const replyInitial: SupportReplyInput = { message: "" };

/** Ответ в ветку. Ctrl/Cmd + Enter — отправить, обычный Enter — новая строка. */
export function SupportReplyForm({
  onSubmit,
  placeholder = "Ваше сообщение",
  submitLabel = "Отправить",
  hint,
}: {
  onSubmit: (input: SupportReplyInput) => Promise<unknown>;
  placeholder?: string;
  submitLabel?: string;
  hint?: string;
}) {
  return (
    <Formik
      initialValues={replyInitial}
      validate={zodValidate(supportReplyInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          await onSubmit(values);
          helpers.resetForm();
        } catch (error) {
          applyServerIssues(error, helpers, "Не отправилось. Попробуйте ещё раз.");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-3" noValidate>
          <FocusFirstError form={form} />
          <FormField label="Ответ" hint={hint} error={fieldError(form, "message")} className="[&>label]:sr-only">
            {(parts) => (
              <Textarea
                id={parts.id}
                describedBy={parts.describedBy}
                invalid={parts.invalid}
                name="message"
                rows={3}
                placeholder={placeholder}
                value={form.values.message}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    void form.submitForm();
                  }
                }}
                className="min-h-[96px]"
              />
            )}
          </FormField>
          {formError(form) && (
            <p role="alert" className="text-base font-medium text-destructive">
              {formError(form)}
            </p>
          )}
          <Button type="submit" disabled={form.isSubmitting} className="self-end">
            {form.isSubmitting ? "Отправляем…" : submitLabel}
          </Button>
        </Form>
      )}
    </Formik>
  );
}

const ticketInitial: SupportTicketInput = { subject: "", message: "" };

/** Новый вопрос: тема строкой и сам вопрос. */
export function SupportTicketForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: SupportTicketInput) => Promise<unknown>;
  onCancel?: () => void;
}) {
  return (
    <Formik
      initialValues={ticketInitial}
      validate={zodValidate(supportTicketInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          await onSubmit(values);
        } catch (error) {
          applyServerIssues(error, helpers, "Не отправилось. Попробуйте ещё раз.");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-5" noValidate>
          <FocusFirstError form={form} />
          <FormField label="Тема" hint="Например: «Не проходит списание» или «Как добавить филиал»" error={fieldError(form, "subject")}>
            {(parts) => (
              <Input
                id={parts.id}
                describedBy={parts.describedBy}
                invalid={parts.invalid}
                name="subject"
                maxLength={120}
                value={form.values.subject}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </FormField>
          <FormField
            label="Вопрос"
            hint="Что случилось и где: номер клиента, сумма, время — так ответим быстрее"
            error={fieldError(form, "message")}
          >
            {(parts) => (
              <Textarea
                id={parts.id}
                describedBy={parts.describedBy}
                invalid={parts.invalid}
                name="message"
                rows={6}
                value={form.values.message}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </FormField>
          {formError(form) && (
            <p role="alert" className="text-base font-medium text-destructive">
              {formError(form)}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={form.isSubmitting}>
              {form.isSubmitting ? "Отправляем…" : "Отправить вопрос"}
            </Button>
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Отмена
              </Button>
            )}
          </div>
        </Form>
      )}
    </Formik>
  );
}
