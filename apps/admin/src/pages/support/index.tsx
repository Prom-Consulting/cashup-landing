import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { type SupportStatus } from "@loal/api";
import { SupportMessages, SupportReplyForm, SupportStatusBadge, SupportTicketList, supportWhen } from "@loal/app-kit";
import { formatPhone } from "@loal/ui/inputs";
import { Button, Card, EmptyState, ErrorState, Icon, Loading, PageHeader, cn } from "@loal/ui/shadcn";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useCloseSupportTicket, useReplySupport, useSupportThread, useSupportTickets } from "../../entities/support/api";
import { formatPhoneHref } from "../../shared/lib/format";

type Filter = SupportStatus | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "open", label: "Ждут ответа" },
  { id: "answered", label: "Отвечено" },
  { id: "closed", label: "Закрыты" },
  { id: "all", label: "Все" },
];

function Thread({ ticketId }: { ticketId: string }) {
  const thread = useSupportThread(ticketId);
  const reply = useReplySupport(ticketId);
  const close = useCloseSupportTicket(ticketId);
  const [notice, setNotice] = useState<string | null>(null);

  if (thread.isPending) return <Loading rows={4} />;
  if (thread.isError) return <ErrorState error={thread.error} onRetry={() => thread.refetch()} />;
  const { ticket, messages } = thread.data;
  const phone = ticket.author?.phone?.replace(/\D/g, "");

  return (
    <>
      <Link
        to="/support"
        className="mb-4 inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground lg:hidden"
      >
        <Icon icon={ArrowLeft01Icon} />
        Все вопросы
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <h2 className="text-xl leading-tight font-bold break-words">{ticket.subject}</h2>
          <p className="mt-1 text-base">
            <Link to={`/merchants/${ticket.merchantId}`} className="font-semibold underline-offset-4 hover:underline">
              {ticket.merchantName ?? "Заведение"}
            </Link>
            {ticket.author?.name && <span className="text-muted-foreground">, {ticket.author.name}</span>}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
            <span>Задан {supportWhen(ticket.createdAt)}</span>
            {phone && (
              <>
                <a href={formatPhoneHref(`+${phone}`)} className="tabular-nums underline-offset-4 hover:underline">
                  {formatPhone(phone)}
                </a>
                <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                  WhatsApp
                </a>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SupportStatusBadge status={ticket.status} side="agency" />
          {ticket.status !== "closed" && (
            <Button size="sm" variant="outline" disabled={close.isPending} onClick={() => close.mutate()}>
              Закрыть
            </Button>
          )}
        </div>
      </div>
      <div className="py-6">
        <SupportMessages messages={messages} side="agency" otherName={ticket.merchantName} />
      </div>
      {notice && (
        <p role="status" className="mb-3 text-base text-muted-foreground">
          {notice}
        </p>
      )}
      <SupportReplyForm
        onSubmit={async (input) => {
          setNotice(null);
          const result = await reply.mutateAsync(input);
          setNotice(
            result.notified
              ? "Ответ отправлен — продублировали в WhatsApp."
              : "Ответ сохранён, но WhatsApp не доставил его. Партнёр увидит ответ в кабинете.",
          );
        }}
        placeholder="Ответ партнёру — его увидят в кабинете и в WhatsApp"
        submitLabel="Ответить"
        hint="Ctrl + Enter — отправить"
      />
    </>
  );
}

/** Вопросы заведений: входящие слева, переписка справа. Ответ уходит партнёру и в WhatsApp. */
export function SupportPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("open");
  const tickets = useSupportTickets(filter);
  const summary = tickets.data?.summary;
  const list = tickets.data?.items ?? [];
  const counts: Record<Filter, number | undefined> = {
    open: summary?.open,
    answered: summary?.answered,
    closed: summary?.closed,
    all: summary ? summary.open + summary.answered + summary.closed : undefined,
  };

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Поддержка"
        description="Вопросы владельцев и администраторов филиалов. Ответ приходит им в кабинет и в WhatsApp."
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Статус вопросов">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            onClick={() => setFilter(item.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-base transition-colors",
              filter === item.id ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground",
            )}
          >
            {item.label}
            {counts[item.id] !== undefined && <span className="tabular-nums opacity-70">{counts[item.id]}</span>}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(300px,420px)_minmax(0,1fr)]">
        <Card className={cn("overflow-hidden p-0", ticketId && "hidden lg:block")}>
          {tickets.isPending ? (
            <div className="p-6">
              <Loading rows={4} />
            </div>
          ) : tickets.isError ? (
            <div className="p-6">
              <ErrorState error={tickets.error} onRetry={() => tickets.refetch()} />
            </div>
          ) : list.length === 0 ? (
            <EmptyState
              title={filter === "open" ? "Все вопросы отвечены" : "Здесь пусто"}
              description={filter === "open" ? "Новый вопрос появится здесь сам." : undefined}
            />
          ) : (
            <SupportTicketList
              tickets={list}
              selectedId={ticketId}
              onSelect={(ticket) => navigate(`/support/${ticket.id}`)}
              side="agency"
            />
          )}
        </Card>

        <Card className={cn(!ticketId && "hidden lg:block")}>
          {ticketId ? (
            <Thread key={ticketId} ticketId={ticketId} />
          ) : (
            <div className="grid min-h-[280px] place-items-center text-center">
              <p className="max-w-[36ch] text-lg text-muted-foreground">Выберите вопрос слева, чтобы ответить.</p>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
