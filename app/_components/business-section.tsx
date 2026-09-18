import Image from "next/image";
import partnerPhoto from "@/public/images/partner-barista.jpg";
import { models } from "../_data/models";
import { Coin } from "./illustrations";

const cabinet = [
  "Профиль, логотип и категория в каталоге",
  "% оплаты бонусами на следующий месяц",
  "История операций по бонусам",
  "Доступы для сотрудников",
];

function Check({ className }: { className: string }) {
  return (
    <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
        <path
          d="m5 12.5 4.5 4.5L19 7.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function BusinessSection({ partnerUrl }: { partnerUrl: string }) {
  return (
    <section id="business" className="relative scroll-mt-6 overflow-hidden bg-forest text-chalk">
      <div className="mx-auto max-w-[1440px] px-5 py-24 sm:px-10 lg:py-32">
        <div className="grid items-center gap-16 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="text-lg font-medium text-bubblegum">Для бизнеса</p>
            <h2 data-split className="display mt-4 text-[clamp(3.5rem,8.5vw,8rem)] text-chalk">
              Покупатели, <span className="whitespace-nowrap">у которых</span> есть чем платить
            </h2>
            <p className="mt-8 max-w-[48ch] text-lg leading-relaxed sm:text-xl">
              У каждого подписчика Loal в начале месяца 100 000 сом бонусами, и потратить их можно только у
              партнёров. Вы решаете, какую часть чека они закроют бонусами.
            </p>
            <a
              href={partnerUrl}
              className="mt-10 inline-flex items-center justify-center rounded-[10px] bg-chalk px-7 py-4 font-bold text-forest transition-colors hover:bg-bubblegum"
            >
              Подключить бизнес
            </a>
          </div>

          <div data-biz-visual className="relative mx-auto w-full max-w-[500px]">
            <div data-biz-photo className="relative aspect-[4/5] overflow-hidden rounded-[40px]">
              <Image
                src={partnerPhoto}
                alt="Бариста готовит кофе за стойкой кофейни"
                fill
                quality={90}
                placeholder="blur"
                sizes="(min-width: 1024px) 500px, 92vw"
                className="object-cover object-[50%_40%]"
                data-biz-img
              />
            </div>

            <div
              data-biz-chip
              className="absolute top-8 -left-4 rotate-[-6deg] rounded-full bg-magenta-ink px-5 py-2.5 font-bold sm:-left-10"
            >
              Партнёр Loal
            </div>

            <div
              data-biz-widget
              className="absolute -bottom-8 -left-4 w-[min(300px,82%)] rounded-3xl bg-chalk p-5 text-forest sm:-left-12"
            >
              <p className="text-sm opacity-70">Кабинет партнёра</p>
              <p className="mt-1 font-bold">Оплата бонусами в октябре</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-blush">
                  <div data-biz-meter className="h-full w-1/5 rounded-full bg-magenta" />
                </div>
                <span className="display text-4xl">до 20%</span>
              </div>
            </div>

            <div data-biz-coin className="absolute -top-8 -right-6 w-24" aria-hidden="true">
              <Coin className="h-auto w-full" />
            </div>
          </div>
        </div>

        <h3 className="display mt-32 text-[clamp(2.75rem,5vw,4.5rem)]">Три способа подключиться</h3>
        <div data-models className="mt-10 grid gap-5 lg:grid-cols-3 lg:items-stretch">
          {models(partnerUrl).map((m) => (
            <article
              key={m.key}
              data-model
              className={`relative flex flex-col rounded-[32px] p-8 sm:p-10 ${
                m.featured ? "bg-magenta-ink text-chalk lg:-my-4 lg:py-14" : "bg-chalk text-forest"
              }`}
            >
              {m.featured && (
                <p className="absolute -top-4 left-8 rotate-[-3deg] rounded-full bg-bubblegum px-4 py-1.5 text-sm font-bold text-forest sm:left-10">
                  Выгоднее всего
                </p>
              )}
              <h4 className="display text-[clamp(2.25rem,3.4vw,3rem)]">{m.title}</h4>
              <p
                className={`display mt-6 text-[clamp(4.5rem,7vw,6.5rem)] whitespace-nowrap ${
                  m.featured ? "text-chalk" : "text-magenta"
                }`}
              >
                {m.price}
              </p>
              <p className="mt-2 font-medium">{m.priceNote}</p>
              <ul className="mt-8 flex flex-1 flex-col gap-3.5">
                {m.points.map((pt) => (
                  <li key={pt} className="flex gap-3">
                    <Check className={m.featured ? "bg-chalk text-magenta-ink" : "bg-forest text-chalk"} />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
              <a
                href={m.cta.href}
                className={`mt-10 inline-flex items-center justify-center rounded-[10px] px-6 py-3.5 font-bold transition-colors ${
                  m.featured
                    ? "bg-chalk text-magenta-ink hover:bg-forest hover:text-chalk"
                    : "border-2 border-forest hover:bg-forest hover:text-chalk"
                }`}
              >
                {m.cta.label}
              </a>
            </article>
          ))}
        </div>

        <div className="mt-16">
          <h3 className="text-xl font-bold">В кабинете партнёра</h3>
          <ul data-rise className="mt-5 flex flex-wrap gap-3">
            {cabinet.map((item) => (
              <li key={item} className="rounded-full border-2 border-chalk/25 px-5 py-2.5 font-medium">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-[60ch] text-sm opacity-75">
            Если подписка «Только лояльность» не продлена, заведение отключается от приёма бонусов и скрывается из
            каталога до оплаты.
          </p>
        </div>
      </div>
    </section>
  );
}
