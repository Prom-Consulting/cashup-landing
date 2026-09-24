import Link from "next/link";
import { Logo } from "@loal/ui/logo";
import { CLIENT_APP_URL } from "../_data/site";
import { MobileMenu } from "./mobile-menu";

const nav = [
  { label: "Что за бонусы", href: "/#bonuses" },
  { label: "Как работает", href: "/#how" },
  { label: "Партнёры", href: "/partners" },
  { label: "Цена", href: "/#price" },
  { label: "Бизнесу", href: "/become-partner" },
];

/** Кнопка ведёт в кабинет клиента: там оформляют подписку и получают карту. */
export function SiteHeader({
  cta = { label: "Оформить подписку", href: CLIENT_APP_URL },
  tone = "dark",
}: {
  cta?: { label: string; href: string };
  /** light — поверх градиента или стекла: белые ссылки и слово в логотипе. */
  tone?: "dark" | "light";
}) {
  const light = tone === "light";
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
        <a
          href={CLIENT_APP_URL}
          className={`text-lg font-bold whitespace-nowrap transition-colors ${light ? "text-white hover:text-graphite" : "hover:text-flame"}`}
        >
          Моя карта
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
      <MobileMenu nav={nav} cta={cta} />
    </header>
  );
}
