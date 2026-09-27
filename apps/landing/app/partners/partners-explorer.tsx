"use client";

import type { PublicPartner } from "@loal/api";
import dynamic from "next/dynamic";
import { useState } from "react";
import { coordsOf } from "../_data/partner-coords";
import { PartnerDialog, PartnersCatalog } from "./partners-catalog";

// MapLibre работает только в браузере — на сервере вместо карты тёплая подложка
const PartnerMap = dynamic(() => import("./partner-map").then((module) => module.PartnerMap), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-cream" />,
});

function plural(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/**
 * Первый экран — карта Бишкека на всю высоту, под ней все заведения кругами.
 * Точка на карте и круг открывают одну и ту же карточку.
 */
export function PartnersExplorer({ partners }: { partners: PublicPartner[] }) {
  const [opened, setOpened] = useState<PublicPartner | null>(null);
  const onMap = partners.filter((partner) => coordsOf(partner)).length;

  return (
    <>
      <section
        aria-label="Карта заведений"
        className="relative h-[calc(100svh-88px)] min-h-[520px] overflow-hidden sm:h-[calc(100svh-100px)]"
      >
        <PartnerMap partners={partners} onOpen={setOpened} />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 mx-auto max-w-[1512px] px-5 pt-5 sm:px-12 sm:pt-8">
          <div className="pointer-events-auto w-fit max-w-[440px] rounded-[28px] bg-paper/95 p-6 shadow-[0_16px_48px_rgb(22_21_21/0.16)] backdrop-blur sm:p-7">
            <h1 className="display text-[clamp(2rem,4vw,3.2rem)] leading-[1.02] text-flame">Где тратить бонусы</h1>
            <p className="mt-3 text-lg leading-snug">
              {partners.length > 0
                ? `${partners.length} ${plural(partners.length, "заведение", "заведения", "заведений")} принимают бонусы Loal. Процент на точке — какую часть чека закроют бонусы.`
                : "Скоро здесь появятся заведения Бишкека: подключение идёт прямо сейчас."}
            </p>
            {partners.length > 0 && onMap < partners.length && (
              <p className="mt-2 text-base text-slate">
                На карте {onMap} из {partners.length} — у остальных ещё нет точки в 2ГИС.
              </p>
            )}
            <a
              href={partners.length > 0 ? "#list" : "/become-partner"}
              className="mt-5 inline-flex items-center rounded-full bg-flame px-6 py-3.5 text-[1.0625rem] font-bold text-white transition-colors hover:bg-graphite"
            >
              {partners.length > 0 ? "Все заведения" : "Подключить своё"}
            </a>
          </div>
        </div>
      </section>

      <div id="list" className="mx-auto max-w-[1512px] scroll-mt-4 px-5 pt-12 pb-16 sm:px-12 sm:pt-16">
        {partners.length > 0 && <PartnersCatalog partners={partners} onOpen={setOpened} />}
      </div>

      <PartnerDialog partner={opened} onClose={() => setOpened(null)} />
    </>
  );
}
