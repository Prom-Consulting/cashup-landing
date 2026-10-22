import { EmptyState, ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { useTariffs } from "../../entities/platform/api";
import { TariffPriceForm } from "../../features/tariff/tariff-price-form";

/**
 * Цены трёх тарифов Loal (ТЗ №5). «Только OctōPAY» целиком у OctōPAY, Enterprise — по договору.
 * Процент кэшбэка задаётся в карточке заведения. Каждая смена цены попадает в журнал в «Настройках».
 */
export function TariffsPage() {
  const tariffs = useTariffs();

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Тарифы"
        description="Настройте бесплатные места и цену после акции. При заполнении лимита обычная цена включается для всех и автоматически появляется на лендинге."
      />
      {tariffs.isPending && <Loading rows={2} />}
      {tariffs.isError && <ErrorState error={tariffs.error} onRetry={() => tariffs.refetch()} />}
      {tariffs.isSuccess && tariffs.data.length === 0 && <EmptyState title="Тарифов нет" />}
      {tariffs.isSuccess && tariffs.data.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          {tariffs.data.map((tariff) => (
            <TariffPriceForm key={tariff.code} tariff={tariff} />
          ))}
        </div>
      )}
    </section>
  );
}
