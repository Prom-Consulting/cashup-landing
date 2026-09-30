import { RedeemForm } from "@loal/app-kit";
import { ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { Link } from "react-router";
import { useCashierOverview, useRefreshAfterRedeem } from "../../entities/cashier/api";
import { subscriptionState } from "../../shared/lib/subscription";

/**
 * Списание — тот же POST /v1/redemptions, что у кассы. Заведение сервер берёт из токена
 * кассира (одно место работы), поэтому merchantId не шлём.
 */
export function RedeemPage() {
  const overview = useCashierOverview();
  const refresh = useRefreshAfterRedeem();

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Списать бонусы"
        description="Введите номер карты и что купили. Бонусы закроют часть цены каждой позиции, остальное клиент платит как обычно."
      />
      {overview.isPending && <Loading rows={3} />}
      {overview.isError && <ErrorState error={overview.error} onRetry={() => overview.refetch()} />}
      {overview.isSuccess && !subscriptionState(overview.data).active && subscriptionState(overview.data).canRedeem && (
        <p role="alert" className="rounded-2xl bg-muted px-5 py-4 text-base">
          Подписка заведения не активна — сервер откажет в списании. Подробнее в{" "}
          <Link to="/" className="text-flame-ink underline underline-offset-4">
            обзоре
          </Link>
          .
        </p>
      )}
      {overview.isSuccess && !subscriptionState(overview.data).canRedeem && (
        <p role="alert" className="rounded-2xl bg-muted px-5 py-4 text-base">
          Списывать бонусы вам сейчас не разрешено. Спросите партнёра, который вас добавил.
        </p>
      )}
      {/* Потолок заведения кассиру не приходит: форма держит общий предел кассы, точный — проверит сервер */}
      {overview.isSuccess && subscriptionState(overview.data).canRedeem && (
        <RedeemForm ceiling={null} onRedeemed={refresh} />
      )}
    </section>
  );
}
