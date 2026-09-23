import { AppShell, navLinkClass, type NavItem } from "@loal/ui/app-shell";
import { Link, Outlet, useLocation } from "react-router";
import { useCurrentPartner } from "../../entities/session/model";

/** Сотрудник партнёра не приглашает других сотрудников — раздел ему не нужен. */
const navFor = (isEmployee: boolean): NavItem[] =>
  [
    { to: "/", label: "Мой QR" },
    ...(isEmployee ? [] : [{ to: "/employees", label: "Сотрудники" }]),
    { to: "/payments", label: "Операции" },
    { to: "/profile", label: "Профиль" },
  ] satisfies NavItem[];

export function AppLayout() {
  const { label, logout, isEmployee } = useCurrentPartner();
  const location = useLocation();

  return (
    <AppShell
      title="Кабинет партнёра"
      nav={navFor(isEmployee)}
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
