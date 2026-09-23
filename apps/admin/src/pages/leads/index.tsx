import { LEAD_STATUS_LABELS } from "@loal/api";
import { Card, EmptyState, ErrorState, Loading, PageHeader } from "@loal/ui/page";
import { useLeads } from "../../entities/lead/api";
import { LeadStatusPicker } from "../../features/lead/status-picker";
import { formatDateTime, formatPhoneHref } from "../../shared/lib/format";

/** Заявки с лендинга: кто просил перезвонить и на какой стадии разговор. */
export function LeadsPage() {
  const leads = useLeads();
  const rows = leads.data ?? [];
  const newCount = rows.filter((lead) => lead.status === "new").length;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Заявки"
        description={
          rows.length > 0
            ? `${rows.length} всего, из них новых — ${newCount}.`
            : "Формы с лендинга приходят сюда, а не на почту."
        }
      />

      {leads.isPending && <Loading />}
      {leads.isError && <ErrorState error={leads.error} onRetry={() => leads.refetch()} />}
      {leads.isSuccess && rows.length === 0 && (
        <EmptyState title="Заявок пока нет" description="Как только кто-то оставит телефон на лендинге, он появится здесь." />
      )}

      <div className="flex flex-col gap-4">
        {rows.map((lead) => (
          <Card key={lead.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xl font-bold">{lead.name}</p>
                <p className="mt-1 text-lg">
                  <a href={formatPhoneHref(lead.phone)} className="text-flame-ink underline-offset-4 hover:underline">
                    {lead.phone}
                  </a>
                  {lead.company && <span className="text-slate"> · {lead.company}</span>}
                </p>
                {lead.comment && <p className="mt-3 max-w-[70ch] text-base text-slate">{lead.comment}</p>}
                <p className="mt-3 text-base text-slate">
                  {formatDateTime(lead.createdAt)} · {LEAD_STATUS_LABELS[lead.status]}
                </p>
              </div>
              <LeadStatusPicker lead={lead} />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
