import { BonusCalculator } from "./_components/bonus-calculator";
import { BusinessSection } from "./_components/business-section";
import { Faq } from "./_components/faq";
import { HeroVisual } from "./_components/hero-visual";
import { BagIcon, BeautyIcon, CarIcon, Coin, CoffeeIcon, HomeIcon, SportIcon } from "./_components/illustrations";
import { MonthStory } from "./_components/month-story";
import { PageMotion } from "./_components/page-motion";
import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";

// TODO: point to the client cabinet once the system is live.
const SUBSCRIBE_URL = "#price";
const PARTNER_URL = "mailto:info@promconsult.pro?subject=Подключение%20к%20Loal";

const categories = [
  { label: "Кофейни и рестораны", Icon: CoffeeIcon },
  { label: "Салоны красоты", Icon: BeautyIcon },
  { label: "Магазины одежды", Icon: BagIcon },
  { label: "Фитнес и спорт", Icon: SportIcon },
  { label: "Автосервисы", Icon: CarIcon },
  { label: "Услуги для дома", Icon: HomeIcon },
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
    a: "5–10 $ за месяц. Оплата проходит через OctōPAY, продлить можно в личном кабинете одной кнопкой.",
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
    a: "Выберите модель: только лояльность за 30–50 $ в месяц, OctōPAY с лояльностью без абонентской платы или только OctōPAY. Напишите нам — поможем настроить кабинет и процент.",
  },
];

function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center rounded-[10px] bg-magenta-ink px-7 py-4 font-bold text-chalk transition-colors hover:bg-forest"
    >
      {children}
    </a>
  );
}

function Ribbon() {
  const words = ["100 000 сом бонусами", "каждый месяц", "у партнёров", "в Apple Wallet"];
  const run = [...words, ...words];
  return (
    <div
      data-marquee
      aria-hidden="true"
      className="relative -left-[5%] w-[110%] -rotate-2 overflow-hidden bg-forest py-5 text-chalk"
    >
      <div data-marquee-track className="flex w-max">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {run.map((w, i) => (
              <span key={i} className="flex items-center">
                <span className="display px-6 text-5xl whitespace-nowrap sm:text-6xl">{w}</span>
                <Coin className="h-10 w-10 shrink-0" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <PageMotion />
      <SiteHeader />

      <main id="top" className="flex-1 overflow-x-clip">
        {/* Hero */}
        <section className="mx-auto grid max-w-[1440px] items-center gap-20 px-5 pt-8 pb-28 sm:px-10 lg:grid-cols-[1.2fr_1fr] lg:gap-12 lg:pt-6 lg:pb-36">
          <div>
            <h1 className="display text-magenta" data-hero-item>
              <span data-hero-number className="block text-[clamp(6.5rem,20vw,16rem)] whitespace-nowrap">
                100 000
              </span>
              <span data-hero-sub className="mt-3 block text-[clamp(2.5rem,5.6vw,5rem)]">
                сом бонусами <span className="whitespace-nowrap">каждый месяц</span>
              </span>
            </h1>
            <p data-hero-item data-hero-fade className="mt-10 max-w-[44ch] text-lg leading-relaxed sm:text-xl">
              Подписка Loal за 5–10 $ в месяц — это карта в Apple Wallet, которой можно платить у партнёров. В начале
              каждого оплаченного месяца баланс снова полный, сколько бы вы ни потратили.
            </p>
            <div data-hero-item data-hero-fade className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <PrimaryButton href={SUBSCRIBE_URL}>Оформить подписку</PrimaryButton>
              <a
                href="#business"
                className="font-medium underline decoration-bubblegum decoration-2 underline-offset-6 hover:decoration-magenta"
              >
                Подключить бизнес
              </a>
            </div>
          </div>
          <HeroVisual />
        </section>

        {/* Monthly cycle */}
        <section id="how" className="scroll-mt-6 bg-blush/50">
          <div className="mx-auto max-w-[1440px] px-5 pt-24 sm:px-10 lg:pt-32">
            <h2 data-split className="display max-w-[14ch] text-[clamp(3.5rem,9vw,8rem)] text-magenta">
              Один месяц <span className="whitespace-nowrap">с Loal</span>
            </h2>
          </div>

          <MonthStory />

          <div className="mx-auto max-w-[1440px] px-5 pt-8 pb-24 sm:px-10 lg:pb-32">
            <div data-rise className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[28px] bg-forest p-8 text-chalk sm:p-10">
                <p className="display text-6xl">Продлили</p>
                <p className="mt-4 max-w-[40ch] text-lg leading-relaxed">
                  С первого дня нового периода на карте снова 100 000 сом бонусами. Всё, что вы потратили, доначислено.
                </p>
              </div>
              <div className="rounded-[28px] border-2 border-forest p-8 sm:p-10">
                <p className="display text-6xl">Не продлили</p>
                <p className="mt-4 max-w-[40ch] text-lg leading-relaxed">
                  Оставшиеся бонусы сгорают, платить ими нельзя. Оплатите подписку — и баланс снова станет 100 000.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Calculator */}
        <section className="mx-auto max-w-[1440px] px-5 py-24 sm:px-10 lg:py-32">
          <div className="grid items-end gap-6 lg:grid-cols-[1.3fr_1fr]">
            <h2 data-split className="display text-[clamp(3.5rem,9vw,8rem)] text-magenta">
              Сколько закроют бонусы
            </h2>
            <p className="max-w-[40ch] text-lg leading-relaxed lg:pb-3">
              Передвиньте сумму и выберите процент партнёра — чек пересчитается сам.
            </p>
          </div>
          <div data-calc className="mt-14">
            <BonusCalculator />
          </div>
        </section>

        {/* Where to spend */}
        <section id="where" className="scroll-mt-6 mx-auto max-w-[1440px] px-5 pb-24 sm:px-10 lg:pb-32">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <h2 data-split className="display text-[clamp(3.5rem,9vw,8rem)] text-magenta">
                Где тратить
              </h2>
              <p className="mt-6 max-w-[42ch] text-lg leading-relaxed">
                Все партнёры и их проценты — в каталоге на сайте. Бонусы принимают только активные партнёры, и только в
                пределах своего процента.
              </p>
              <p className="mt-6 inline-flex max-w-[44ch] items-start gap-3 rounded-2xl bg-blush px-5 py-4">
                <span className="mt-0.5 shrink-0 rounded-full bg-magenta-ink px-2.5 py-0.5 text-sm font-bold text-chalk">
                  OctōPAY
                </span>
                <span>С этой меткой — больше бонусов: они списываются и начисляются сами, когда вы платите по QR.</span>
              </p>
            </div>
            <ul data-categories>
              {categories.map(({ label, Icon }) => (
                <li key={label} data-category className="group flex items-center gap-5 border-b-2 border-blush py-3">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-blush transition-transform duration-300 group-hover:-rotate-12 sm:h-16 sm:w-16">
                    <Icon className="h-9 w-9 sm:h-10 sm:w-10" />
                  </span>
                  <span className="display text-[clamp(2.25rem,5vw,3.75rem)] text-forest">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Ribbon />

        {/* Price */}
        <section id="price" className="relative -mt-3 scroll-mt-6 overflow-hidden bg-magenta-ink text-chalk">
          <div
            data-price-coin
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -bottom-24 w-[420px] opacity-25 sm:-right-16"
          >
            <Coin className="h-auto w-full" />
          </div>
          <div className="relative mx-auto max-w-[1440px] px-5 py-24 sm:px-10 lg:py-32">
            <h2 data-split className="display text-[clamp(3.5rem,9vw,8rem)]">
              Тарифы
            </h2>
            <p className="mt-4 max-w-[52ch] text-lg">
              Все подписки оплачиваются через OctōPAY на счёт Loal и продлеваются в личном кабинете.
            </p>

            <div className="mt-14 grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-10">
              {/* Client subscription */}
              <div className="flex flex-col">
                <h3 className="text-xl font-bold">Клиенту: карта Loal</h3>
                <p data-price className="display mt-4 text-[clamp(6rem,16vw,12.5rem)] whitespace-nowrap">
                  5–10 $
                </p>
                <p className="display text-[clamp(2.25rem,4vw,3.5rem)]">в месяц</p>
                <p className="mt-3 text-lg opacity-90">Примерно 440–880 сом. На карте — 100 000 сом бонусами.</p>
                <ul data-rise className="mt-8 flex flex-col gap-3 text-lg">
                  {included.map((item) => (
                    <li key={item} className="border-b border-chalk/40 pb-3">
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={SUBSCRIBE_URL}
                  className="mt-10 inline-flex items-center justify-center self-start rounded-[10px] bg-chalk px-7 py-4 font-bold text-forest transition-colors hover:bg-forest hover:text-chalk"
                >
                  Оформить подписку
                </a>
              </div>

              {/* Partner subscription */}
              <div className="flex flex-col rounded-[32px] bg-chalk p-8 text-forest sm:p-10">
                <h3 className="text-xl font-bold">Партнёру: только лояльность</h3>
                <p className="display mt-4 text-[clamp(4.5rem,9vw,7.5rem)] whitespace-nowrap text-magenta">30–50 $</p>
                <p className="display text-[clamp(2rem,3.4vw,3rem)]">в месяц</p>
                <ul className="mt-6 flex flex-col gap-3">
                  {partnerIncluded.map((item) => (
                    <li key={item} className="border-b border-blush pb-3">
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-8 rounded-2xl bg-forest p-5 text-chalk">
                  <p className="font-bold">OctōPAY + лояльность</p>
                  <p className="mt-1 flex items-baseline gap-3">
                    <span className="display shrink-0 text-5xl whitespace-nowrap text-bubblegum">0 $</span>
                    <span>абонентской платы — только комиссия OctōPAY с оборота</span>
                  </p>
                </div>

                <a
                  href="#business"
                  className="mt-8 inline-flex items-center justify-center self-start rounded-[10px] bg-magenta-ink px-7 py-4 font-bold text-chalk transition-colors hover:bg-forest"
                >
                  Подключить бизнес
                </a>
              </div>
            </div>
          </div>
        </section>

        <BusinessSection partnerUrl={PARTNER_URL} />

        {/* FAQ */}
        <section id="faq" className="scroll-mt-6 mx-auto max-w-[1440px] px-5 py-24 sm:px-10 lg:py-32">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
            <h2 data-split className="display text-[clamp(3.5rem,9vw,8rem)] text-magenta">
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
