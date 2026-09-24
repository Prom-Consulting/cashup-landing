import Link from "next/link";
import { Logo } from "@loal/ui/logo";
import { CITY, CLIENT_APP_URL, EMAIL, OCTOPAY_URL, PARTNER_APP_URL, PHONE, PHONE_HREF, PROM_URL } from "../_data/site";

const product = [
  { label: "Как это работает?", href: "/#how" },
  { label: "Тарифы", href: "/#price" },
  { label: "Партнёры на карте", href: "/partners" },
  { label: "Стать партнёром", href: "/become-partner" },
];

const link = "font-medium underline-offset-4 hover:underline";

export function SiteFooter() {
  return (
    <footer id="contacts" className="overflow-hidden">
      <div className="mx-auto max-w-[1512px] px-5 sm:px-12">
        <div className="rounded-[32px] bg-cream p-7 sm:rounded-[40px] sm:p-11">
          <div className="grid gap-10 md:grid-cols-2 md:gap-8 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1.1fr]">
            <div className="max-w-[539px]">
              <Logo size="lg" />
              <p className="mt-4 text-lg leading-snug text-slate sm:text-xl">
                Подписка на бонусы в Кыргызстане. 100 000 сом бонусами на карте в Apple Wallet каждый оплаченный месяц —
                платите ими у партнёров.
              </p>
            </div>

            <nav aria-labelledby="footer-product">
              <h2 id="footer-product" className="text-base text-slate">
                Продукт
              </h2>
              <ul className="mt-4 flex flex-col gap-4 text-lg sm:text-xl">
                {product.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={`${link} hover:text-flame`}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <h2 className="text-base text-slate">Кабинеты</h2>
              <ul className="mt-4 flex flex-col gap-4 text-lg sm:text-xl">
                <li>
                  <a href={CLIENT_APP_URL} className={`${link} hover:text-flame`}>
                    Моя карта
                  </a>
                </li>
                <li>
                  <a href={PARTNER_APP_URL} className={`${link} hover:text-flame`}>
                    Кабинет заведения
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-base text-slate">Экосистема</h2>
              <a href={OCTOPAY_URL} className={`mt-4 block text-lg hover:text-flame sm:text-xl ${link}`}>
                OctōPAY
              </a>
              <p className="mt-1 text-base text-slate">платежи по QR</p>
            </div>

            <address className="not-italic">
              <h2 className="text-base text-slate">Контакты</h2>
              <ul className="mt-4 flex flex-col gap-4 text-lg sm:text-xl">
                <li className="font-medium">{CITY}</li>
                <li>
                  <a href={PHONE_HREF} className={`${link} text-flame-ink`}>
                    {PHONE}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${EMAIL}`} className={`${link} text-flame-ink`}>
                    {EMAIL}
                  </a>
                </li>
                <li>
                  <a href={PROM_URL} className={`${link} text-flame-ink`}>
                    promconsulting.org
                  </a>
                </li>
              </ul>
            </address>
          </div>

          <div className="mt-12 flex flex-col gap-2 border-t border-slate-soft/50 pt-6 text-base text-slate sm:mt-14 sm:flex-row sm:justify-between sm:text-xl">
            <p>© 2026 Loal. Все права защищены.</p>
            <p>
              Powered by{" "}
              <a href={PROM_URL} className="underline-offset-4 hover:text-flame hover:underline">
                Prom.Consulting
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Огромная надпись, срезанная нижним краем страницы, — как в макете */}
      <p
        aria-hidden="true"
        className="loal-wordmark display mt-4 -mb-[9vw] text-center text-[38vw] leading-none tracking-normal uppercase select-none sm:-mb-[8vw]"
      >
        Loal
      </p>
    </footer>
  );
}
