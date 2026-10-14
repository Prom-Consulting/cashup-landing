import { EmptyState, ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { useLaunchOffer, useTariffs } from "../../entities/platform/api";
import { LaunchOfferForm } from "../../features/tariff/launch-offer-form";
import { TariffPriceForm } from "../../features/tariff/tariff-price-form";

/**
 * Тарифы бизнеса по Доп. №5 и акция первых мест. Ниже — старые тарифы для заведений,
 * подключённых раньше. «Только OctōPAY» целиком у OctōPAY, Enterprise — по договору.
 * Каждая смена попадает в журнал в «Настройках».
 */
export function TariffsPage() {
  const tariffs = useTariffs();
  const offer = useLaunchOffer();
  // Старый шлюз не знает поля current: тогда всё считаем текущим
  const current = (tariffs.data ?? []).filter((tariff) => tariff.current !== false);
  const legacy = (tariffs.data ?? []).filter((tariff) => tariff.current === false);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Тарифы"
        description="Цены за месяц для заведений. 0 — бесплатно. «Только OctōPAY» и Enterprise здесь не настраиваются."
      />
      {tariffs.isPending && <Loading rows={2} />}
      {tariffs.isError && <ErrorState error={tariffs.error} onRetry={() => tariffs.refetch()} />}
      {tariffs.isSuccess && tariffs.data.length === 0 && <EmptyState title="Тарифов нет" />}
      {current.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          {current.map((tariff) => (
            <TariffPriceForm key={tariff.code} tariff={tariff} />
          ))}
        </div>
      )}

      {offer.isPending && <Loading rows={1} />}
      {offer.isError && <ErrorState error={offer.error} onRetry={() => offer.refetch()} />}
      {offer.isSuccess && <LaunchOfferForm offer={offer.data} />}

      {legacy.length > 0 && (
        <>
          <h2 className="mt-4 text-xl font-bold">Старые тарифы</h2>
          <p className="-mt-4 max-w-[64ch] text-base text-muted-foreground">
            Для заведений, подключённых до новой сетки. Новым заведениям их не предлагаем.
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            {legacy.map((tariff) => (
              <TariffPriceForm key={tariff.code} tariff={tariff} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
