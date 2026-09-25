import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Sparkle } from "@loal/ui/logo";
import bannerGlass from "@/public/images/brand/banner-glass.jpg";
import { BonusCalculator } from "./_components/bonus-calculator";
import { BusinessSection } from "./_components/business-section";
import { Faq } from "./_components/faq";
import { HeroCards } from "./_components/hero-cards";
import { JsonLd } from "./_components/json-ld";
import { MonthSteps } from "./_components/month-steps";
import { PageMotion } from "./_components/page-motion";
import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";
import { CLIENT_APP_URL, OCTOPAY_URL } from "./_data/site";

// Подписку оформляют в кабинете клиента: там же выпускается карта
const SUBSCRIBE_URL = CLIENT_APP_URL;

const categories = [
  { label: "Кофейни и рестораны", icon: "coffee" },
  { label: "Салоны красоты", icon: "beauty" },
  { label: "Магазины одежды", icon: "bag" },
  { label: "Фитнес и спорт", icon: "sport" },
  { label: "Автосервисы", icon: "car" },
  { label: "Услуги для дома", icon: "home" },
];

/**
 * Главный барьер из контент-плана: «15 000» читают как деньги. Снимаем его сразу
 * после первого экрана, тремя короткими фактами — без маркетинга.
 */
const bonusFacts = [
  {
    title: "1 бонус = 1 сом",
    text: "Но только в бонусной части покупки у партнёра. Остаток чека вы платите деньгами, как обычно.",
  },
  {
    title: "Это не деньги",
    text: "Бонусы нельзя снять в банкомате, вывести на карту или перевести другу. Ими закрывают часть покупок.",
  },
  {
    title: "Процент задаёт партнёр",
    text: "У каждого заведения свой потолок: где-то до 20% чека, где-то больше. Условия видны в каталоге до покупки.",
  },
];

/** Честная проверка вместо обещания «выгодно всем» — так требует контент-план. */
const worthIt = [
  "Откройте каталог и найдите партнёров, к которым вы и так ходите",
  "Прикиньте, сколько тратите у них за месяц",
  "Умножьте на их процент — это то, что закроют бонусы",
  "Сравните с 17 $ за подписку",
];

const included = [
  "15 000 бонусов на каждый оплаченный месяц",
  "Карта Loal в Apple Wallet",
  "Каталог партнёров с их процентами",
  "Кабинет: баланс, история трат, продление",
];

const faq = [
  { q: "Сколько стоит подписка?", a: "17 $ в месяц. Оплата проходит через OctōPAY, продлить можно в личном кабинете." },
  {
    q: "15 000 бонусов — это 15 000 сом?",
    a: "Нет. 1 бонус равен 1 сому только в бонусной части покупки у партнёра. Это не наличные: бонусы нельзя снять, вывести на карту или обменять на деньги.",
  },
  {
    q: "Можно передать бонусы другу или вывести их?",
    a: "Нет. Бонусы привязаны к вашей карте Loal и тратятся только у партнёров, в пределах их процента.",
  },
  {
    q: "Сколько можно оплатить бонусами?",
    a: "Не больше процента, который задал партнёр. Например, при 20% с чека на 2 000 сом бонусами закроется 400, а 1 600 вы заплатите деньгами. Реальный процент смотрите у партнёра в каталоге.",
  },
  {
    q: "Остаток бонусов переносится на следующий месяц?",
    a: "Нет. Если вы продлили подписку, новый период начинается с полного баланса 15 000 бонусов, а остаток прошлого не добавляется. Если не продлили — бонусы сгорают, пока вы снова не оплатите подписку.",
  },
  {
    q: "Кому подписка выгодна, а кому нет?",
    a: "Если вы регулярно покупаете у партнёров Loal, бонусы закрывают часть этих трат. Если к партнёрам почти не ходите, подписка не окупится — посмотрите каталог до оплаты.",
  },
  {
    q: "Как подключить свой бизнес?",
    a: "Оставьте заявку на странице «Бизнесу». Вы сами задаёте максимальный процент чека, который клиенты могут закрыть бонусами, и управляете им в кабинете Loal Corporate.",
  },
];

export const metadata: Metadata = { alternates: { canonical: "/" } };

// Для поисковиков: вопросы-ответы и сама подписка с ценой.
const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

const subscriptionLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Подписка Loal",
  description:
    "Подписка Loal за 17 $ в месяц: карта в Apple Wallet и 15 000 бонусов на оплаченный период. Бонусами закрывается часть покупки у партнёров в Бишкеке.",
  brand: { "@type": "Brand", name: "Loal" },
  offers: {
    "@type": "Offer",
    price: "17",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "17",
      priceCurrency: "USD",
      billingDuration: "P1M",
      unitCode: "MON",
    },
  },
};

const pill =
  "inline-flex items-center justify-center rounded-full px-6 py-4 text-[1.1875rem] font-bold transition-colors focus-visible:outline-offset-4";
const sectionTitle = "display text-[clamp(2.25rem,4vw,3.75rem)]";

export default function Home() {
  return (
    <>
      <PageMotion />
      <JsonLd data={faqLd} />
      <JsonLd data={subscriptionLd} />

      <main id="top" className="flex-1 overflow-x-clip">
        {/* Первый экран: стекло из брендбука, шапка внутри, карты веером срезает скругление */}
        <section className="relative isolate overflow-hidden rounded-b-[48px] bg-[linear-gradient(165deg,#ff4a3e_0%,#ff5d34_45%,#ff7a36_75%,#ffa33b_100%)] text-white sm:rounded-b-[96px]">
          {/* Стекло из брендбука — блики поверх градиента; сам цвет даёт градиент, поэтому картинка не мылит */}
          <Image
            src={bannerGlass}
            alt=""
            priority
            placeholder="blur"
            sizes="100vw"
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35 mix-blend-soft-light [mask-image:radial-gradient(120%_80%_at_50%_20%,black_40%,transparent_85%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 -z-10 h-40 bg-[linear-gradient(180deg,rgb(22_21_21/0.14),transparent)]"
          />
          <SiteHeader tone="light" />

          <div className="relative z-10 mx-auto flex max-w-[1080px] flex-col items-center px-5 pt-10 text-center sm:pt-20">
            <p
              data-hero-item
              data-hero-fade
              className="rounded-full border border-white/50 bg-white/15 px-5 py-2.5 text-base font-bold backdrop-blur-md sm:text-lg"
            >
              Бонусы по подписке
            </p>
            <h1 data-hero-item className="display mt-7">
              <span
                data-hero-number
                className="block text-[clamp(3.4rem,10vw,9rem)] leading-[1] font-black whitespace-nowrap"
              >
                15 000
              </span>
              <span
                data-hero-sub
                className="mt-2 block text-[clamp(1.6rem,4.2vw,3.6rem)] leading-[1.08] font-extrabold"
              >
                бонусов на каждый месяц подписки
              </span>
            </h1>
            <p
              data-hero-item
              data-hero-fade
              className="mt-7 max-w-[760px] text-[1.1875rem] leading-snug font-bold sm:text-xl"
            >
              Loal — подписка за 17 $ в месяц. Вы получаете карту в Apple Wallet и 15&nbsp;000 бонусов на оплаченный
              период, а бонусами закрываете часть покупки у партнёров.
            </p>
            <div data-hero-item data-hero-fade className="mt-8 flex flex-wrap justify-center gap-4">
              <a href={SUBSCRIBE_URL} className={`${pill} bg-white text-graphite hover:bg-graphite hover:text-white`}>
                Оформить подписку
              </a>
              <a
                href="#bonuses"
                className={`${pill} border-2 border-white/80 text-white hover:bg-white hover:text-graphite`}
              >
                Что за бонусы?
              </a>
            </div>
          </div>

          {/* Карты лояльности веером: низ срезает скругление секции */}
          <div
            data-hero-item
            data-hero-art
            aria-hidden="true"
            className="pointer-events-none relative mt-6 [--w:min(1184px,118vw)]"
            // Шире родителя на телефоне, поэтому mx-auto не центрирует — считаем отступ сами.
            style={{ width: "var(--w)", height: "calc(var(--w) * 0.386)", marginLeft: "calc(50% - var(--w) / 2)" }}
          >
            <HeroCards />
          </div>
        </section>

        {/* Вопрос 2: что такое 15 000 бонусов */}
        <section id="bonuses" className="scroll-mt-6">
          <div className="mx-auto max-w-[1280px] px-5 pt-20 pb-8 sm:px-12 sm:pt-32">
            <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr] lg:items-end lg:gap-16">
              <h2 data-split className={sectionTitle}>
                15 000 бонусов — это что?
              </h2>
              <p className="text-lg leading-snug text-slate sm:text-xl">
                Сначала о главном: это не 15&nbsp;000 сом на карте и не деньги для вывода. Это бонусы, которыми вы
                закрываете часть покупок у партнёров Loal.
              </p>
            </div>
            <ul data-rise className="mt-12 grid gap-5 md:grid-cols-3">
              {bonusFacts.map((fact, index) => (
                <li
                  key={fact.title}
                  className={`flex flex-col gap-4 rounded-[32px] p-7 sm:p-9 ${
                    index === 1 ? "bg-graphite text-white" : "bg-white shadow-[0_1.5rem_3rem_rgb(22_21_21/0.06)]"
                  }`}
                >
                  <Sparkle className={`h-7 w-7 ${index === 1 ? "text-amber" : "text-flame"}`} />
                  <h3 className="display text-[clamp(1.6rem,2.3vw,2.1rem)]">{fact.title}</h3>
                  <p className={`text-lg leading-snug ${index === 1 ? "text-slate-soft" : "text-slate"}`}>
                    {fact.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Вопросы 3–6: оформить, добавить в Wallet, заплатить, новый период */}
        <section id="how" className="scroll-mt-6">
          <div className="mx-auto max-w-[1512px] px-5 pt-20 pb-16 sm:px-12 sm:pt-28 sm:pb-24">
            <h2 data-split className={`${sectionTitle} text-center`}>
              Как это работает
            </h2>
            <MonthSteps />
          </div>
        </section>

        {/* Вопрос 7: считаем выгоду на конкретном чеке */}
        <section className="brand-gradient text-graphite">
          <div className="mx-auto max-w-[1512px] px-5 py-20 sm:px-12 sm:py-28">
            <h2 data-split className={`${sectionTitle} text-center`}>
              Разбираем чек
            </h2>
            <p className="mx-auto mt-6 max-w-[620px] text-center text-lg leading-snug font-semibold sm:text-xl">
              Чек на 2&nbsp;000 сом у партнёра с 20%: 400 закроют бонусы, 1&nbsp;600 — деньгами. Поменяйте сумму и
              процент — это пример, реальный процент смотрите у партнёра.
            </p>
            <div data-calc className="mt-10">
              <BonusCalculator />
            </div>
          </div>
        </section>

        {/* Вопрос 8: что происходит в новом периоде */}
        <section className="mx-auto max-w-[1512px] px-5 pt-20 sm:px-12 sm:pt-28">
          <h2 data-split className={`${sectionTitle} text-center`}>
            Что будет в следующем месяце
          </h2>
          <div data-rise className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
            <div className="relative overflow-hidden rounded-[32px] p-8 text-graphite sm:rounded-[48px] sm:p-11">
              <div aria-hidden="true" className="brand-gradient absolute inset-0 -z-0" />
              <div className="relative">
                <p className="display text-[clamp(2.4rem,4vw,3.75rem)]">Продлили</p>
                <p className="mt-6 max-w-[520px] text-lg leading-snug font-semibold sm:text-xl">
                  Новый период начинается с полного баланса: снова 15&nbsp;000 бонусов. Остаток прошлого месяца не
                  переносится.
                </p>
              </div>
            </div>
            <div className="rounded-[32px] bg-cream p-8 sm:rounded-[48px] sm:p-11">
              <p className="display text-[clamp(2.4rem,4vw,3.75rem)]">Не продлили</p>
              <p className="mt-6 max-w-[520px] text-lg leading-snug sm:text-xl">
                Оставшиеся бонусы сгорают, платить ими нельзя. Оплатите подписку — и новый период начнётся со
                15&nbsp;000.
              </p>
            </div>
          </div>
        </section>

        {/* Вопрос 5: где тратить */}
        <section id="where" className="scroll-mt-6">
          <div className="mx-auto grid max-w-[1120px] items-center gap-12 px-5 py-20 sm:px-12 sm:py-32 lg:grid-cols-[1fr_1fr] lg:gap-24">
            <div>
              <h2 data-split className={sectionTitle}>
                Где тратить бонусы
              </h2>
              <p className="mt-6 text-lg leading-snug text-slate sm:text-xl">
                Все партнёры и их условия — в каталоге. Процент у каждого свой, и он виден до покупки. Бонусы принимают
                только действующие партнёры.
              </p>
              <Link
                href="/partners"
                className={`${pill} mt-8 bg-flame font-bold text-[1.1875rem] text-white hover:bg-graphite focus-visible:outline-flame`}
              >
                Открыть каталог партнёров
              </Link>
              <p className="mt-8 max-w-[440px] rounded-3xl bg-cream px-5 py-4 text-base leading-snug">
                С меткой{" "}
                <a href={OCTOPAY_URL} className="font-bold text-flame-ink underline underline-offset-4">
                  OctōPAY
                </a>{" "}
                бонусы списываются сами, когда вы платите по QR.
              </p>
            </div>

            <ul data-categories className="grid grid-cols-2 gap-4">
              {categories.map(({ label, icon }) => (
                <li
                  key={label}
                  data-category
                  className="group flex flex-col gap-4 rounded-[28px] bg-white p-5 shadow-[0_1rem_2rem_rgb(22_21_21/0.05)]"
                >
                  <span className="brand-gradient grid h-14 w-14 place-items-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/images/landing/icon-${icon}.svg`} alt="" className="h-7 w-7 brightness-0 invert" />
                  </span>
                  <span className="text-lg leading-tight font-bold">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Вопрос 13: кому выгодно — посчитать самому, без обещаний */}
        <section className="mx-auto max-w-[1280px] px-5 sm:px-12">
          <div className="grid gap-10 rounded-[40px] bg-graphite p-8 text-white sm:p-14 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
            <div>
              <h2 data-split className={sectionTitle}>
                Окупится ли подписка?
              </h2>
              <p className="mt-6 text-lg leading-snug text-slate-soft sm:text-xl">
                Не всем. Если вы почти не бываете у партнёров Loal, 17&nbsp;$ не вернутся. Проверьте за минуту:
              </p>
            </div>
            <ol className="flex flex-col gap-4">
              {worthIt.map((step, index) => (
                <li key={step} className="glass-dark flex items-start gap-4 rounded-3xl p-5">
                  <span className="brand-gradient display grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg">
                    {index + 1}
                  </span>
                  <span className="pt-1.5 text-lg leading-snug">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Тариф */}
        <section id="price" className="scroll-mt-6">
          <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-12 sm:py-28">
            <div className="grid gap-10 rounded-[40px] bg-white p-8 shadow-[0_2rem_4rem_rgb(22_21_21/0.06)] sm:p-14 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div>
                <p className="text-lg font-bold text-flame-ink">Подписка Loal</p>
                <p
                  data-price
                  className="display mt-4 flex flex-wrap items-baseline gap-x-[0.3em] text-[clamp(4rem,8vw,7.5rem)] leading-none"
                >
                  <span className="whitespace-nowrap">17 $</span>
                  <span className="text-[0.36em] whitespace-nowrap text-slate">в месяц</span>
                </p>
                <p className="mt-5 text-lg text-slate sm:text-xl">
                  Примерно 1 500 сом. Оплата через{" "}
                  <a href={OCTOPAY_URL} className="text-flame-ink underline underline-offset-4 hover:no-underline">
                    OctōPAY
                  </a>
                  , продление — в личном кабинете.
                </p>
                <a
                  href={SUBSCRIBE_URL}
                  className={`${pill} mt-8 bg-flame font-bold text-[1.1875rem] text-white hover:bg-graphite`}
                >
                  Оформить подписку
                </a>
              </div>
              <ul data-rise className="flex flex-col gap-3">
                {included.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-4 rounded-3xl bg-cream px-5 py-4 text-lg font-semibold"
                  >
                    <Sparkle className="h-6 w-6 shrink-0 text-flame" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Вопросы 9–10: Loal Corporate */}
        <BusinessSection partnerUrl="/become-partner" />

        {/* Вопросы */}
        <section id="faq" className="scroll-mt-6">
          <div className="mx-auto grid max-w-[1512px] gap-10 px-5 py-20 sm:px-12 sm:py-32 lg:grid-cols-[1fr_812px]">
            <h2 data-split className="display brand-gradient-text text-[clamp(3rem,5.85vw,5.5rem)]">
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
