import { CashbackForm } from "@loal/app-kit";
import { PageHeader } from "@loal/ui/shadcn";
import { Navigate } from "react-router";
import { useBranches, useTariff } from "../../entities/merchant/api";
import { useCurrentMerchant } from "../../entities/session/model";

/** Кэшбэк за покупку деньгами — на тарифах «Больше клиентов» и «Очень много клиентов». */
export function CashbackPage() {
  const { merchantId, memberships, isBranchAdmin, branchIds } = useCurrentMerchant();
  const { abilities, isPending } = useTariff(merchantId ?? "");
  const branches = useBranches(merchantId ?? "");
  const workBranches = isBranchAdmin
    ? (branches.data ?? []).filter((branch) => !branch.archivedAt && branchIds.includes(branch.id))
    : undefined;

  // На тарифе без кэшбэка — к списанию
  if (!isPending && !abilities.cashback) return <Navigate to="/redeem" replace />;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Начислить кэшбэк"
        description="Клиент заплатил деньгами — отсканируйте его карту и введите сумму. Кэшбэк придёт бонусами на карту, тратить их можно у партнёров Loal."
      />
      {merchantId && <CashbackForm merchantId={memberships.length > 1 ? merchantId : undefined} branches={workBranches} />}
    </section>
  );
}
