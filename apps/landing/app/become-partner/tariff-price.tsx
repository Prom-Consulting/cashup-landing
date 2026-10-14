import { formatSom, LAUNCH_OFFER } from "../_data/business-pricing";

/**
 * Цена тарифа. На тарифах акции — «0 сом», рядом настоящая цена зачёркнута, ниже — для кого
 * акция. Мест сервер не считает (бесплатные месяцы выдаёт агентство), поэтому без счётчика.
 */
export function TariffPrice({
  priceKgs,
  launchOffer,
  featured,
}: {
  priceKgs: number;
  launchOffer: boolean;
  featured?: boolean;
}) {
  const accent = featured ? "text-paper" : "text-flame";

  if (!launchOffer)
    return (
      <>
        <p className={`display mt-6 text-[clamp(2.25rem,4.17vw,4.14rem)] whitespace-nowrap ${accent}`}>{formatSom(priceKgs)}</p>
        <p className="mt-2 font-medium">в месяц</p>
      </>
    );

  return (
    <>
      <p className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className={`display text-[clamp(2.25rem,4.17vw,4.14rem)] whitespace-nowrap ${accent}`}>0 сом</span>
        <s className="text-xl font-semibold whitespace-nowrap opacity-60 sm:text-2xl">
          <span className="sr-only">вместо </span>
          {formatSom(priceKgs)}
        </s>
      </p>
      <p className="mt-2 font-medium">
        {LAUNCH_OFFER.months} мес. бесплатно для первых {LAUNCH_OFFER.seats} заведений, потом {formatSom(priceKgs)} в месяц
      </p>
    </>
  );
}
