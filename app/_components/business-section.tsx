import Image from "next/image";
import Link from "next/link";
import businessPhone from "@/public/images/landing/business-phone.png";
import { models } from "../_data/models";

const cabinet = [
  "Профиль, логотип и категория в каталоге",
  "% оплаты бонусами на следующий месяц",
  "История операций по бонусам",
  "Доступы для сотрудников",
];

function Check({ featured }: { featured?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
        featured ? "bg-white text-flame" : "bg-graphite text-white"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3">
        <path
          d="m5 12.5 4.5 4.5L19 7.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function BusinessSection({ partnerUrl }: { partnerUrl: string }) {
  return (
    <section id="business" className="scroll-mt-6 overflow-hidden bg-graphite text-white">
      <div className="mx-auto max-w-[1512px] px-5 pt-20 pb-20 sm:px-12 sm:pt-32 sm:pb-28">
        {/* Заголовок и телефон */}
        <div className="relative flex flex-col items-center text-center [--pw:min(1014px,118vw)]">
          <p data-biz-item className="relative z-10 rounded-full border border-white px-5 py-3.5 text-base sm:text-lg">
            Для бизнеса
          </p>
          <h2 data-split className="display relative z-10 mt-7 max-w-[1112px] text-[clamp(2.25rem,3.7vw,3.5rem)]">
            Покупатели, у которых есть чем платить
          </h2>
          <p data-biz-item className="relative z-10 mt-6 max-w-[903px] text-lg leading-snug text-slate-soft sm:text-xl">
            У каждого подписчика Loal в начале месяца 100 000 сом бонусами, и потратить их можно только у партнёров. Вы
            решаете, какую часть чека они закроют бонусами.
          </p>
          <Link
            data-biz-item
            href={partnerUrl}
            className="relative z-10 mt-12 inline-flex items-center justify-center rounded-full bg-flame px-5 py-4 text-lg transition-colors hover:bg-white hover:text-graphite"
          >
            Подключить бизнес
          </Link>

          {/* Верх картинки прозрачный: телефон «выходит» из-под текста, как в макете */}
          <div
            data-biz-phone
            className="pointer-events-none relative mt-[calc(var(--pw)*-0.1)] lg:mt-[calc(var(--pw)*-0.2)]"
            style={{ width: "var(--pw)" }}
          >
            <Image
              src={businessPhone}
              alt="Телефон с картой Loal в Apple Wallet"
              placeholder="blur"
              sizes="(min-width: 1024px) 1014px, 118vw"
              className="h-auto w-full"
            />
          </div>
        </div>

        {/* Три способа подключиться */}
        <h2
          data-split
          className="display relative z-10 text-center text-[clamp(2.25rem,3.7vw,3.5rem)]"
          style={{ marginTop: "calc(min(1014px, 118vw) * -0.2)" }}
        >
          Три способа подключиться
        </h2>
        <div data-models className="mt-14 grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {models(partnerUrl).map((m) => (
            <article
              key={m.key}
              data-model
              className={`relative flex min-w-0 flex-col justify-between gap-10 rounded-[32px] p-7 sm:rounded-[42px] sm:p-10 ${
                m.featured ? "bg-flame text-white" : "bg-white text-graphite"
              }`}
            >
              {m.featured && (
                <p className="display absolute -top-5 right-6 rotate-[-5deg] rounded-full bg-white px-5 py-3.5 text-lg text-flame sm:-top-7 sm:-right-3 sm:text-[26px]">
                  Выгоднее всего
                </p>
              )}
              <div>
                <h3 className="display text-[clamp(1.6rem,2.25vw,2.125rem)]">{m.title}</h3>
                <p
                  className={`display mt-8 text-[clamp(3rem,4.9vw,4.625rem)] leading-none whitespace-nowrap ${
                    m.featured ? "text-white" : "text-flame"
                  }`}
                >
                  {m.price}
                </p>
                <p className="mt-4 text-lg sm:text-xl">{m.priceNote}</p>
                <ul className="mt-9 flex flex-col gap-4">
                  {m.points.map((pt) => (
                    <li
                      key={pt}
                      className={`flex gap-2.5 text-base leading-snug ${m.featured ? "text-white" : "text-slate"}`}
                    >
                      <Check featured={m.featured} />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href={m.cta.href}
                className={`inline-flex min-h-[72px] items-center justify-center rounded-full px-5 py-4 text-lg font-medium transition-colors ${
                  m.featured
                    ? "bg-white text-flame hover:bg-graphite hover:text-white"
                    : "bg-flame text-white hover:bg-graphite"
                }`}
              >
                {m.cta.label}
              </a>
            </article>
          ))}
        </div>

        {/* Кабинет партнёра */}
        <div className="mt-24 flex flex-col items-center text-center sm:mt-28">
          <h3 className="display text-[clamp(1.75rem,2.65vw,2.5rem)]">В кабинете партнёра</h3>
          <ul data-rise className="mt-9 flex max-w-[871px] flex-wrap justify-center gap-4">
            {cabinet.map((item) => (
              <li key={item} className="rounded-full border border-white px-5 py-4 text-lg sm:text-xl">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-[70ch] text-lg leading-snug text-slate-soft sm:text-xl">
            Если подписка «Только лояльность» не продлена, заведение отключается от приёма бонусов и скрывается из
            каталога до оплаты.
          </p>
        </div>
      </div>
    </section>
  );
}
