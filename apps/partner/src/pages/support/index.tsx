import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import {
  SupportMessages,
  SupportReplyForm,
  SupportStatusBadge,
  SupportTicketForm,
  SupportTicketList,
  supportWhen,
} from "@loal/app-kit";
import { Button, Card, EmptyState, ErrorState, Icon, Loading, PageHeader, cn } from "@loal/ui/shadcn";
import { Link, useNavigate, useParams } from "react-router";
import {
  useCloseSupportTicket,
  useCreateSupportTicket,
  useReplySupport,
  useSupportThread,
  useSupportTickets,
} from "../../entities/support/api";
import { useCurrentMerchant } from "../../entities/session/model";

function BackToList() {
  return (
    <Link
      to="/support"
      className="mb-4 inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground lg:hidden"
    >
      <Icon icon={ArrowLeft01Icon} />
      Все вопросы
    </Link>
  );
}

function NewTicket({ merchantId }: { merchantId: string }) {
  const create = useCreateSupportTicket(merchantId);
  const navigate = useNavigate();
  return (
    <>
      <BackToList />
      <h2 className="text-xl font-bold">Новый вопрос</h2>
      <p className="mt-1 mb-6 text-base text-muted-foreground">
        Ответим здесь и продублируем в WhatsApp на ваш номер.
      </p>
      <SupportTicketForm
        onSubmit={async (input) => {
          const ticket = await create.mutateAsync(input);
          navigate(`/support/${ticket.id}`, { replace: true });
        }}
        onCancel={() => navigate("/support")}
      />
    </>
  );
}

function Thread({ merchantId, ticketId }: { merchantId: string; ticketId: string }) {
  const thread = useSupportThread(merchantId, ticketId);
  const reply = useReplySupport(merchantId, ticketId);
  const close = useCloseSupportTicket(merchantId, ticketId);

  if (thread.isPending) return <Loading rows={4} />;
  if (thread.isError) return <ErrorState error={thread.error} onRetry={() => thread.refetch()} />;
  const { ticket, messages } = thread.data;
  const closed = ticket.status === "closed";

  return (
    <>
      <BackToList />
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <h2 className="text-xl leading-tight font-bold break-words">{ticket.subject}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Задан {supportWhen(ticket.createdAt)}
            {ticket.author?.name ? `, ${ticket.author.name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SupportStatusBadge status={ticket.status} side="merchant" />
          {!closed && (
            <Button size="sm" variant="outline" disabled={close.isPending} onClick={() => close.mutate()}>
              Вопрос решён
            </Button>
          )}
        </div>
      </div>
      <div className="py-6">
        <SupportMessages messages={messages} side="merchant" />
      </div>
      <SupportReplyForm
        onSubmit={(input) => reply.mutateAsync(input)}
        placeholder={closed ? "Написать снова — вопрос откроется" : "Уточнение или ответ"}
        hint="Ctrl + Enter — отправить"
      />
    </>
  );
}

/**
 * Поддержка: вопросы заведения команде Loal. Слева — вопросы, справа — переписка или новый
 * вопрос. На телефоне по одному: список, а по нажатию — переписка со ссылкой назад.
 */
export function SupportPage() {
  const { merchantId } = useCurrentMerchant();
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const tickets = useSupportTickets(merchantId ?? "");
  const creating = ticketId === "new";
  const detailOpen = Boolean(ticketId);

  if (!merchantId) return null;

  const list = tickets.data ?? [];

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Поддержка"
        description="Спросите команду Loal о кабинете, оплате или бонусах. Ответ придёт сюда и в WhatsApp."
        action={
          !creating && (
            <Button asChild>
              <Link to="/support/new">Задать вопрос</Link>
            </Button>
          )
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(300px,400px)_minmax(0,1fr)]">
        <Card className={cn("overflow-hidden p-0", detailOpen && "hidden lg:block")}>
          {tickets.isPending ? (
            <div className="p-6">
              <Loading rows={3} />
            </div>
          ) : tickets.isError ? (
            <div className="p-6">
              <ErrorState error={tickets.error} onRetry={() => tickets.refetch()} />
            </div>
          ) : list.length === 0 ? (
            <EmptyState
              title="Вопросов пока нет"
              description="Что-то не работает или непонятно — напишите, ответим в рабочее время."
            />
          ) : (
            <SupportTicketList
              tickets={list}
              selectedId={ticketId}
              onSelect={(ticket) => navigate(`/support/${ticket.id}`)}
              side="merchant"
            />
          )}
        </Card>

        <Card className={cn(!detailOpen && "hidden lg:block")}>
          {creating ? (
            <NewTicket merchantId={merchantId} />
          ) : ticketId ? (
            <Thread key={ticketId} merchantId={merchantId} ticketId={ticketId} />
          ) : (
            <div className="grid min-h-[280px] place-items-center text-center">
              <p className="max-w-[36ch] text-lg text-muted-foreground">
                {list.length > 0 ? "Выберите вопрос слева, чтобы открыть переписку." : "Здесь появится переписка с командой Loal."}
              </p>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
