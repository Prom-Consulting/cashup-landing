import type { Metadata } from "next";
import { BonusCalculator } from "./_components/bonus-calculator";
import { BusinessSection } from "./_components/business-section";
import { Faq } from "./_components/faq";
import { HeroCards } from "./_components/hero-cards";
import { JsonLd } from "./_components/json-ld";
import { MonthSteps } from "./_components/month-steps";
import { PageMotion } from "./_components/page-motion";
import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";
import { OCTOPAY_URL, PARTNER_MAIL } from "./_data/site";

// TODO: point to the client cabinet once the system is live.
const SUBSCRIBE_URL = "#price";

const categories = [
  { label: "Кофейни и рестораны", icon: "coffee" },
  { label: "Салоны красоты", icon: "beauty" },
  { label: "Магазины одежды", icon: "bag" },
  { label: "Фитнес и спорт", icon: "sport" },
  { label: "Автосервисы", icon: "car" },
  { label: "Услуги для дома", icon: "home" },
];

const included = [
  "100 000 сом бонусами в начале каждого оплаченного месяца",
  "Карта Loal в Apple Wallet",
  "Каталог партнёров с их процентами",
  "Кабинет: срок подписки, баланс, история трат, продление",
  "Напоминание перед концом периода",
];

const partnerIncluded = [
  "Место в каталоге Loal и кабинет партнёра",
  "Свой % оплаты бонусами на каждый месяц",
  "Приём бонусов по QR-коду карты",
  "Без продления — скрытие из каталога до оплаты",
];

const faq = [
  {
    q: "Сколько стоит подписка?",
    a: "10 $ в месяц. Оплата проходит через OctōPAY, продлить можно в личном кабинете одной кнопкой.",
  },
  {
    q: "Что будет, если не продлить подписку?",
    a: "Все оставшиеся бонусы сгорают, и платить ими нельзя до новой оплаты. После оплаты на карте снова 100 000 сом бонусами.",
  },
  {
    q: "Бонусы накапливаются?",
    a: "Нет. В начале каждого оплаченного месяца баланс снова становится 100 000 — сколько бы вы ни потратили в прошлом.",
  },
  {
    q: "Сколько можно оплатить бонусами?",
    a: "Не больше процента, который партнёр задал на этот месяц. 1 бонус = 1 сом, остаток чека оплачивается деньгами.",
  },
  {
    q: "Можно вывести бонусы на карту?",
    a: "Нет. Бонусы — не электронные деньги: ими можно оплатить часть покупки у партнёров, но не перевести на банковский счёт.",
  },
  {
    q: "Как подключить свой бизнес?",
    a: "Выберите модель: только лояльность за 40 $ в месяц, OctōPAY с лояльностью без абонентской платы или только OctōPAY. Напишите нам — поможем настроить кабинет и процент.",
  },
];

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Для поисковиков: вопросы-ответы и сама подписка с ценой.
const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

const subscriptionLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Подписка Loal",
  description:
    "Карта Loal в Apple Wallet с балансом 100 000 сом бонусами каждый оплаченный месяц. Бонусами оплачивается часть чека у партнёров в Бишкеке.",
  brand: { "@type": "Brand", name: "Loal" },
  offers: {
    "@type": "Offer",
    price: "10",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "10",
      priceCurrency: "USD",
      billingDuration: "P1M",
      unitCode: "MON",
    },
  },
};

const pill = "inline-flex items-center justify-center rounded-full px-5 py-4 text-lg transition-colors";

export default function Home() {
  return (
    <>
      <PageMotion />
      <JsonLd data={faqLd} />
      <JsonLd data={subscriptionLd} />

      <main id="top" className="flex-1 overflow-x-clip">
        {/* Первый экран: серая подложка со скруглённым низом, шапка внутри неё */}
        <section className="relative overflow-hidden rounded-b-[48px] bg-cream sm:rounded-b-[100px]">
          <SiteHeader />
          <div className="relative z-10 mx-auto flex max-w-[1005px] flex-col items-center px-5 pt-12 text-center sm:pt-24">
            <h1 data-hero-item className="display uppercase">
              <span
                data-hero-number
                className="block text-[clamp(2.9rem,8.9vw,8.4rem)] leading-[1.1] whitespace-nowrap"
              >
                100 000 сом
              </span>
              <span data-hero-sub className="block text-[max(min(5.8vw,1.35rem),min(4.1vw,3.85rem))] leading-[1.1]">
                бонусами каждый месяц
              </span>
            </h1>
            <p data-hero-item data-hero-fade className="mt-7 max-w-[903px] text-lg leading-snug text-slate sm:text-xl">
              Подписка Loal за 10 $ в месяц — это карта в Apple Wallet, которой можно платить у партнёров. В&nbsp;начале
              каждого оплаченного месяца баланс снова полный, сколько бы вы ни потратили.
            </p>
            <div data-hero-item data-hero-fade className="mt-7 flex flex-wrap justify-center gap-4 sm:gap-6">
              <a href={SUBSCRIBE_URL} className={`${pill} bg-flame text-white hover:bg-graphite`}>
                Оформить подписку
              </a>
              <a href="#business" className={`${pill} bg-white text-graphite hover:bg-graphite hover:text-white`}>
                Подключить бизнес
              </a>
            </div>
          </div>

          {/* Карты лояльности веером: низ срезает скругление секции */}
          <div
            data-hero-item
            data-hero-art
            aria-hidden="true"
            className="pointer-events-none relative [--w:min(1184px,118vw)]"
            // Шире родителя на телефоне, поэтому mx-auto не центрирует — считаем отступ сами.
            style={{ width: "var(--w)", height: "calc(var(--w) * 0.386)", marginLeft: "calc(50% - var(--w) / 2)" }}
          >
            <HeroCards />
          </div>
        </section>

        {/* Один месяц с Loal */}
        <section id="how" className="scroll-mt-6">
          <div className="mx-auto max-w-[1512px] px-5 pt-20 pb-16 sm:px-12 sm:pt-32 sm:pb-24">
            <h2 data-split className="display text-center text-[clamp(2.25rem,3.7vw,3.5rem)]">
              Один месяц с Loal
            </h2>
            <MonthSteps />

            <div data-rise className="mt-20 grid gap-6 sm:mt-28 md:grid-cols-2 md:gap-8">
              <div className="rounded-[32px] bg-flame p-8 text-white sm:rounded-[48px] sm:p-11">
                <p className="display text-[clamp(2.5rem,4.25vw,4rem)]">Продлили</p>
                <p className="mt-6 max-w-[520px] text-lg leading-snug sm:text-xl">
                  С первого дня нового периода на карте снова 100 000 сом бонусами. Всё, что вы потратили, доначислено.
                </p>
              </div>
              <div className="rounded-[32px] bg-cream p-8 sm:rounded-[48px] sm:p-11">
                <p className="display text-[clamp(2.5rem,4.25vw,4rem)]">Не продлили</p>
                <p className="mt-6 max-w-[520px] text-lg leading-snug sm:text-xl">
                  Оставшиеся бонусы сгорают, платить ими нельзя. Оплатите подписку — и баланс снова станет 100 000.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Калькулятор на оранжевом */}
        <section className="bg-flame text-white">
          <div className="mx-auto max-w-[1512px] px-5 py-20 sm:px-12 sm:py-28">
            <h2 data-split className="display text-center text-[clamp(2.25rem,3.7vw,3.5rem)]">
              Сколько закроют бонусы
            </h2>
            <p className="mx-auto mt-6 max-w-[520px] text-center text-lg leading-snug sm:text-xl">
              Передвиньте сумму и выберите процент партнёра — чек пересчитается сам.
            </p>
            <div data-calc className="mt-10 sm:mt-10">
              <BonusCalculator />
            </div>
          </div>
        </section>

        {/* Где тратить */}
        <section id="where" className="scroll-mt-6">
          <div className="mx-auto grid max-w-[1064px] items-center gap-12 px-5 py-20 sm:px-12 sm:py-32 lg:grid-cols-[522px_1fr] lg:gap-[174px] lg:px-0">
            <div>
              <h2 data-split className="display text-[clamp(2.25rem,3.7vw,3.5rem)]">
                Где тратить?
              </h2>
              <p className="mt-6 text-lg leading-snug text-slate sm:text-xl">
                Все партнёры и их проценты — в каталоге на сайте. Бонусы принимают только активные партнёры, и только в
                пределах своего процента.
              </p>
              <div className="relative mt-12 max-w-[377px] rounded-3xl bg-cream px-5 pt-5 pb-4 text-lg leading-snug">
                <a
                  href={OCTOPAY_URL}
                  className="font-brand absolute -top-4 left-12 rounded-full bg-flame-ink px-3 py-0.5 text-[17.5px] font-bold text-white transition-colors hover:bg-graphite"
                >
                  OctōPAY
                </a>
                С этой меткой — больше бонусов: они списываются и начисляются сами, когда вы платите по QR.
              </div>
            </div>

            <ul data-categories className="flex flex-col gap-5 sm:gap-7">
              {categories.map(({ label, icon }) => (
                <li key={label} data-category className="group flex items-center gap-4">
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-cream transition-transform duration-300 group-hover:-rotate-12">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/images/landing/icon-${icon}.svg`} alt="" className="h-8 w-8" />
                  </span>
                  <span className="text-xl font-medium sm:text-[25px]">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Тарифы */}
        <section id="price" className="scroll-mt-6 bg-cream">
          <div className="mx-auto max-w-[1512px] px-5 py-20 sm:px-12 sm:py-28">
            <h2 data-split className="display text-center text-[clamp(2.25rem,3.7vw,3.5rem)]">
              Тарифы
            </h2>
            <p className="mx-auto mt-6 max-w-[523px] text-center text-lg leading-snug text-slate sm:text-xl">
              Все подписки оплачиваются через{" "}
              <a href={OCTOPAY_URL} className="text-flame-ink underline underline-offset-4 hover:no-underline">
                OctōPAY
              </a>{" "}
              на счёт Loal и продлеваются в личном кабинете.
            </p>

            <div className="mx-auto mt-14 grid max-w-[1200px] gap-12 lg:grid-cols-[1fr_478px] lg:gap-[60px]">
              {/* Клиенту */}
              <div className="flex flex-col">
                <p className="text-lg sm:text-xl">Клиенту: карта Loal</p>
                <p
                  data-price
                  className="display mt-6 flex flex-wrap items-baseline gap-x-[0.35em] text-[clamp(3.75rem,7.2vw,6.8rem)] leading-none"
                >
                  <span className="whitespace-nowrap">10 $</span>
                  <span className="text-[0.41em] whitespace-nowrap">в месяц</span>
                </p>
                <p className="mt-6 text-lg text-slate sm:text-xl">
                  Примерно 880 сом. На карте — 100&nbsp;000 сом бонусами.
                </p>
                <ul data-rise className="mt-6 flex flex-wrap gap-4">
                  {included.map((item) => (
                    <li key={item} className="rounded-full bg-white px-5 py-4 text-lg sm:text-xl">
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={SUBSCRIBE_URL}
                  className={`${pill} mt-10 self-start bg-flame px-6 py-5 text-xl font-bold text-white hover:bg-graphite`}
                >
                  Оформить подписку
                </a>
              </div>

              {/* Партнёру */}
              <div className="flex flex-col gap-3 rounded-[32px] bg-white p-6 sm:p-8">
                <p className="text-lg sm:text-xl">Партнёру: только лояльность</p>
                <p className="display mt-3 flex flex-wrap items-baseline gap-x-[0.3em] text-[clamp(2.75rem,4.4vw,4.15rem)] leading-none text-flame">
                  <span className="whitespace-nowrap">40 $</span>
                  <span className="text-[0.53em] whitespace-nowrap">в месяц</span>
                </p>
                <ul className="mt-3 flex flex-wrap gap-3">
                  {partnerIncluded.map((item) => (
                    <li key={item} className="rounded-full bg-cream px-4 py-3 text-[15px]">
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 rounded-3xl bg-graphite p-5 text-white">
                  <p className="text-lg">OctōPAY + лояльность</p>
                  <p className="mt-3 flex items-center gap-3">
                    <span className="display shrink-0 text-[clamp(3.25rem,4.9vw,4.6rem)] leading-none text-flame">
                      0 $
                    </span>
                    <span className="text-base leading-snug">
                      абонентской платы — только комиссия OctōPAY с оборота
                    </span>
                  </p>
                </div>
                <a
                  href="#business"
                  className={`${pill} mt-1 self-start bg-flame px-6 py-5 text-xl font-bold text-white hover:bg-graphite`}
                >
                  Подключить бизнес
                </a>
              </div>
            </div>
          </div>
        </section>

        <BusinessSection partnerUrl={PARTNER_MAIL} />

        {/* Вопросы */}
        <section id="faq" className="scroll-mt-6">
          <div className="mx-auto grid max-w-[1512px] gap-10 px-5 py-20 sm:px-12 sm:py-32 lg:grid-cols-[1fr_812px]">
            <h2 data-split className="display text-[clamp(3rem,5.85vw,5.5rem)] tracking-[-0.02em] text-flame">
              Вопросы
            </h2>
            <Faq items={faq} />
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
