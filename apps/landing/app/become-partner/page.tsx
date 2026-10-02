import type { Metadata } from "next";
import { CorporateHero } from "../_components/business-section";
import { SiteFooter } from "../_components/site-footer";
import { SiteHeader } from "../_components/site-header";
import { models } from "../_data/models";
import { CITY, EMAIL, OCTOPAY_URL, PARTNER_MAIL, PHONE, PHONE_HREF } from "../_data/site";
import { PartnerForm } from "./partner-form";

export const metadata: Metadata = {
  title: "Loal Corporate — для бизнеса",
  description:
    "Loal Corporate — программы лояльности для бизнеса. Подключите компанию к бонусной сети Loal: сами задаёте долю покупки, которую закрывают бонусы, даёте доступ сотрудникам и видите все операции.", // Своё превью в мессенджерах; картинка берётся из app/opengraph-image.png.
  alternates: { canonical: "/become-partner" },
  openGraph: {
    url: "/become-partner",
    type: "website",
    locale: "ru_RU",
    siteName: "Loal",
    images: { url: "/opengraph-image.png", width: 1200, height: 630, alt: "Loal — бонусы по подписке" },
    title: "Loal Corporate — программы лояльности для бизнеса",
    description:
      "Loal Corporate — программы лояльности для бизнеса. Подключите компанию к бонусной сети Loal: сами задаёте долю покупки, которую закрывают бонусы, даёте доступ сотрудникам и видите все операции.",
  },
};

const steps = [
  {
    title: "Оставляете заявку",
    text: "Рассказываете о заведении и выбираете модель подключения. Подтверждаете номер телефона кодом из WhatsApp.",
  },
  {
    title: "Оплачиваете доступ",
    text: "Для модели «Только лояльность» — 8 750 сом (100 $ × 87,5) в месяц через OctōPAY. В пакете с OctōPAY абонентской платы нет.",
  },
  {
    title: "Настраиваете процент",
    text: "В кабинете задаёте, какую часть чека можно закрыть бонусами в этом месяце. Меняете его перед каждым периодом.",
  },
  {
    title: "Принимаете гостей",
    text: "Заведение появляется в каталоге. Кассир сканирует QR карты, а в пакете с OctōPAY бонусы списываются сами.",
  },
];

const gains = [
  {
    title: "Покупатели с бонусами Loal",
    text: "У каждого подписчика 15 000 бонусов на оплаченный месяц, и потратить их можно только у партнёров сети.",
  },
  {
    title: "Вы решаете, сколько отдать",
    text: "Процент оплаты бонусами задаёте сами и меняете каждый месяц. Остальное гость платит деньгами.",
  },
  {
    title: "Место в каталоге",
    text: "Профиль с логотипом, категорией и процентом на карте партнёров. С меткой OctōPAY — заметнее.",
  },
  {
    title: "Ничего не нужно ставить",
    text: "Работает на телефоне кассира: QR-код карты и сумма. Терминал и новая касса не требуются.",
  },
];

const faq = [
  {
    q: "Когда заведение появится в каталоге?",
    a: "На тарифе «Только лояльность» — после оплаты, в пакете с OctōPAY — после автоматического подключения. Если подписка «Только лояльность» не продлена, заведение скрывается из каталога до оплаты.",
  },
  {
    q: "Кто платит за бонусы клиента?",
    a: "Бонусы — это скидка в пределах вашего процента. Вы отдаёте часть чека, а взамен получаете гостя, который выбрал вас из каталога.",
  },
  {
    q: "Можно менять процент?",
    a: "Да, в кабинете на каждый следующий месяц. Изменение вступает в силу с началом периода, и каталог обновляется.",
  },
];

export default function BecomePartnerPage() {
  return (
    <>
      <SiteHeader cta={{ label: "Оставить заявку", href: "#form" }} />

      <main className="flex-1 overflow-x-clip">
        <CorporateHero formHref="#form" />

        <section className="bg-cream/50">
          <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-10 sm:py-20 xl:py-24">
            <h2 className="display max-w-[16ch] text-[clamp(2.08rem,4.86vw,4.14rem)] brand-gradient-text">
              Что это даёт заведению
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {gains.map((g) => (
                <div key={g.title} className="rounded-[28px] bg-paper p-8">
                  <h3 className="text-xl font-bold">{g.title}</h3>
                  <p className="mt-3 max-w-[46ch] leading-relaxed">{g.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-10 sm:py-20 xl:py-24">
          <h2 className="display text-[clamp(2.08rem,4.86vw,4.14rem)] brand-gradient-text">Как подключиться</h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="border-t-2 border-graphite pt-5">
                <span className="display grid h-11 w-11 place-items-center rounded-full bg-flame-ink text-2xl text-paper">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-xl font-bold leading-snug">{s.title}</h3>
                <p className="mt-3 leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-graphite text-paper">
          <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-10 sm:py-20 xl:py-24">
            <h2 className="display text-[clamp(2.08rem,4.86vw,4.14rem)]">Выберите модель</h2>
            <div className="mt-12 grid gap-5 xl:grid-cols-3 xl:items-stretch">
              {models("#form").map((m) => (
                <article
                  key={m.key}
                  className={`relative flex min-w-0 flex-col rounded-[32px] p-6 sm:p-10 ${
                    m.featured ? "bg-flame-ink text-paper xl:-my-4 xl:py-14" : "bg-paper text-graphite"
                  }`}
                >
                  {m.featured && (
                    <p className="absolute -top-4 left-8 rotate-[-3deg] rounded-full bg-amber px-4 py-1.5 text-sm font-bold text-graphite sm:left-10">
                      Выгоднее всего
                    </p>
                  )}
                  <h3 className="display text-[clamp(1.57rem,2.36vw,2.07rem)]">{m.title}</h3>
                  <p
                    className={`display mt-6 text-[clamp(2.25rem,4.17vw,4.14rem)] whitespace-nowrap ${
                      m.featured ? "text-paper" : "text-flame"
                    }`}
                  >
                    {m.price}
                  </p>
                  <p className="mt-2 font-medium">{m.priceNote}</p>
                  <ul className="mt-8 flex flex-1 flex-col gap-3">
                    {m.points.map((pt) => (
                      <li key={pt} className="flex gap-3">
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                            m.featured ? "bg-paper text-flame-ink" : "bg-graphite text-paper"
                          }`}
                        >
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
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={m.cta.href}
                    className={`mt-8 rounded-full px-6 py-4 text-center font-bold ${
                      m.featured ? "bg-paper text-flame-ink" : "bg-graphite text-paper"
                    }`}
                  >
                    {m.cta.label}
                  </a>
                </article>
              ))}
            </div>
            <p className="mt-8 max-w-[64ch] text-sm opacity-75">
              Все подписки оплачиваются через{" "}
              <a href={OCTOPAY_URL} className="underline underline-offset-4 hover:no-underline">
                OctōPAY
              </a>{" "}
              на счёт Loal и продлеваются в кабинете партнёра.
            </p>
          </div>
        </section>

        <section id="form" className="scroll-mt-6">
          <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 sm:px-10 lg:grid-cols-[1fr_1.2fr] lg:py-28">
            <div>
              <h2 className="display text-[clamp(2.08rem,4.86vw,4.14rem)] brand-gradient-text">Заявка</h2>
              <p className="mt-6 max-w-[42ch] text-lg leading-relaxed">
                Выберите тариф и подтвердите телефон. Платная лояльность подключится после оплаты, бесплатные тарифы — сразу. Если нужна помощь, напишите нам.
              </p>
              <ul className="mt-8 flex flex-col gap-3 text-lg">
                <li>
                  <a href={PARTNER_MAIL} className="text-flame-ink underline-offset-4 hover:underline">
                    {EMAIL}
                  </a>
                </li>
                <li>
                  <a href={PHONE_HREF} className="text-flame-ink underline-offset-4 hover:underline">
                    {PHONE}
                  </a>
                </li>
                <li>{CITY}</li>
              </ul>
            </div>
            <PartnerForm />
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-10 sm:pb-20 xl:pb-28">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
            <h2 className="display text-[clamp(1.92rem,4.17vw,3.45rem)] brand-gradient-text">Вопросы</h2>
            <dl>
              {faq.map((item) => (
                <div key={item.q} className="border-b-2 border-cream py-6">
                  <dt className="text-xl font-medium">{item.q}</dt>
                  <dd className="mt-3 max-w-[60ch] leading-relaxed">{item.a}</dd>
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
