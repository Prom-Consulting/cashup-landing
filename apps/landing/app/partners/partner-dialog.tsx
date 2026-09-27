"use client";

import type { PublicPartner } from "@loal/api";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { monogram } from "../_data/partners-api";

function phoneHref(phone: string) {
  return `tel:+${phone.replace(/\D/g, "")}`;
}

function prettyPhone(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^996/, "");
  if (digits.length !== 9) return phone;
  return `+996 ${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
}

/** Карточка заведения поверх карты: галерея, описание, контакты и путь к карте Loal. */
export function PartnerDialog({ partner, onClose }: { partner: PublicPartner | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (partner && !element.open) element.showModal();
    if (!partner && element.open) element.close();
  }, [partner]);

  const gallery = partner
    ? partner.photos.length > 0
      ? partner.photos
      : partner.logoUrl
        ? [partner.logoUrl]
        : []
    : [];

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(event) => event.target === dialog.current && onClose()}
      aria-labelledby="partner-dialog-title"
      className="partner-dialog m-auto w-[min(640px,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[32px] bg-paper p-0 text-graphite"
    >
      {partner && (
        <div>
          {gallery.length > 0 ? (
            <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto">
              {gallery.map((url) => (
                <li key={url} className="aspect-[4/3] w-full shrink-0 snap-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={partner.name} className="h-full w-full object-cover" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="brand-gradient display grid aspect-[16/9] place-items-center text-[5rem] text-white">
              {monogram(partner.name)}
            </div>
          )}

          <div className="flex flex-col gap-4 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                {partner.category && <p className="text-base text-slate">{partner.category}</p>}
                <h2 id="partner-dialog-title" className="display mt-1 text-[1.9rem] leading-tight">
                  {partner.name}
                </h2>
              </div>
              {partner.maxCoveragePercent ? (
                <p className="shrink-0 rounded-2xl bg-flame px-4 py-2 text-center text-white">
                  <span className="display block text-[1.6rem] leading-none">до {partner.maxCoveragePercent}%</span>
                  <span className="text-sm font-bold">чека бонусами</span>
                </p>
              ) : null}
            </div>

            {partner.description && <p className="text-lg leading-snug whitespace-pre-line">{partner.description}</p>}

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-lg">
              {partner.contactPhone && (
                <a
                  href={phoneHref(partner.contactPhone)}
                  className="font-bold text-flame-ink underline-offset-4 hover:underline"
                >
                  {prettyPhone(partner.contactPhone)}
                </a>
              )}
              {partner.instagramUrl && (
                <a
                  href={partner.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-4 hover:underline"
                >
                  Instagram
                </a>
              )}
              {partner.twogisUrl && (
                <a
                  href={partner.twogisUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-4 hover:underline"
                >
                  На карте 2ГИС
                </a>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-3">
              <Link
                href="/#price"
                className="inline-flex items-center rounded-full bg-flame px-6 py-4 text-[1.1875rem] font-bold text-white transition-colors hover:bg-graphite"
              >
                Оформить карту Loal
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center rounded-full border-2 border-graphite px-6 py-4 text-lg font-medium transition-colors hover:bg-graphite hover:text-paper"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
