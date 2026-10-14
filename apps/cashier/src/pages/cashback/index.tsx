import { CashbackForm } from "@loal/app-kit";
import { ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { Navigate } from "react-router";
import { useCashierAbilities, useCashierOverview, useCashierSession, useRefreshAfterRedeem } from "../../entities/cashier/api";

const DESCRIPTION =
  "Клиент заплатил деньгами — отсканируйте его карту и введите сумму. Кэшбэк придёт бонусами на карту, тратить их можно у партнёров Loal.";

/** Кэшбэк на кассе — тарифы «Больше клиентов» и «Очень много клиентов». */
export function CashbackPage() {
  const { kind, merchantId, manyPlaces } = useCashierSession();
  const abilities = useCashierAbilities();
  const overview = useCashierOverview(kind === "branch");
  const refresh = useRefreshAfterRedeem();

  if (!abilities.isPending && !abilities.cashback) return <Navigate to="/redeem" replace />;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Начислить кэшбэк" description={DESCRIPTION} />
      {kind === "branch" && overview.isPending && <Loading rows={3} />}
      {kind === "branch" && overview.isError && <ErrorState error={overview.error} onRetry={() => overview.refetch()} />}
      {(kind !== "branch" || overview.isSuccess) && (
        <CashbackForm
          merchantId={manyPlaces ? merchantId : undefined}
          branches={kind === "branch" ? overview.data?.branches : undefined}
          onDone={refresh}
        />
      )}
    </section>
  );
}
