"use client";

import type { PublicPartner } from "@loal/api";
import Link from "next/link";
import { monogram } from "../_data/partners-api";
import { partnerPath } from "../_data/seo";
import { fitLogo } from "./logo-fit";

const phoneHref = (phone: string) => `tel:+${phone.replace(/\D/g, "")}`;

/** Миниатюра: фото витрины, а без него — логотип на белой плитке. */
function Thumb({ partner }: { partner: PublicPartner }) {
  const photo = partner.photos[0];
  if (photo)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={`${partner.name} — фото`} className="h-full w-full object-cover" />;
  if (partner.logoUrl)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={fitLogo}
        src={partner.logoUrl}
        alt={`Логотип ${partner.name}`}
        crossOrigin="anonymous"
        className="h-full w-full bg-white object-contain p-2"
      />
    );
  return (
    <span aria-hidden="true" className="brand-gradient display grid h-full w-full place-items-center text-[2rem] text-white">
      {monogram(partner.name)}
    </span>
  );
}

/**
 * Карточка выбранного места поверх карты — как в городских справочниках: кто это, сколько
 * можно оплатить бонусами, где находится и что сделать дальше. На телефоне — над шторкой.
 */
export function PlaceCard({ partner, onClose }: { partner: PublicPartner; onClose: () => void }) {
  const action =
    "inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-bold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-flame";
  return (
    <article
      key={partner.id}
      aria-label={partner.name}
      className="place-card absolute right-3 bottom-[calc(var(--sheet,232px)+12px)] left-3 z-30 overflow-hidden rounded-[24px] bg-paper shadow-[0_18px_48px_rgb(22_21_21/0.28)] ring-1 ring-smoke md:right-auto md:bottom-6 md:left-[424px] md:w-[420px]"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть карточку"
        className="absolute top-2.5 right-2.5 z-10 grid h-9 w-9 place-items-center rounded-full bg-paper/90 text-graphite shadow-sm transition-colors hover:bg-graphite hover:text-paper"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </button>

      <div className="flex gap-4 p-4 pr-12">
        <div className="h-[92px] w-[92px] shrink-0 overflow-hidden rounded-[18px] border border-smoke bg-white">
          <Thumb partner={partner} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="display truncate text-[1.25rem] leading-tight">{partner.name}</h2>
          <p className="mt-0.5 truncate text-sm text-slate">{partner.category ?? "Бишкек"}</p>
          {partner.address && <p className="truncate text-sm text-slate">{partner.address}</p>}
          {partner.maxCoveragePercent ? (
            <p className="mt-2 inline-flex items-baseline gap-1.5 rounded-lg bg-flame/10 px-2.5 py-1 text-sm text-flame-ink">
              <b className="text-base font-extrabold tabular-nums">до {partner.maxCoveragePercent}%</b> бонусами
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-smoke px-4 py-3">
        <Link href={partnerPath(partner)} className={`${action} bg-graphite px-5 text-paper hover:bg-flame`}>
          Подробнее
        </Link>
        {partner.twogisUrl && (
          <a href={partner.twogisUrl} target="_blank" rel="noreferrer" className={`${action} border-2 border-smoke px-4 hover:border-graphite`}>
            Маршрут
          </a>
        )}
        {partner.contactPhone && (
          <a
            href={phoneHref(partner.contactPhone)}
            aria-label={`Позвонить в ${partner.name}`}
            className={`${action} w-11 shrink-0 border-2 border-smoke hover:border-graphite`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
            </svg>
          </a>
        )}
      </div>
    </article>
  );
}
