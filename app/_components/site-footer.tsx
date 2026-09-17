import { Logo } from "./logo";

const product = [
  { label: "Как это работает", href: "#how" },
  { label: "Подписка", href: "#price" },
  { label: "Где тратить", href: "#where" },
  { label: "Для бизнеса", href: "#business" },
];

const ecosystem = [
  { label: "OctōPAY", note: "платежи по QR" },
  { label: "Loal", note: "программа лояльности" },
];

export function SiteFooter() {
  return (
    <footer id="contacts" className="bg-blush/60">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 pt-16 pb-10 sm:px-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-[36ch]">
          <Logo />
          <p className="mt-6 leading-relaxed">
            Подписка на бонусы в Кыргызстане. 100 000 сом бонусами на карте в
            Wallet каждый оплаченный месяц — платите ими у партнёров.
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
                <a href={item.href} className="underline-offset-4 hover:text-magenta-ink hover:underline">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-medium opacity-70">Экосистема</h2>
          <ul className="mt-5 flex flex-col gap-3">
            {ecosystem.map((item) => (
              <li key={item.label}>
                <span className="font-medium">{item.label}</span>
                <span className="block text-sm opacity-70">{item.note}</span>
              </li>
            ))}
          </ul>
        </div>

        <address className="not-italic">
          <h2 className="text-sm font-medium opacity-70">Контакты</h2>
          <ul className="mt-5 flex flex-col gap-3">
            <li>Бишкек, Кыргызстан</li>
            <li>
              <a href="tel:+996600001978" className="text-magenta-ink underline-offset-4 hover:underline">
                +996 600 001 978
              </a>
            </li>
            <li>
              <a href="mailto:info@promconsult.pro" className="text-magenta-ink underline-offset-4 hover:underline">
                info@promconsult.pro
              </a>
            </li>
            <li>
              <a href="https://promconsulting.org" className="text-magenta-ink underline-offset-4 hover:underline">
                promconsulting.org
              </a>
            </li>
          </ul>
        </address>
      </div>

      <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
        <div className="flex flex-col gap-2 border-t border-bubblegum py-6 text-sm sm:flex-row sm:justify-between">
          <p className="opacity-70">© 2026 CashUp. Все права защищены.</p>
          <p>
            <span className="opacity-70">Powered by </span>
            <a href="https://promconsulting.org" className="text-magenta-ink underline-offset-4 hover:underline">
              Prom.Consulting
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
