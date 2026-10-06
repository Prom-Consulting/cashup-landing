import {
  EXIT_REQUEST_STATUSES,
  EXIT_REQUEST_STATUS_LABELS,
  type ExitRequest,
  type ExitRequestStatus,
} from "@loal/api";
import { Badge, Card, EmptyState, ErrorState, Loading, PageHeader, cn } from "@loal/ui/shadcn";
import { useState } from "react";
import { Link } from "react-router";
import { useExitRequests } from "../../entities/merchant-exit/api";
import { ApproveExitButton, RejectExitButton } from "../../features/merchant-exit/decision";
import { formatDateTime, formatPhoneHref } from "../../shared/lib/format";

type Filter = ExitRequestStatus | "all";
const FILTERS: { value: Filter; label: string }[] = [
  ...EXIT_REQUEST_STATUSES.map((value) => ({ value, label: EXIT_REQUEST_STATUS_LABELS[value] })),
  { value: "all", label: "Все" },
];

const TONE: Record<string, "warn" | "neutral" | "quiet"> = { pending: "warn", approved: "neutral", rejected: "quiet" };

function RequestCard({ request }: { request: ExitRequest }) {
  const status = request.status as ExitRequestStatus;
  const decided = status === "approved" || status === "rejected";
  // Решение есть, а WhatsApp не дошёл — повторное решение отправит его снова
  const notDelivered = decided && request.ownerNotified === false;
  const person = request.requestedBy;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/merchants/${request.merchantId}`}
            className="text-xl font-bold underline-offset-4 hover:underline"
          >
            {request.merchantName ?? "Магазин"}
          </Link>
          <p className="mt-1 text-base text-muted-foreground">
            Подана {formatDateTime(request.createdAt)}
            {person?.name || person?.phone ? " · " : ""}
            {person?.name}
            {person?.phone && (
              <>
                {person.name ? ", " : ""}
                <a href={formatPhoneHref(`+${person.phone.replace(/^\+/, "")}`)} className="tabular-nums underline-offset-4 hover:underline">
                  +{person.phone.replace(/^\+/, "")}
                </a>
              </>
            )}
          </p>
        </div>
        <Badge tone={TONE[status] ?? "quiet"}>{EXIT_REQUEST_STATUS_LABELS[status] ?? request.status}</Badge>
      </div>

      <p className="max-w-[70ch] text-lg leading-snug">
        {request.reason ? `«${request.reason}»` : <span className="text-muted-foreground">Причину не указали</span>}
      </p>

      {decided && (
        <p className="text-base text-muted-foreground">
          {status === "approved" ? "Подтверждена" : "Отклонена"} {formatDateTime(request.decidedAt)}
          {request.decisionComment ? ` · причина: «${request.decisionComment}»` : ""}
          {status === "approved" ? " · магазин удалён, данные обезличатся через 30 дней" : ""}
        </p>
      )}

      {notDelivered && (
        <p role="status" className="rounded-2xl bg-muted px-4 py-3 text-base">
          Сообщение в WhatsApp владельцу не дошло — решение в силе, но он о нём не знает.
        </p>
      )}

      {(status === "pending" || notDelivered) && (
        <div className="flex flex-wrap gap-3">
          {status === "pending" && (
            <>
              <ApproveExitButton request={request} />
              <RejectExitButton request={request} />
            </>
          )}
          {notDelivered && status === "approved" && <ApproveExitButton request={request} again />}
          {notDelivered && status === "rejected" && <RejectExitButton request={request} again />}
        </div>
      )}
    </Card>
  );
}

/** Заявки владельцев на выход из программы. Подтверждение — обычное удаление магазина. */
export function ExitRequestsPage() {
  const [filter, setFilter] = useState<Filter>("pending");
  const requests = useExitRequests(filter);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Выход из программы"
        description="Владелец подаёт заявку в кабинете партнёра, решение приходит ему в WhatsApp."
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Статус заявок">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
            className={cn(
              "min-h-10 rounded-full border-2 px-4 text-base transition-colors",
              filter === item.value
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-surface hover:border-foreground/40",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {requests.isPending && <Loading />}
      {requests.isError && <ErrorState error={requests.error} onRetry={() => requests.refetch()} />}
      {requests.isSuccess && requests.data.length === 0 && (
        <EmptyState
          title={filter === "pending" ? "Новых заявок нет" : "Заявок нет"}
          description={filter === "pending" ? "Когда владелец попросит отключить магазин, заявка появится здесь." : undefined}
        />
      )}
      <div className="flex flex-col gap-4">
        {(requests.data ?? []).map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>
    </section>
  );
}
