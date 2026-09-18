import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import partnerPhoto from "@/public/images/partner-barista.jpg";
import { Coin } from "../_components/illustrations";
import { SiteFooter } from "../_components/site-footer";
import { SiteHeader } from "../_components/site-header";
import { models } from "../_data/models";
import { CITY, EMAIL, OCTOPAY_URL, PARTNER_MAIL, PHONE, PHONE_HREF } from "../_data/site";
import { PartnerForm } from "./partner-form";

export const metadata: Metadata = {
  title: "Стать партнёром Loal",
  description:
    "Подключите заведение к Loal: клиенты с балансом 100 000 сом бонусами, свой процент оплаты бонусами, кабинет партнёра и место в каталоге.",
};

const steps = [
  {
    title: "Оставляете заявку",
    text: "Рассказываете о заведении и выбираете модель подключения. Перезваниваем и отвечаем на вопросы.",
  },
  {
    title: "Оплачиваете доступ",
    text: "Для модели «Только лояльность» — 30–50 $ в месяц через OctōPAY. В пакете с OctōPAY абонентской платы нет.",
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
    title: "Клиенты с деньгами на карте",
    text: "У каждого подписчика 100 000 сом бонусами в начале оплаченного месяца. Потратить их можно только у партнёров.",
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
    a: "После первой оплаты доступа. Если подписка «Только лояльность» не продлена, заведение скрывается из каталога до оплаты.",
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
        <section className="mx-auto grid max-w-[1440px] items-center gap-14 px-5 pt-6 pb-20 sm:px-10 lg:grid-cols-[1.15fr_1fr] lg:pt-10 lg:pb-28">
          <div>
            <p className="text-lg font-medium">Для бизнеса в Бишкеке</p>
            <h1 className="display mt-4 text-[clamp(2.43rem,5.9vw,5.17rem)] text-flame">Станьте партнёром Loal</h1>
            <p className="mt-8 max-w-[50ch] text-lg leading-relaxed sm:text-xl">
              Подписчики Loal ищут, где потратить бонусы. Подключите заведение, задайте свой процент — и получайте
              гостей из каталога.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href="#form"
                className="inline-flex items-center justify-center rounded-[10px] bg-flame-ink px-7 py-4 font-bold text-paper transition-colors hover:bg-graphite"
              >
                Оставить заявку
              </Link>
              <Link
                href="/partners"
                className="font-medium underline decoration-amber decoration-2 underline-offset-6 hover:decoration-flame"
              >
                Посмотреть каталог
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[480px]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[40px]">
              <Image
                src={partnerPhoto}
                alt="Бариста за стойкой кофейни"
                fill
                quality={90}
                placeholder="blur"
                sizes="(min-width: 1024px) 480px, 92vw"
                className="object-cover object-[50%_40%]"
              />
            </div>
            <div className="absolute -bottom-6 -left-4 w-[min(280px,80%)] rounded-3xl bg-graphite p-5 text-paper sm:-left-10">
              <p className="text-sm opacity-80">Гость оплатил</p>
              <p className="display mt-1 text-4xl text-amber">400 сом бонусами</p>
              <p className="mt-2 text-sm opacity-80">Остальное — деньгами на ваш счёт</p>
            </div>
            <div className="absolute -top-6 -right-4 w-20" aria-hidden="true">
              <Coin className="h-auto w-full" />
            </div>
          </div>
        </section>

        <section className="bg-cream/50">
          <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-10 lg:py-28">
            <h2 className="display max-w-[16ch] text-[clamp(2.08rem,4.86vw,4.14rem)] text-flame">Что это даёт заведению</h2>
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

        <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-10 lg:py-28">
          <h2 className="display text-[clamp(2.08rem,4.86vw,4.14rem)] text-flame">Как подключиться</h2>
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
          <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-10 lg:py-28">
            <h2 className="display text-[clamp(2.08rem,4.86vw,4.14rem)]">Выберите модель</h2>
            <div className="mt-12 grid gap-5 lg:grid-cols-3 lg:items-stretch">
              {models(PARTNER_MAIL).map((m) => (
                <article
                  key={m.key}
                  className={`relative flex flex-col rounded-[32px] p-8 sm:p-10 ${
                    m.featured ? "bg-flame-ink text-paper lg:-my-4 lg:py-14" : "bg-paper text-graphite"
                  }`}
                >
                  {m.featured && (
                    <p className="absolute -top-4 left-8 rotate-[-3deg] rounded-full bg-amber px-4 py-1.5 text-sm font-bold text-graphite sm:left-10">
                      Выгоднее всего
                    </p>
                  )}
                  <h3 className="display text-[clamp(1.57rem,2.36vw,2.07rem)]">{m.title}</h3>
                  <p
                    className={`display mt-6 text-[clamp(2.78rem,4.17vw,4.14rem)] whitespace-nowrap ${
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
              <h2 className="display text-[clamp(2.08rem,4.86vw,4.14rem)] text-flame">Заявка</h2>
              <p className="mt-6 max-w-[42ch] text-lg leading-relaxed">
                Заполните форму — перезвоним, поможем выбрать модель и настроить процент. Или напишите нам напрямую.
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

        <section className="mx-auto max-w-[1440px] px-5 pb-24 sm:px-10 lg:pb-32">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
            <h2 className="display text-[clamp(1.92rem,4.17vw,3.45rem)] text-flame">Вопросы</h2>
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
