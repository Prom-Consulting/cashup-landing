import { formatSom } from "../_data/business-pricing";

/** Цена тарифа за месяц. */
export function TariffPrice({ priceKgs, featured }: { priceKgs: number; featured?: boolean }) {
  return (
    <>
      <p className={`display mt-6 text-[clamp(2.25rem,4.17vw,4.14rem)] whitespace-nowrap ${featured ? "text-paper" : "text-flame"}`}>
        {formatSom(priceKgs)}
      </p>
      <p className="mt-2 font-medium">в месяц</p>
    </>
  );
}
