"use client";

import { formatSom, type BusinessTariff } from "../_data/business-pricing";
import { BusinessPrice, useBusinessPricing } from "../_components/business-pricing";

/** The backend owns both the price and the number of free places. */
export function TariffPrice({ tariff, featured }: { tariff: BusinessTariff; featured?: boolean }) {
  const price = useBusinessPricing()?.find((item) => item.code === tariff);
  const accent = featured ? "text-paper" : "text-flame";

  // «Больше клиентов»: подписка бесплатна, платят один раз за NFC-стикер (по нему узнают магазин).
  if (tariff === "more_clients") {
    const stickerKgs = price?.oneTimeStickerKgs;
    return <>
      <p className="mt-6" aria-live="polite">
        <span className={`display text-[clamp(2.25rem,4.17vw,4.14rem)] whitespace-nowrap ${accent}`}>Бесплатно</span>
      </p>
      <p className="mt-2 font-medium">подписка — без ежемесячной платы</p>
      <div className={`mt-4 rounded-2xl px-4 py-3 ${featured ? "bg-paper/10" : "bg-cream text-graphite"}`}>
        <p className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-semibold">NFC-стикер</span>
          <span><span className={`display text-2xl ${featured ? "text-paper" : "text-flame"}`}>
            {stickerKgs !== undefined ? formatSom(stickerKgs) : "—"}
          </span> <span className="text-sm opacity-70">разово</span></span>
        </p>
        <p className="mt-2 text-sm leading-snug">
          Обязательный разовый платёж. По стикеру клиенты узна́ют ваш магазин и начисляют бонусы.
          Онлайн-магазину выдаётся цифровой стикер.
        </p>
      </div>
    </>;
  }

  return <>
    <p className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1" aria-live="polite">
      <span className={`display text-[clamp(2.25rem,4.17vw,4.14rem)] whitespace-nowrap ${accent}`}>
        <BusinessPrice plan={tariff} />
      </span>
      {price?.freeOfferActive && price.regularPriceKgs > 0 && <s className="text-xl font-semibold opacity-60">
        <span className="sr-only">вместо </span>{formatSom(price.regularPriceKgs)}
      </s>}
    </p>
    <p className="mt-2 font-medium">в месяц</p>
    {price?.freeOfferActive && <div className="mt-4 rounded-2xl bg-cream px-4 py-3 text-graphite" aria-live="polite">
      <p className="flex items-baseline justify-between gap-3">
        <span><span className="display text-2xl text-flame">{price.freePlacesRemaining}</span> бесплатных мест осталось</span>
        <span className="text-sm opacity-70">из {price.freeMerchantLimit}</span>
      </p>
      <span aria-hidden="true" className="mt-2 block h-2 overflow-hidden rounded-full bg-graphite/10">
        <span className="seat-fill block h-full rounded-full bg-[linear-gradient(90deg,var(--flame),var(--amber))]"
          style={{ width: `${(price.freePlacesRemaining / price.freeMerchantLimit) * 100}%` }} />
      </span>
      <p className="mt-3 text-sm">Когда лимит заполнится, для всех — {formatSom(price.regularPriceKgs)} в месяц.</p>
    </div>}
  </>;
}
