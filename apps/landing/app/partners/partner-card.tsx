"use client";

import type { PublicPartner } from "@loal/api";
import Link from "next/link";
import { partnerPath } from "../_data/seo";
import { monogram } from "../_data/partners-api";
import { fitLogo } from "./logo-fit";

/** Обложка: первое фото витрины. Без фото — фирменный градиент с крупной монограммой. */
export function PartnerCover({
  partner,
  className = "",
  large = false,
}: {
  partner: PublicPartner;
  className?: string;
  large?: boolean;
}) {
  const photo = partner.photos[0];
  if (photo)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={`${partner.name} — фото`} loading="lazy" decoding="async" className={`object-cover ${className}`} />;
  return (
    <span aria-hidden="true" className={`brand-gradient relative grid place-items-center overflow-hidden ${className}`}>
      {partner.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={fitLogo}
          src={partner.logoUrl}
          alt={`Логотип ${partner.name}`}
          crossOrigin="anonymous"
          className={`rounded-full border-4 border-paper/90 bg-paper object-cover shadow-xl ${large ? "h-32 w-32" : "h-16 w-16 sm:h-20 sm:w-20"}`}
        />
      ) : (
        <span className={`display text-white/95 ${large ? "text-[5rem]" : "text-[3.25rem]"} leading-none`}>
          {monogram(partner.name)}
        </span>
      )}
    </span>
  );
}

export function PartnerLogo({ partner, size = "md" }: { partner: PublicPartner; size?: "md" | "lg" }) {
  const image = partner.logoUrl ?? partner.photos[0] ?? null;
  const box = size === "lg" ? "h-16 w-16" : "h-12 w-12";
  return (
    <span
      aria-hidden="true"
      className={`grid ${box} shrink-0 place-items-center overflow-hidden rounded-full bg-[conic-gradient(from_210deg,var(--coral),var(--flame),var(--amber),var(--peach),var(--coral))] p-[3px]`}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={fitLogo}
          src={image}
          alt={`Логотип ${partner.name}`}
          crossOrigin="anonymous"
          loading="lazy"
          className="h-full w-full rounded-full border-2 border-paper bg-paper object-cover"
        />
      ) : (
        <span className="brand-gradient display grid h-full w-full place-items-center rounded-full border-2 border-paper text-base text-white">
          {monogram(partner.name)}
        </span>
      )}
    </span>
  );
}

export function PercentBadge({ partner, className = "" }: { partner: PublicPartner; className?: string }) {
  if (!partner.maxCoveragePercent) return null;
  return (
    <span className={`shrink-0 rounded-full bg-flame px-3 py-1 text-sm font-bold whitespace-nowrap text-white ${className}`}>
      до {partner.maxCoveragePercent}%
    </span>
  );
}

const subtitle = (partner: PublicPartner) =>
  [partner.category, partner.tariff === "octopay" ? "оплата в OctōPAY" : null].filter(Boolean).join(" · ") || "Бишкек";

/** Карточка в сетке каталога: обложка, логотип внахлёст, название и «до N%». Ссылка на страницу заведения. */
export function PartnerCard({ partner }: { partner: PublicPartner }) {
  return (
    <li>
      <Link
        href={partnerPath(partner)}
        className="group flex h-full w-full flex-col overflow-hidden rounded-[20px] sm:rounded-[24px] bg-paper text-left shadow-[0_1px_0_rgb(22_21_21/0.06)] ring-1 ring-smoke/70 transition-[box-shadow,transform] duration-200 outline-none hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgb(22_21_21/0.12)] focus-visible:ring-3 focus-visible:ring-flame motion-reduce:hover:translate-y-0"
      >
        <span className="relative block">
          <PartnerCover partner={partner} className="aspect-[4/3] w-full" />
          <PercentBadge partner={partner} className="absolute top-2 right-2 px-2.5 text-xs shadow-md sm:top-3 sm:right-3 sm:px-3 sm:text-sm" />
        </span>
        <span className="relative flex flex-1 items-start gap-3 px-3 pt-0 pb-3 sm:px-4 sm:pb-4">
          {/* Без фото логотип уже на обложке — второй раз не повторяем */}
          {partner.photos.length > 0 && (
            <span className="-mt-6 hidden rounded-full ring-4 ring-paper sm:block">
              <PartnerLogo partner={partner} />
            </span>
          )}
          <span className="min-w-0 flex-1 pt-2.5">
            <span className="block truncate text-base leading-tight font-bold sm:text-lg">{partner.name}</span>
            <span className="mt-0.5 block truncate text-[0.8125rem] text-slate sm:text-sm">{subtitle(partner)}</span>
            {partner.address && (
              <span className="mt-1 block truncate text-[0.8125rem] text-slate/80 sm:text-sm">{partner.address}</span>
            )}
          </span>
        </span>
      </Link>
    </li>
  );
}

/** Прайм-карточка над сеткой: самое выгодное заведение крупно, с фото и описанием. */
export function PrimeCard({ partner, label }: { partner: PublicPartner; label: string }) {
  return (
    <Link
      href={partnerPath(partner)}
      className="group grid w-full overflow-hidden rounded-[32px] bg-graphite text-left text-paper outline-none focus-visible:ring-4 focus-visible:ring-flame md:grid-cols-[1.25fr_1fr]"
    >
      <span className="relative block overflow-hidden">
        <PartnerCover
          partner={partner}
          large
          className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100 md:aspect-auto md:h-full md:min-h-[340px]"
        />
        <span className="absolute top-4 left-4 rounded-full bg-paper px-3 py-1 text-sm font-bold text-graphite">
          {label}
        </span>
      </span>
      <span className="flex flex-col gap-4 p-6 sm:p-8">
        <span className="flex items-center gap-3">
          <PartnerLogo partner={partner} size="lg" />
          <span className="min-w-0">
            <span className="display block text-[1.9rem] leading-[1.02] sm:text-[2.4rem]">{partner.name}</span>
            <span className="mt-1 block truncate text-base text-paper/70">{subtitle(partner)}</span>
          </span>
        </span>
        {partner.maxCoveragePercent ? (
          <span className="flex items-baseline gap-2">
            <span className="display text-[3.5rem] leading-none text-amber sm:text-[4.25rem]">
              {partner.maxCoveragePercent}%
            </span>
            <span className="text-base leading-snug text-paper/80">покупки можно оплатить бонусами</span>
          </span>
        ) : null}
        {partner.description && (
          <span className="line-clamp-3 text-base leading-relaxed text-paper/85">{partner.description}</span>
        )}
        {partner.address && <span className="text-sm text-paper/60">{partner.address}</span>}
        <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-flame px-5 py-3 text-base font-bold text-white transition-colors group-hover:bg-paper group-hover:text-graphite">
          Подробнее
        </span>
      </span>
    </Link>
  );
}
