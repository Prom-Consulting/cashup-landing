import { cn } from "@loal/ui/shadcn";
import { NavLink, Outlet } from "react-router";

/** Всё, из чего состоит карта платформы: дизайн, программа, бонусные товары и сертификаты Wallet. */
export const CARD_SECTIONS = [
  { to: "/templates", label: "Карты" },
  { to: "/programs", label: "Программы" },
  { to: "/bonus-items", label: "Бонусные товары" },
  { to: "/certificates", label: "Сертификаты" },
] as const;

/**
 * Одна страница «Карта Loal» с вкладками вместо четырёх пунктов меню. Адреса вкладок прежние —
 * ссылки и закладки на /templates, /programs и другие продолжают работать.
 */
export function CardSuiteLayout() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="display text-[clamp(1.75rem,3vw,2.5rem)]">Карта Loal</h1>
        <p className="mt-2 max-w-[70ch] text-lg text-muted-foreground">
          Как выглядит карта в Wallet, по каким правилам копятся бонусы, что можно получить и чем подписаны карты.
        </p>
      </div>
      <nav aria-label="Разделы карты">
        <ul className="flex flex-wrap gap-2">
          {CARD_SECTIONS.map((section) => (
            <li key={section.to}>
              <NavLink
                to={section.to}
                end={false}
                className={({ isActive }) =>
                  cn(
                    "inline-flex rounded-full border px-4 py-2 text-base font-medium whitespace-nowrap transition-colors",
                    isActive ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground",
                  )
                }
              >
                {section.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet />
    </section>
  );
}
