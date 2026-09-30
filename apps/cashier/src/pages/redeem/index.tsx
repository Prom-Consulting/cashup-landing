import { RedeemForm, useCoverageLimit } from "@loal/app-kit";
import { ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { Link } from "react-router";
import { useCashierOverview, useCashierSession, useRefreshAfterRedeem } from "../../entities/cashier/api";
import { subscriptionState } from "../../shared/lib/subscription";

const DESCRIPTION = "Отсканируйте карту и добавьте покупку — бонусы закроют часть цены, остальное клиент платит как обычно.";

/**
 * Списание — тот же POST /v1/redemptions, что у кассы. Кассир магазина видит потолок процента
 * своего магазина; кассиру филиала потолок не приходит — форма держит предел кассы, точный
 * проверит сервер.
 */
export function RedeemPage() {
  const { kind } = useCashierSession();
  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Списать бонусы" description={DESCRIPTION} />
      {kind === "branch" ? <BranchRedeem /> : <MerchantRedeem />}
    </section>
  );
}

function MerchantRedeem() {
  const { merchantId, manyPlaces } = useCashierSession();
  const limit = useCoverageLimit(merchantId);
  const refresh = useRefreshAfterRedeem();
  if (limit.isPending) return <Loading rows={3} />;
  if (limit.isError) return <ErrorState error={limit.error} onRetry={() => limit.refetch()} />;
  return (
    <RedeemForm
      ceiling={limit.data.maxCoveragePercent}
      merchantId={manyPlaces ? merchantId : undefined}
      onRedeemed={refresh}
    />
  );
}

function BranchRedeem() {
  const { merchantId, manyPlaces } = useCashierSession();
  const overview = useCashierOverview();
  // Потолок процента своего магазина кассиру открыт на чтение
  const limit = useCoverageLimit(merchantId);
  const refresh = useRefreshAfterRedeem();
  if (overview.isPending || limit.isPending) return <Loading rows={3} />;
  if (overview.isError) return <ErrorState error={overview.error} onRetry={() => overview.refetch()} />;
  const { active, canRedeem } = subscriptionState(overview.data);
  if (!canRedeem)
    return (
      <p role="alert" className="rounded-2xl bg-muted px-5 py-4 text-base">
        Списывать бонусы вам сейчас не разрешено. Спросите партнёра, который вас добавил.
      </p>
    );
  return (
    <>
      {!active && (
        <p role="alert" className="rounded-2xl bg-muted px-5 py-4 text-base">
          Подписка заведения не активна — сервер откажет в списании. Подробнее в{" "}
          <Link to="/" className="text-flame-ink underline underline-offset-4">
            обзоре
          </Link>
          .
        </p>
      )}
      <RedeemForm
        ceiling={limit.data?.maxCoveragePercent ?? null}
        merchantId={manyPlaces ? merchantId : undefined}
        onRedeemed={refresh}
      />
    </>
  );
}
