import {
  APPLICATION_PLAN_LABELS,
  OCTOPAY_BLOCKER_LABELS,
  OCTOPAY_STATE_LABELS,
  type MerchantApplication,
} from "@loal/api";
import { formatDate } from "../../shared/lib/format";

/** Откуда заведение: заявка с лендинга, модель и как идёт открытие OctōPAY. */
export function ApplicationInfo({ application, compact = false }: { application: MerchantApplication; compact?: boolean }) {
  const state = application.octopayState ? OCTOPAY_STATE_LABELS[application.octopayState] ?? application.octopayState : null;
  const blocker = application.octopayBlocker ? OCTOPAY_BLOCKER_LABELS[application.octopayBlocker] ?? application.octopayBlocker : null;
  return (
    <div className={compact ? "text-sm text-muted-foreground" : "text-base"}>
      <p>
        Заявка с сайта · {APPLICATION_PLAN_LABELS[application.plan] ?? application.plan}
        {application.submittedAt ? ` · ${formatDate(application.submittedAt)}` : ""}
        {state ? ` · ${state}` : ""}
      </p>
      {blocker && (
        <p className={`mt-1 ${compact ? "" : "rounded-2xl bg-muted px-4 py-3"} text-destructive`}>{blocker}</p>
      )}
    </div>
  );
}
