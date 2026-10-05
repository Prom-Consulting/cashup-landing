import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@loal/ui/logo";
import { SiteFooter } from "../_components/site-footer";
import { SiteHeader } from "../_components/site-header";
import {
  CITY,
  CLIENT_APP_URL,
  EMAIL,
  LEGAL_ADDRESS,
  LEGAL_INN,
  LEGAL_NAME,
  OCTOPAY_URL,
  PHONE,
  PHONE_HREF,
  PROM_URL,
} from "../_data/site";

const description =
  "Loal — бонусная сеть по подписке в Бишкеке. Покупатели получают 15 000 бонусов на каждые 30 дней, заведения сами решают, какую часть чека они закрывают. Оператор — Prom.Consulting, платежи — через OctōPAY.";

export const metadata: Metadata = {
  title: "О компании",
  description,
  alternates: { canonical: "/about" },
  openGraph: {
    url: "/about",
    type: "website",
    locale: "ru_RU",
    siteName: "Loal",
    images: { url: "/opengraph-image.png", width: 1200, height: 630, alt: "Loal — бонусы по подписке" },
    title: "О компании Loal",
    description,
  },
};

/** Два направления из брендбука: покупатели и бизнес. */
const directions = [
  {
    key: "loal",
    title: "Loal",
    note: "для покупателей",
    text: "Подписка за 990 сом на 30 дней: карта в Apple Wallet или Google Wallet и 15 000 бонусов на каждый цикл. Бонусами закрывается часть покупки у партнёров — в пределах процента, который задал партнёр.",
    link: { label: "Как это работает", href: "/#how" },
  },
  {
    key: "corporate",
    title: "Loal Corporate",
    note: "для бизнеса",
    text: "Заведение попадает в каталог и получает гостей с бонусами. Владелец сам решает, какую долю чека они закроют, даёт доступ кассирам и филиалам и видит каждую операцию в кабинете.",
    link: { label: "Подключить заведение", href: "/become-partner" },
  },
];

/** Принципы — те же, что в контент-плане: сначала честно объяснить, потом продавать. */
const principles = [
  {
    title: "Бонусы — не деньги",
    text: "1 бонус = 1 сом только в бонусной части покупки. Их нельзя вывести, снять или перевести другу, а остаток не переносится в новый цикл. Мы пишем это прямо.",
  },
  {
    title: "Условия задаёт партнёр",
    text: "У каждого заведения свой процент, и он виден в каталоге до покупки. Мы не обещаем выгоду всем: сначала посмотрите, ходите ли вы к нашим партнёрам.",
  },
  {
    title: "Без лишнего железа",
    text: "Кассиру хватает телефона: QR карты и сумма. С OctōPAY покупатель платит сам — бонусами, банком или и тем и другим.",
  },
];

const team = [
  {
    title: "Prom.Consulting",
    text: "Разрабатывает и сопровождает Loal: сайт, кабинеты покупателя, заведения и кассира, выпуск карт в Wallet.",
    href: PROM_URL,
    label: "promconsulting.org",
  },
  {
    title: "OctōPAY",
    text: "Платёжный партнёр: через OctōPAY проходят оплата подписки, счета клиентам и самостоятельная оплата по QR и NFC.",
    href: OCTOPAY_URL,
    label: "octopay.click",
  },
];

const requisites = [
  { label: "Наименование", value: LEGAL_NAME },
  { label: "ИНН", value: LEGAL_INN },
  { label: "Юридический адрес", value: LEGAL_ADDRESS },
];

const sectionTitle = "display text-[clamp(2.08rem,4.86vw,4.14rem)] brand-gradient-text";

export default function AboutPage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1 overflow-x-clip">
        <section className="mx-auto max-w-[1440px] px-5 pt-10 pb-16 sm:px-10 sm:pt-16 sm:pb-20 xl:pb-24">
          <p className="text-lg font-bold text-flame-ink">О компании</p>
          <h1 className="display mt-4 max-w-[24ch] text-[clamp(2.4rem,5.6vw,5rem)]">
            Бонусы по подписке у&nbsp;заведений Кыргызстана
          </h1>
          <p className="mt-8 max-w-[62ch] text-lg leading-relaxed sm:text-xl">
            Loal соединяет покупателей и местный бизнес. Покупатель оформляет подписку и тратит бонусы у партнёров
            сети, а заведение получает гостей, которые выбрали его в каталоге, и само решает, сколько им отдать.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <a
              href={CLIENT_APP_URL}
              className="inline-flex items-center justify-center rounded-full bg-flame px-6 py-4 text-[1.1875rem] font-bold text-white transition-colors hover:bg-graphite"
            >
              Оформить подписку
            </a>
            <Link
              href="/partners"
              className="font-medium underline decoration-amber decoration-2 underline-offset-6 hover:decoration-flame"
            >
              Посмотреть партнёров
            </Link>
          </div>
        </section>

        <section className="bg-cream/50">
          <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-10 sm:py-20 xl:py-24">
            <h2 className={sectionTitle}>Два направления</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {directions.map((d) => (
                <article
                  key={d.key}
                  className={`flex flex-col rounded-[28px] p-8 sm:p-10 ${
                    d.key === "corporate" ? "bg-graphite text-white" : "bg-paper"
                  }`}
                >
                  <Logo
                    direction={d.key === "corporate" ? "corporate" : undefined}
                    tone={d.key === "corporate" ? "light" : "dark"}
                  />
                  <p className={`mt-6 text-base ${d.key === "corporate" ? "text-slate-soft" : "text-slate"}`}>
                    {d.title} — {d.note}
                  </p>
                  <p className="mt-3 max-w-[52ch] flex-1 text-lg leading-relaxed">{d.text}</p>
                  <Link
                    href={d.link.href}
                    className="mt-8 self-start font-bold underline decoration-amber decoration-2 underline-offset-6 hover:decoration-flame"
                  >
                    {d.link.label}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-10 sm:py-20 xl:py-24">
          <h2 className={sectionTitle}>Во что мы верим</h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {principles.map((p, i) => (
              <li key={p.title} className="border-t-2 border-graphite pt-5">
                <span className="display grid h-11 w-11 place-items-center rounded-full bg-flame-ink text-2xl text-paper">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-xl font-bold leading-snug">{p.title}</h3>
                <p className="mt-3 leading-relaxed">{p.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-graphite text-white">
          <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-10 sm:py-20 xl:py-24">
            <h2 className="display text-[clamp(2.08rem,4.86vw,4.14rem)]">Кто стоит за Loal</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {team.map((t) => (
                <article key={t.title} className="rounded-[28px] bg-coal p-8 sm:p-10">
                  <h3 className="display text-[clamp(1.57rem,2.36vw,2.07rem)]">{t.title}</h3>
                  <p className="mt-4 max-w-[48ch] text-lg leading-relaxed text-slate-soft">{t.text}</p>
                  <a
                    href={t.href}
                    className="mt-6 inline-block font-bold underline decoration-amber decoration-2 underline-offset-6 hover:decoration-flame"
                  >
                    {t.label}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-10 sm:py-20 xl:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            <h2 className={sectionTitle}>Связаться</h2>
            <ul className="flex flex-col gap-4 text-xl sm:text-2xl">
              <li className="font-medium">{CITY}</li>
              <li>
                <a href={PHONE_HREF} className="text-flame-ink underline-offset-4 hover:underline">
                  {PHONE}
                </a>
              </li>
              <li>
                <a href={`mailto:${EMAIL}`} className="text-flame-ink underline-offset-4 hover:underline">
                  {EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </section>

        <section id="requisites" className="scroll-mt-6 mx-auto max-w-[1440px] px-5 pb-16 sm:px-10 sm:pb-20 xl:pb-24">
          <div className="grid gap-10 rounded-[28px] bg-cream/60 p-8 sm:p-10 lg:grid-cols-[1fr_1.4fr]">
            <h2 className="display text-[clamp(1.57rem,2.36vw,2.07rem)]">Реквизиты</h2>
            <dl className="flex flex-col gap-5">
              {requisites.map((r) => (
                <div key={r.label}>
                  <dt className="text-base text-slate">{r.label}</dt>
                  <dd className="mt-1 text-lg font-medium sm:text-xl">{r.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
