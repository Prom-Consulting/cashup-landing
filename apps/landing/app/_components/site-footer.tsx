import Link from "next/link";
import { Logo } from "@loal/ui/logo";
import {
  CITY,
  CLIENT_APP_URL,
  EMAIL,
  LEGAL_INN,
  LEGAL_NAME,
  OCTOPAY_URL,
  PARTNER_APP_URL,
  PHONE,
  PHONE_HREF,
  PROM_URL,
  SOCIAL_LINKS,
} from "../_data/site";

const product = [
  { label: "Как это работает?", href: "/#how" },
  { label: "Тарифы", href: "/#price" },
  { label: "Партнёры", href: "/partners" },
  { label: "Loal Corporate", href: "/become-partner" },
  { label: "О компании", href: "/about" },
];

const link = "font-medium underline-offset-4 hover:underline";

export function SiteFooter() {
  return (
    <footer id="contacts" className="overflow-hidden">
      <div className="mx-auto max-w-[1512px] px-5 sm:px-12">
        <div className="rounded-[32px] bg-white p-7 shadow-[0_2rem_4rem_rgb(22_21_21/0.05)] sm:rounded-[40px] sm:p-11">
          <div className="grid gap-10 md:grid-cols-2 md:gap-8 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1.1fr]">
            <div className="max-w-[539px]">
              <Logo size="lg" descriptor="Бонусы по подписке" />
              <p className="mt-5 text-lg leading-snug text-slate sm:text-xl">
                Выгода в привычных покупках. 15&nbsp;000 бонусов на каждые 30 дней подписки — ими закрывается часть
                покупки у партнёров Loal в Бишкеке.
              </p>
            </div>

            <nav aria-labelledby="footer-product">
              {/* Подписи колонок — не заголовки: разделы страницы для поисковиков тут не начинаются */}
              <p id="footer-product" className="text-base text-slate">
                Продукт
              </p>
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
              <p className="text-base text-slate">Кабинеты</p>
              <ul className="mt-4 flex flex-col gap-4 text-lg sm:text-xl">
                <li>
                  <a href={CLIENT_APP_URL} className={`${link} hover:text-flame`}>
                    Моя карта
                  </a>
                </li>
                <li>
                  <a href={PARTNER_APP_URL} className={`${link} hover:text-flame`}>
                    Кабинет Loal Corporate
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-base text-slate">Экосистема</p>
              <a href={OCTOPAY_URL} className={`mt-4 block text-lg hover:text-flame sm:text-xl ${link}`}>
                OctōPAY
              </a>
              <p className="mt-1 text-base text-slate">платежи по QR</p>
            </div>

            <address className="not-italic">
              <p className="text-base text-slate">Контакты</p>
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
              {SOCIAL_LINKS.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-base">
                  {SOCIAL_LINKS.map((item) => (
                    <li key={item.url}>
                      <a href={item.url} target="_blank" rel="me noopener" className={`${link} hover:text-flame`}>
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </address>
          </div>

          <div className="mt-12 flex flex-col gap-2 border-t border-slate-soft/50 pt-6 text-base text-slate sm:mt-14 sm:flex-row sm:justify-between sm:text-xl">
            <div>
              <p>© 2026 Loal. Все права защищены.</p>
              <p className="mt-1 text-sm sm:text-base">
                <Link href="/about#requisites" className="underline-offset-4 hover:text-flame hover:underline">
                  {LEGAL_NAME}, ИНН {LEGAL_INN}
                </Link>
              </p>
            </div>
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
