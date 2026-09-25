import { Clock01Icon, CreditCardIcon, Settings02Icon } from "@hugeicons/core-free-icons";
import { Logo } from "@loal/ui/logo";
import { Icon } from "@loal/ui/shadcn";
import { Link, Outlet, useLocation } from "react-router";

const nav = [
  { to: "/", label: "Карта", icon: CreditCardIcon },
  { to: "/history", label: "История", icon: Clock01Icon },
  { to: "/settings", label: "Настройки", icon: Settings02Icon },
];

/** Кабинет держателя карты: карта, история и настройки — вкладками снизу. */
export function AppLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-dvh flex-col bg-background [background-image:var(--app-bg,none)] bg-fixed">
      <header className="mx-auto flex w-full max-w-[420px] items-center justify-between px-5 py-5">
        <Link to="/" aria-label="Карта Loal">
          <Logo />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-[420px] flex-1 px-5 pb-28">
        <Outlet />
      </main>

      {/* Вкладки снизу: экран открывают на телефоне, часто одной рукой */}
      <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[420px]">
          {nav.map((item) => {
            const active = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-base transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon icon={item.icon} size={22} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
