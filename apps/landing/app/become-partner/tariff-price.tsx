"use client";

import { useEffect, useState } from "react";
import { formatSom, LAUNCH_OFFER, type BusinessTariff } from "../_data/business-pricing";
import { API_URL } from "../_data/site";

type Live = {
  prices: Partial<Record<string, number>>;
  offer: { seats: number; months: number; left: number; tariffs: string[] };
};

// Одна загрузка на страницу: карточек три, запрос один.
let pending: Promise<Live | null> | null = null;
function loadLive(): Promise<Live | null> {
  pending ??= fetch(`${API_URL.replace(/\/$/, "")}/v1/public/tariffs`, { signal: AbortSignal.timeout(10_000) })
    .then((response) => (response.ok ? response.json() : null))
    .then((body: unknown) => {
      const data = body as {
        tariffs?: { code: string; priceKgs: number }[];
        launchOffer?: { seats: number; months: number; left: number; tariffs: string[] };
      } | null;
      if (!data?.launchOffer || !Array.isArray(data.tariffs)) return null;
      return { prices: Object.fromEntries(data.tariffs.map((t) => [t.code, t.priceKgs])), offer: data.launchOffer };
    })
    .catch(() => null);
  return pending;
}

const seatsWord = (n: number) => {
  const tens = n % 100;
  const ones = n % 10;
  if (tens >= 11 && tens <= 14) return "мест";
  if (ones === 1) return "место";
  if (ones >= 2 && ones <= 4) return "места";
  return "мест";
};

/**
 * Цена тарифа. На тарифах акции, пока есть места: «0 сом», рядом настоящая цена зачёркнута,
 * под ней счётчик свободных мест. В HTML без скрипта — цифры из LAUNCH_OFFER, после загрузки
 * страница показывает живой остаток; места кончились — обычная цена.
 */
export function TariffPrice({
  tariff,
  priceKgs,
  launchOffer,
  featured,
}: {
  tariff: BusinessTariff;
  priceKgs: number;
  launchOffer: boolean;
  featured?: boolean;
}) {
  const [live, setLive] = useState<Live | null>(null);
  useEffect(() => {
    let alive = true;
    void loadLive().then((data) => alive && setLive(data));
    return () => {
      alive = false;
    };
  }, []);

  const price = live?.prices[tariff] ?? priceKgs;
  const offer = live?.offer ?? { ...LAUNCH_OFFER, left: null as number | null };
  const inOffer = (live ? live.offer.tariffs.includes(tariff) : launchOffer) && offer.months > 0 && offer.left !== 0;
  const accent = featured ? "text-paper" : "text-flame";

  if (!inOffer)
    return (
      <>
        <p className={`display mt-6 text-[clamp(2.25rem,4.17vw,4.14rem)] whitespace-nowrap ${accent}`}>{formatSom(price)}</p>
        <p className="mt-2 font-medium">в месяц</p>
      </>
    );

  return (
    <>
      <p className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className={`display text-[clamp(2.25rem,4.17vw,4.14rem)] whitespace-nowrap ${accent}`}>0 сом</span>
        <s className="text-xl font-semibold whitespace-nowrap opacity-60 sm:text-2xl">
          <span className="sr-only">вместо </span>
          {formatSom(price)}
        </s>
      </p>
      <p className="mt-2 font-medium">
        в месяц — {offer.months} мес. бесплатно для первых {offer.seats} заведений
      </p>
      <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-graphite" aria-live="polite">
        {offer.left === null ? (
          <span className="font-bold">Мест по акции: {offer.seats}</span>
        ) : (
          <>
            <span className="font-bold">
              Осталось {offer.left} {seatsWord(offer.left)}
            </span>{" "}
            из {offer.seats}
          </>
        )}
        <span
          aria-hidden="true"
          className="mt-2 block h-1.5 overflow-hidden rounded-full bg-graphite/10"
        >
          <span
            className="block h-full rounded-full bg-flame"
            style={{ width: `${offer.left === null ? 100 : Math.max(2, (offer.left / Math.max(1, offer.seats)) * 100)}%` }}
          />
        </span>
      </p>
    </>
  );
}
