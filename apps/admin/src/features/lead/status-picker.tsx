import { LEAD_STATUS_LABELS, leadStatusSchema, type Lead, type LeadStatus } from "@loal/api";
import { Select } from "@loal/ui/select";
import { useId } from "react";
import { useUpdateLeadStatus } from "../../entities/lead/api";

const options = leadStatusSchema.options.map((id) => ({ id, label: LEAD_STATUS_LABELS[id] }));

/** Смена статуса заявки прямо в списке. */
export function LeadStatusPicker({ lead }: { lead: Lead }) {
  const id = useId();
  const update = useUpdateLeadStatus();

  return (
    <div className="w-[200px]">
      <label htmlFor={id} className="sr-only">
        Статус заявки {lead.name}
      </label>
      <Select
        id={id}
        invalid={update.isError}
        value={lead.status}
        options={options}
        onChange={(status) => update.mutate({ id: lead.id, status: status as LeadStatus })}
      />
      {update.isError && (
        <p role="alert" className="mt-1 text-sm text-flame-ink">
          Не удалось сохранить
        </p>
      )}
    </div>
  );
}
