import { Clock01Icon, CreditCardIcon } from "@hugeicons/core-free-icons";
import { useSession } from "@loal/app-kit";
import { Logo } from "@loal/ui/logo";
import { Icon } from "@loal/ui/shadcn";
import { Link, Outlet, useLocation } from "react-router";

const nav = [
  { to: "/", label: "Карта", icon: CreditCardIcon },
  { to: "/history", label: "История", icon: Clock01Icon },
];

/** Кабинет держателя карты: две вкладки, всё остальное — на самой карте. */
export function AppLayout() {
  const { logout } = useSession();
  const location = useLocation();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="mx-auto flex w-full max-w-[420px] items-center justify-between px-5 py-5">
        <Link to="/" aria-label="Карта Loal">
          <Logo />
        </Link>
        <button type="button" onClick={logout} className="text-base text-muted-foreground hover:text-foreground">
          Выйти
        </button>
      </header>

      <main className="mx-auto w-full max-w-[420px] flex-1 px-5 pb-28">
        <Outlet />
      </main>

      {/* Вкладки снизу: экран открывают на телефоне, часто одной рукой */}
      <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-surface">
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
