import { useCoverageLimit } from "@loal/app-kit";
import { ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { useCurrentMerchant } from "../../entities/session/model";
import { RedeemForm } from "../../features/redemption/redeem-form";

/** Списание бонусов за покупку прямо из браузера — то же, что делает приложение кассы. */
export function RedeemPage() {
  const { merchantId, memberships } = useCurrentMerchant();
  const limit = useCoverageLimit(merchantId ?? "");

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Списать бонусы"
        description="Введите номер карты и что купили. Бонусы закроют часть цены каждой позиции, остальное клиент платит как обычно."
      />
      {limit.isPending && <Loading rows={3} />}
      {limit.isError && <ErrorState error={limit.error} onRetry={() => limit.refetch()} />}
      {limit.isSuccess && merchantId && (
        <RedeemForm
          ceiling={limit.data.maxCoveragePercent}
          // С одним местом работы сервер сам знает заведение и лишнее поле отклоняет
          merchantId={memberships.length > 1 ? merchantId : undefined}
        />
      )}
    </section>
  );
}
