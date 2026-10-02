import { RedeemForm, useCoverageLimit } from "@loal/app-kit";
import { ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { useBranches } from "../../entities/merchant/api";
import { useCurrentMerchant } from "../../entities/session/model";

/** Списание бонусов за покупку прямо из браузера — то же, что делает приложение кассы. */
export function RedeemPage() {
  const { merchantId, memberships, isBranchAdmin, branchIds } = useCurrentMerchant();
  const limit = useCoverageLimit(merchantId ?? "");
  const branches = useBranches(merchantId ?? "");
  // Администратор нескольких филиалов выбирает, на какой записать операцию; владельцу филиал не нужен
  const workBranches = isBranchAdmin
    ? (branches.data ?? []).filter((branch) => !branch.archivedAt && branchIds.includes(branch.id))
    : undefined;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Списать бонусы"
        description="Отсканируйте карту и добавьте покупку — бонусы закроют часть цены, остальное клиент платит как обычно."
      />
      {limit.isPending && <Loading rows={3} />}
      {limit.isError && <ErrorState error={limit.error} onRetry={() => limit.refetch()} />}
      {limit.isSuccess && merchantId && (
        <RedeemForm
          ceiling={limit.data.maxCoveragePercent}
          // С одним местом работы сервер сам знает заведение и лишнее поле отклоняет
          merchantId={memberships.length > 1 ? merchantId : undefined}
          branches={workBranches}
        />
      )}
    </section>
  );
}
