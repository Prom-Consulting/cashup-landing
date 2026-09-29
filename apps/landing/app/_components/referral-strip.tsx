import { CLIENT_APP_URL } from "../_data/site";

/** Вход в реферальную программу (REF-01): стать реферером можно из кабинета клиента. */
export function ReferralStrip() {
  return (
    <section id="friends" className="scroll-mt-6 px-5 sm:px-12">
      <a
        href={`${CLIENT_APP_URL.replace(/\/$/, "")}/referrals`}
        className="brand-gradient group mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-5 rounded-[32px] px-7 py-7 text-white sm:px-10 sm:py-9"
      >
        <span className="flex flex-col gap-2">
          <span className="display text-[clamp(1.6rem,3vw,2.4rem)] leading-tight">Приглашайте друзей</span>
          <span className="max-w-[52ch] text-lg leading-snug text-white/90">
            2 000 бонусов сразу, как станете реферером, и +500 за каждого друга, который оплатит подписку. Без лимита.
          </span>
        </span>
        <span className="inline-flex items-center rounded-full bg-graphite px-6 py-3.5 text-base font-bold text-white transition-colors group-hover:bg-white group-hover:text-graphite">
          Стать реферером
        </span>
      </a>
    </section>
  );
}
