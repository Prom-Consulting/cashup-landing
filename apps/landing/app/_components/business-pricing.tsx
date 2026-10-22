"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { businessPrice, getBusinessPricing, TARIFF_CODE, type BusinessPlan, type BusinessPricing } from "../_data/business-pricing";

const PricingContext = createContext<BusinessPricing>(null);
export const useBusinessPricing = () => useContext(PricingContext);

export function BusinessPricingProvider({ initialPricing, children }: { initialPricing: BusinessPricing; children: ReactNode }) {
  const [pricing, setPricing] = useState(initialPricing);
  useEffect(() => {
    let disposed = false;
    let pending = false;
    const refresh = async () => {
      if (pending || document.hidden) return;
      pending = true;
      const next = await getBusinessPricing();
      if (!disposed) setPricing(next);
      pending = false;
    };
    void refresh();
    const timer = window.setInterval(refresh, 5_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      disposed = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return <PricingContext value={pricing}>{children}</PricingContext>;
}

export function BusinessPrice({ plan }: { plan: BusinessPlan }) {
  const pricing = useBusinessPricing();
  const available = pricing?.some((item) => item.code === TARIFF_CODE[plan]);
  return <span aria-live="polite" className={available ? undefined : "inline-block whitespace-normal text-base font-medium"}>
    {businessPrice(plan, pricing)}
  </span>;
}

export function BusinessOffer({ plan }: { plan: BusinessPlan }) {
  const tariff = useBusinessPricing()?.find((item) => item.code === TARIFF_CODE[plan]);
  if (!tariff?.freeOfferActive) return null;
  return <p className="mt-3 text-base leading-snug" aria-live="polite">
    Бесплатно, пока не подключатся {tariff.freeMerchantLimit} заведений. Осталось мест: {tariff.freePlacesRemaining}.
    {" "}Затем для всех — {new Intl.NumberFormat("ru-RU").format(tariff.regularPriceKgs)} сом/мес.
  </p>;
}
