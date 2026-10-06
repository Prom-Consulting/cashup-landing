import { EmptyState, ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { useTariffs } from "../../entities/platform/api";
import { TariffPriceForm } from "../../features/tariff/tariff-price-form";

/**
 * Цены двух тарифов, которые продаёт Loal. «Только OctōPAY» целиком у OctōPAY, Enterprise —
 * по договору, их здесь нет. Каждая смена цены попадает в журнал в «Настройках».
 */
export function TariffsPage() {
  const tariffs = useTariffs();

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Тарифы"
        description="Цены за месяц для магазинов. 0 — бесплатно. «Только OctōPAY» и Enterprise здесь не настраиваются."
      />
      {tariffs.isPending && <Loading rows={2} />}
      {tariffs.isError && <ErrorState error={tariffs.error} onRetry={() => tariffs.refetch()} />}
      {tariffs.isSuccess && tariffs.data.length === 0 && <EmptyState title="Тарифов нет" />}
      {tariffs.isSuccess && tariffs.data.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {tariffs.data.map((tariff) => (
            <TariffPriceForm key={tariff.code} tariff={tariff} />
          ))}
        </div>
      )}
    </section>
  );
}
