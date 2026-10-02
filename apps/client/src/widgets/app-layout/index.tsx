import { Clock01Icon, CreditCardIcon, Settings02Icon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { navLinkClass } from "@loal/ui/app-shell";
import { Logo } from "@loal/ui/logo";
import { Icon } from "@loal/ui/shadcn";
import { Link, Outlet, useLocation } from "react-router";

const nav = [
  { to: "/", label: "Карта", icon: CreditCardIcon },
  { to: "/history", label: "История", icon: Clock01Icon },
  { to: "/referrals", label: "Друзья", icon: UserAdd01Icon },
  { to: "/settings", label: "Настройки", icon: Settings02Icon },
];

/**
 * Кабинет держателя карты. На телефоне — вкладки снизу: экран открывают одной рукой.
 * На компьютере — меню слева, как в других кабинетах, и широкая рабочая область.
 */
export function AppLayout() {
  const location = useLocation();
  const isActive = (to: string) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to));

  return (
    <div className="flex min-h-dvh flex-col bg-background [background-image:var(--app-bg,none)] bg-fixed lg:flex-row">
      <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col gap-10 border-r border-border bg-surface/60 px-5 py-8 backdrop-blur-md lg:flex">
        <Link to="/" aria-label="Карта Loal" className="px-3">
          <Logo descriptor="Бонусы по подписке" />
        </Link>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActive(item.to) ? "page" : undefined}
              className={`${navLinkClass(isActive(item.to))} flex items-center gap-3`}
            >
              <Icon icon={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="mx-auto flex w-full max-w-[420px] items-center justify-between px-5 py-5 lg:hidden">
          <Link to="/" aria-label="Карта Loal">
            <Logo />
          </Link>
        </header>

        <main className="mx-auto w-full max-w-[420px] flex-1 px-5 pb-28 lg:max-w-[1120px] lg:px-12 lg:py-12">
          <Outlet />
        </main>
      </div>

      {/* Вкладки снизу — только на телефоне и планшете */}
      <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-[420px]">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActive(item.to) ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-base transition-colors ${
                isActive(item.to) ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon icon={item.icon} size={22} />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
