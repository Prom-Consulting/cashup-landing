import type { Metadata } from "next";
import { CorporateHero } from "../_components/business-section";
import { CorporateHeader } from "../_components/corporate-header";
import { SiteFooter } from "../_components/site-footer";
import { ScrollToHash } from "../_components/scroll-to-hash";
import { models } from "../_data/models";
import { getBusinessPricing } from "../_data/business-pricing";
import { BusinessPricingProvider } from "../_components/business-pricing";
import { PAGE_SEO, openGraph } from "../_data/seo";
import { CITY, EMAIL, OCTOPAY_URL, PARTNER_MAIL, PHONE, PHONE_HREF } from "../_data/site";
import { PartnerForm } from "./partner-form";
import { TariffPrice } from "./tariff-price";

export const metadata: Metadata = {
  title: { absolute: PAGE_SEO.business.title },
  description: PAGE_SEO.business.description,
  alternates: { canonical: "/become-partner" },
  openGraph: openGraph("/become-partner", PAGE_SEO.business.title, PAGE_SEO.business.description),
};

const steps = [
  {
    title: "Оставляете заявку",
    text: "Рассказываете о заведении и выбираете тариф. Подтверждаете номер телефона кодом из WhatsApp.",
  },
  {
    title: "Получаете кабинет",
    text: "Регистрация бесплатная. Актуальные цены и количество бесплатных мест указаны в тарифах ниже.",
  },
  {
    title: "Настраиваете процент",
    text: "В кабинете задаёте, какую часть чека можно закрыть бонусами в этом месяце. Меняете его перед каждым периодом.",
  },
  {
    title: "Принимаете гостей",
    text: "Заведение появляется в каталоге. Клиенты находят вас в каталоге Loal и приходят с бонусами.",
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
    a: "После проверки заведения — при оплаченной подписке или пока действует бесплатная акция. Когда лимит мест заполнится, обычная цена включится для всех заведений на тарифе. Уже оплаченные периоды сохраняются.",
  },
  {
    q: "Чем тарифы отличаются друг от друга?",
    a: "«Больше клиентов» — клиент получает у вас кэшбэк. «Ещё больше клиентов» — клиент оплачивает часть чека бонусами. «Очень много клиентов» — и то и другое, плюс выделение в каталоге и день повышенной видимости раз в неделю.",
  },
  {
    q: "Нужен ли OctōPAY?",
    a: "Приём платежей OctōPAY доступен всем заведениям Loal по желанию. Если нужны только платежи без программы лояльности, подключайтесь напрямую на octopay.click.",
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

export default async function BecomePartnerPage() {
  const pricing = await getBusinessPricing();

  return (
    <BusinessPricingProvider initialPricing={pricing}>
      <CorporateHeader cta={{ label: "Стать партнером", href: "#form" }} />

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
            <h2 className="display text-[clamp(2.08rem,4.86vw,4.14rem)]">Выберите тариф</h2>
            <p className="mt-4 max-w-[60ch] text-lg opacity-85">
              Бесплатные места и текущая цена обновляются автоматически. После заполнения лимита обычная цена действует для всех.
            </p>
            <div className="mt-12 grid gap-5 xl:grid-cols-3 xl:items-stretch">
              {models("#form").map((m) => (
                <article
                  key={m.key}
                  className={`relative flex min-w-0 flex-col rounded-[32px] p-6 sm:p-10 ${
                    m.featured ? "bg-flame-ink text-paper xl:-my-4 xl:py-14" : "bg-paper text-graphite"
                  }`}
                >
                  <h3 className="display text-[clamp(1.57rem,2.36vw,2.07rem)]">{m.title}</h3>
                  <TariffPrice tariff={m.key} featured={m.featured} />
                  <p className="mt-6 leading-relaxed">{m.benefit}</p>
                  {m.better && <p className="mt-3 font-bold leading-snug">{m.better}</p>}
                  <ul className="mt-6 flex flex-1 flex-col gap-3">
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
            <div className="mt-10">
              <div className="flex flex-col justify-between gap-5 rounded-[28px] border-2 border-paper/20 p-6 sm:flex-row sm:items-center sm:p-8">
                <div>
                  <h3 className="text-xl font-bold">Только OctōPAY</h3>
                  <p className="mt-1 opacity-80">Нужны только платежи без программы лояльности.</p>
                </div>
                <a
                  href={OCTOPAY_URL}
                  className="shrink-0 rounded-full bg-paper px-6 py-3 text-center font-bold text-graphite"
                >
                  Перейти на octopay.click
                </a>
              </div>
            </div>
            <p className="mt-8 max-w-[64ch] text-sm opacity-75">
              Подписка оплачивается в кабинете Loal через{" "}
              <a href={OCTOPAY_URL} className="underline underline-offset-4 hover:no-underline">
                OctōPAY
              </a>. Приём платежей OctōPAY доступен на всех тарифах по желанию.
            </p>
          </div>
        </section>

        <ScrollToHash id="form" />
        <section id="form" className="scroll-mt-6">
          <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 sm:px-10 lg:grid-cols-[1fr_1.2fr] lg:py-28">
            <div>
              <h2 className="display text-[clamp(2.08rem,4.86vw,4.14rem)] brand-gradient-text">Заявка</h2>
              <p className="mt-6 max-w-[42ch] text-lg leading-relaxed">
                Выберите тариф и подтвердите телефон — регистрация бесплатная. Текущая цена и бесплатные места показаны выше. Подписку оплачивают в кабинете Loal. Если нужна помощь, напишите нам.
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
    </BusinessPricingProvider>
  );
}
