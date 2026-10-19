import { formatSom, LAUNCH_OFFER } from "../_data/business-pricing";

/**
 * Цена тарифа. На тарифах акции — «0 сом», рядом настоящая цена зачёркнута, ниже — для кого
 * акция и блок со счётчиком мест: сколько осталось из 200 и полоса, которая заполняется при
 * загрузке. Мест сервер не считает — остаток считает страница по каталогу (seatsLeft); места
 * кончились — обычная цена.
 */

const seatsWord = (n: number) => {
  const tens = n % 100;
  const ones = n % 10;
  if (tens >= 11 && tens <= 14) return "мест";
  if (ones === 1) return "место";
  if (ones >= 2 && ones <= 4) return "места";
  return "мест";
};

export function TariffPrice({
  priceKgs,
  launchOffer,
  featured,
  seatsLeft = null,
}: {
  priceKgs: number;
  launchOffer: boolean;
  featured?: boolean;
  /** Сколько мест по акции осталось; null — не знаем (каталог не ответил). */
  seatsLeft?: number | null;
}) {
  const accent = featured ? "text-paper" : "text-flame";

  if (!launchOffer || seatsLeft === 0)
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
      <div className="mt-4 rounded-2xl bg-cream px-4 py-3 text-graphite">
        <p className="flex items-baseline justify-between gap-3">
          {seatsLeft === null ? (
            <span className="font-bold">Мест по акции: {LAUNCH_OFFER.seats}</span>
          ) : (
            <>
              <span>
                <span className="display text-2xl text-flame">{seatsLeft}</span>{" "}
                <span className="font-bold">{seatsWord(seatsLeft)} осталось</span>
              </span>
              <span className="text-sm opacity-70">из {LAUNCH_OFFER.seats}</span>
            </>
          )}
        </p>
        <span aria-hidden="true" className="mt-2 block h-2 overflow-hidden rounded-full bg-graphite/10">
          <span
            className="seat-fill block h-full rounded-full bg-[linear-gradient(90deg,var(--flame),var(--amber))]"
            style={{ width: `${seatsLeft === null ? 100 : Math.max(2, (seatsLeft / LAUNCH_OFFER.seats) * 100)}%` }}
          />
        </span>
      </div>
    </>
  );
}
