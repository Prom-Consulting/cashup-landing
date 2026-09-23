import { AppShell, navLinkClass, type NavItem } from "@loal/ui/app-shell";
import { Link, Outlet, useLocation } from "react-router";
import { useCurrentUser } from "../../entities/session/model";

const nav: NavItem[] = [
  { to: "/", label: "Магазины" },
  { to: "/leads", label: "Заявки" },
  { to: "/profile", label: "Профиль" },
];

/** Каркас админки: разделы слева, содержимое маршрута внутри. */
export function AppLayout() {
  const { label, logout } = useCurrentUser();
  const location = useLocation();

  return (
    <AppShell
      title="Админка платформы"
      nav={nav}
      userLabel={label}
      onLogout={logout}
      renderLink={(item) => (
        <Link
          key={item.to}
          to={item.to}
          className={navLinkClass(item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to))}
        >
          {item.label}
        </Link>
      )}
    >
      <Outlet />
    </AppShell>
  );
}
