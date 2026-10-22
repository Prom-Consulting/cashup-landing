import { LEAD_STATUS_LABELS, leadStatusSchema, type Lead } from "@loal/api";
import { cn } from "@loal/ui/shadcn";
import { useUpdateLeadStatus } from "../../entities/lead/api";

/** Цвет статуса: новая требует внимания, закрытая уходит в тень. */
export const LEAD_STATUS_TONE: Record<string, string> = {
  new: "bg-primary",
  contacted: "bg-amber",
  closed: "bg-muted-foreground/40",
};

/** Смена статуса прямо в строке — три кнопки, без выпадающего списка. */
export function LeadStatusPicker({ lead }: { lead: Lead }) {
  const update = useUpdateLeadStatus();
  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <div role="group" aria-label={`Статус заявки ${lead.name}`} className="inline-flex rounded-full bg-muted p-1">
        {leadStatusSchema.options.map((status) => {
          const active = lead.status === status;
          return (
            <button
              key={status}
              type="button"
              aria-pressed={active}
              disabled={update.isPending}
              onClick={() => !active && update.mutate({ id: lead.id, status })}
              className={cn(
                "inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:opacity-60",
                active ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", LEAD_STATUS_TONE[status])} />}
              {LEAD_STATUS_LABELS[status]}
            </button>
          );
        })}
      </div>
      {update.isError && (
        <p role="alert" className="text-sm text-destructive">
          Не удалось сохранить
        </p>
      )}
    </div>
  );
}
