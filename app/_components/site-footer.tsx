import Link from "next/link";
import { Logo } from "./logo";
import { CITY, EMAIL, OCTOPAY_URL, PHONE, PHONE_HREF, PROM_URL } from "../_data/site";

const product = [
  { label: "Как это работает", href: "/#how" },
  { label: "Тарифы", href: "/#price" },
  { label: "Партнёры на карте", href: "/partners" },
  { label: "Стать партнёром", href: "/become-partner" },
];

const ecosystem = [{ label: "OctōPAY", note: "платежи по QR", href: OCTOPAY_URL }];

export function SiteFooter() {
  return (
    <footer id="contacts" className="bg-cream/60">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 pt-16 pb-10 sm:px-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-[36ch]">
          <Logo />
          <p className="mt-6 leading-relaxed">
            Подписка на бонусы в Кыргызстане. 100 000 сом бонусами на карте в
            Apple Wallet каждый оплаченный месяц — платите ими у партнёров.
          </p>
          <p className="mt-4 text-sm opacity-70">Проект Prom.Consulting</p>
        </div>

        <nav aria-labelledby="footer-product">
          <h2 id="footer-product" className="text-sm font-medium opacity-70">
            Продукт
          </h2>
          <ul className="mt-5 flex flex-col gap-3">
            {product.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="underline-offset-4 hover:text-flame-ink hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-medium opacity-70">Экосистема</h2>
          <ul className="mt-5 flex flex-col gap-3">
            {ecosystem.map((item) => (
              <li key={item.label}>
                <a href={item.href} className="font-medium underline-offset-4 hover:text-flame-ink hover:underline">
                  {item.label}
                </a>
                <span className="block text-sm opacity-70">{item.note}</span>
              </li>
            ))}
          </ul>
        </div>

        <address className="not-italic">
          <h2 className="text-sm font-medium opacity-70">Контакты</h2>
          <ul className="mt-5 flex flex-col gap-3">
            <li>{CITY}</li>
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
            <li>
              <a href={PROM_URL} className="text-flame-ink underline-offset-4 hover:underline">
                promconsulting.org
              </a>
            </li>
          </ul>
        </address>
      </div>

      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        <div className="flex flex-col gap-2 border-t border-amber py-6 text-sm sm:flex-row sm:justify-between">
          <p className="opacity-70">© 2026 Loal. Все права защищены.</p>
          <p>
            <span className="opacity-70">Powered by </span>
            <a href={PROM_URL} className="text-flame-ink underline-offset-4 hover:underline">
              Prom.Consulting
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
