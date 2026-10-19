import Link from "next/link";
import { Logo } from "@loal/ui/logo";
import { APP_STORE_URL, CLIENT_APP_URL, PARTNER_APP_URL } from "../_data/site";
import { MobileMenu } from "./mobile-menu";

const nav = [
  { label: "Что за бонусы", href: "/#bonuses" },
  { label: "Как работает", href: "/#how" },
  { label: "Партнёры", href: "/partners" },
  { label: "Цена", href: "/#price" },
  { label: "Бизнесу", href: "/become-partner" },
];

/** Вход в свой кабинет: покупателю — карта, бизнесу — кабинет партнёра. */
const ACCOUNT = {
  client: { label: "Моя карта", href: CLIENT_APP_URL },
  business: { label: "Мой бизнес", href: PARTNER_APP_URL },
} as const;

function AppleMark({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16.37 12.6c.02 2.42 2.12 3.22 2.15 3.23-.02.06-.34 1.15-1.1 2.27-.66.97-1.35 1.94-2.43 1.96-1.06.02-1.4-.63-2.62-.63-1.21 0-1.6.61-2.6.65-1.05.04-1.85-1.05-2.52-2.02-1.37-1.98-2.42-5.6-1.01-8.05.7-1.21 1.95-1.98 3.31-2 1.03-.02 2.01.7 2.64.7.63 0 1.82-.86 3.07-.73.52.02 1.99.21 2.93 1.59-.08.05-1.75 1.02-1.73 3.04ZM14.36 5.06c.56-.68.94-1.62.83-2.56-.81.03-1.78.54-2.36 1.21-.52.6-.97 1.56-.85 2.48.9.07 1.82-.46 2.38-1.13Z" />
    </svg>
  );
}

/** Приложение Loal в App Store: в шапке у всех страниц — и для покупателей, и в Loal Corporate. */
function AppStoreLink({ light, compact = false }: { light: boolean; compact?: boolean }) {
  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener"
      aria-label="Скачать приложение Loal в App Store"
      className={`inline-flex items-center gap-2 rounded-full font-bold whitespace-nowrap transition-colors ${
        compact ? "h-11 w-11 justify-center" : "px-4 py-3 text-base"
      } ${light ? "bg-white/15 text-white ring-1 ring-white/40 hover:bg-white hover:text-graphite" : "bg-graphite text-white hover:bg-flame"}`}
    >
      <AppleMark className={compact ? "h-5 w-5" : "h-[1.15rem] w-[1.15rem]"} />
      {!compact && <span>Скачать приложение</span>}
    </a>
  );
}

/** Кнопка «Моя карта» ведёт в кабинет клиента, ссылка рядом — «Мой бизнес» в кабинет партнёра. */
export function SiteHeader({
  cta = { label: "Моя карта", href: CLIENT_APP_URL },
  tone = "dark",
  audience = "business",
}: {
  cta?: { label: string; href: string };
  /** business — страницы для бизнеса: вместо «Моя карта» вход в кабинет партнёра. */
  audience?: keyof typeof ACCOUNT;
  /** light — поверх градиента или стекла: белые ссылки и слово в логотипе. */
  tone?: "dark" | "light";
}) {
  const light = tone === "light";
  const account = ACCOUNT[audience];
  return (
    <header className="relative z-50 mx-auto flex w-full max-w-[1512px] items-center justify-between gap-6 px-5 py-5 sm:px-12">
      <Link href="/" aria-label="Loal, на главную" className="relative z-50">
        <Logo tone={light ? "light" : "dark"} mark={light ? "white" : "brand"} />
      </Link>
      <nav aria-label="Разделы" className="hidden lg:block">
        <ul className={`flex gap-6 text-lg font-bold ${light ? "text-white" : ""}`}>
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`whitespace-nowrap transition-colors ${light ? "hover:text-graphite" : "hover:text-flame"}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="hidden items-center gap-5 lg:flex">
        <span className="xl:hidden">
          <AppStoreLink light={light} compact />
        </span>
        <span className="hidden xl:inline-flex">
          <AppStoreLink light={light} />
        </span>
        <a
          href={account.href}
          className={`text-lg font-bold whitespace-nowrap transition-colors ${light ? "text-white hover:text-graphite" : "hover:text-flame"}`}
        >
          {account.label}
        </a>
        <Link
          href={cta.href}
          className={`rounded-full px-5 py-4 text-[1.1875rem] font-bold whitespace-nowrap transition-colors ${
            light
              ? "bg-white text-graphite hover:bg-graphite hover:text-white"
              : "bg-flame text-white hover:bg-graphite"
          }`}
        >
          {cta.label}
        </Link>
      </div>
      <div className="flex items-center gap-3 lg:hidden">
        <AppStoreLink light={light} compact />
        <MobileMenu nav={nav} cta={cta} account={account} />
      </div>
    </header>
  );
}
