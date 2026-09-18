import Image from "next/image";
import heroPhoto from "@/public/images/hero-qr-payment.jpg";
import { Coin, QrPattern } from "./illustrations";

// Real QR payment photo with the Loal card and a payment notice layered over it.
export function HeroVisual() {
  return (
    <div data-hero-visual data-hero-item className="relative mx-auto w-full max-w-[540px] lg:mx-0 lg:justify-self-end">
      <div data-hero-photo className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[48px] bg-cream">
        <Image
          src={heroPhoto}
          alt="Оплата по QR-коду с телефона на кассе"
          fill
          preload
          quality={90}
          placeholder="blur"
          sizes="(min-width: 1024px) 540px, 92vw"
          className="object-cover object-[50%_42%]"
          data-hero-img
        />
      </div>

      <div
        data-hero-toast
        className="absolute top-[30%] -right-3 flex items-center gap-3 rounded-2xl bg-paper py-3 pr-5 pl-3 sm:-right-12"
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-flame-ink" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-6 w-6">
            <path
              d="m5 12.5 4.5 4.5L19 7.5"
              fill="none"
              stroke="var(--paper)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span>
          <span className="block text-sm">Кофейня, оплачено</span>
          <span className="block font-bold whitespace-nowrap">400 сом бонусами</span>
        </span>
      </div>

      <div
        data-hero-card
        className="absolute -bottom-10 -left-4 w-[min(300px,74%)] -rotate-6 rounded-3xl bg-graphite p-5 text-paper sm:-left-12"
      >
        <div className="flex items-center justify-between">
          <span className="display text-2xl leading-none">Loal</span>
          <span className="text-xs opacity-80">до 1 октября</span>
        </div>
        <p className="mt-5 text-xs opacity-80">Бонусы на карте, сом</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <p className="display text-[clamp(1.6rem,8vw,3.6rem)] whitespace-nowrap text-amber">
            <span data-balance className="tabular-nums">
              100 000
            </span>
          </p>
          <svg viewBox="0 0 9 9" className="mb-1 h-10 w-10 shrink-0 rounded-md bg-paper p-1 sm:h-14 sm:w-14" aria-hidden="true">
            <QrPattern />
          </svg>
        </div>
      </div>

      <div data-coin className="absolute -top-2 -right-4 z-10 w-20" aria-hidden="true">
        <Coin className="h-auto w-full" />
      </div>
    </div>
  );
}
