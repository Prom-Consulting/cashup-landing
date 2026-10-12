import { Search01Icon } from "@hugeicons/core-free-icons";
import { LEAD_STATUS_LABELS, type Lead, type LeadStatus } from "@loal/api";
import { formatPhone } from "@loal/ui/inputs";
import { Card, EmptyState, ErrorState, Icon, Input, Loading, PageHeader, cn } from "@loal/ui/shadcn";
import { useMemo, useState } from "react";
import { useLeads } from "../../entities/lead/api";
import { LEAD_STATUS_TONE, LeadStatusPicker } from "../../features/lead/status-picker";
import { formatPhoneHref } from "../../shared/lib/format";

type Filter = LeadStatus | "all";

const time = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" });
const day = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });
const dayYear = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" });

/** «Сегодня, 19:06», «вчера, 11:32», «24 сент., 11:32» — как во входящих. */
function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const today = new Date();
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((start(today) - start(date)) / 86_400_000);
  if (days === 0) return `сегодня, ${time.format(date)}`;
  if (days === 1) return `вчера, ${time.format(date)}`;
  return `${date.getFullYear() === today.getFullYear() ? day.format(date) : dayYear.format(date)}, ${time.format(date)}`;
}

const digits = (phone: string) => phone.replace(/\D/g, "");

function LeadRow({ lead }: { lead: Lead }) {
  const phone = digits(lead.phone);
  const fresh = lead.status === "new";
  return (
    <li className="relative grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:px-6">
      {/* Новая заявка — полоска слева: видно, что ещё никто не звонил */}
      {fresh && <span aria-hidden="true" className="absolute top-4 bottom-4 left-0 w-1 rounded-r-full bg-primary" />}
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className={cn("text-lg leading-tight", fresh ? "font-bold" : "font-semibold")}>{lead.name}</p>
          {lead.company && lead.company !== lead.name && (
            <p className="text-base text-muted-foreground">{lead.company}</p>
          )}
          <p className="text-sm text-muted-foreground">{when(lead.createdAt)}</p>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-base">
          <a href={formatPhoneHref(`+${phone}`)} className="font-medium tabular-nums underline-offset-4 hover:underline">
            {formatPhone(phone)}
          </a>
          <a
            href={`https://wa.me/${phone}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            WhatsApp
          </a>
        </div>
        {lead.comment && (
          <p className="mt-2 line-clamp-2 max-w-[80ch] text-base text-muted-foreground" title={lead.comment}>
            {lead.comment}
          </p>
        )}
      </div>
      <LeadStatusPicker lead={lead} />
    </li>
  );
}

/** Заявки с лендинга как входящие: новые сверху вкладкой, статус меняется прямо в строке. */
export function LeadsPage() {
  const leads = useLeads();
  const [filter, setFilter] = useState<Filter>("new");
  const [query, setQuery] = useState("");
  const all = leads.data ?? [];

  const counts = useMemo(() => {
    const result: Record<Filter, number> = { all: all.length, new: 0, contacted: 0, closed: 0 };
    for (const lead of all) result[lead.status] += 1;
    return result;
  }, [all]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const needleDigits = digits(needle);
    return all
      .filter((lead) => filter === "all" || lead.status === filter)
      .filter(
        (lead) =>
          !needle ||
          `${lead.name} ${lead.company ?? ""} ${lead.comment ?? ""}`.toLowerCase().includes(needle) ||
          (needleDigits.length >= 3 && digits(lead.phone).includes(needleDigits)),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [all, filter, query]);

  const tabs: { value: Filter; label: string }[] = [
    { value: "new", label: "Новые" },
    { value: "contacted", label: LEAD_STATUS_LABELS.contacted },
    { value: "closed", label: "Закрытые" },
    { value: "all", label: "Все" },
  ];

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Заявки"
        description="Кто оставил телефон на сайте. Позвоните или напишите в WhatsApp и отметьте, что связались."
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Статус" className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={filter === tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-full border-2 px-4 text-base transition-colors",
                filter === tab.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface hover:border-foreground/40",
              )}
            >
              {tab.value !== "all" && (
                <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", LEAD_STATUS_TONE[tab.value])} />
              )}
              {tab.label}
              {leads.isSuccess && <span className="tabular-nums opacity-70">{counts[tab.value]}</span>}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-[340px]">
          <Icon icon={Search01Icon} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Имя, телефон или заведение"
            aria-label="Поиск по заявкам"
            className="pl-12"
          />
        </div>
      </div>

      {leads.isPending && <Loading />}
      {leads.isError && <ErrorState error={leads.error} onRetry={() => leads.refetch()} />}
      {leads.isSuccess && rows.length === 0 && (
        <EmptyState
          title={query ? "Ничего не нашлось" : filter === "new" ? "Новых заявок нет" : "Здесь пусто"}
          description={
            query
              ? "Попробуйте другое имя или часть номера."
              : filter === "new"
                ? "Все заявки разобраны. Новые с сайта появятся здесь."
                : undefined
          }
        />
      )}

      {rows.length > 0 && (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-border">
            {rows.map((lead) => (
              <LeadRow key={lead.id} lead={lead} />
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}
