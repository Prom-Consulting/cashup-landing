import { Store01Icon, UserCircleIcon, WorkflowSquare02Icon } from "@hugeicons/core-free-icons";
import { AppShell, navLinkClass, type NavItem } from "@loal/ui/app-shell";
import { Icon, type IconSvg } from "@loal/ui/shadcn";
import { Link, Outlet, useLocation } from "react-router";
import { useCurrentUser } from "../../entities/session/model";

const nav: (NavItem & { icon: IconSvg })[] = [
  { to: "/", label: "Магазины", icon: Store01Icon },
  { to: "/leads", label: "Заявки", icon: WorkflowSquare02Icon },
  { to: "/profile", label: "Профиль", icon: UserCircleIcon },
];

/** Каркас админки: разделы слева, содержимое маршрута внутри. */
export function AppLayout() {
  const { label, logout } = useCurrentUser();
  const location = useLocation();
  const isActive = (to: string) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to));

  return (
    <AppShell
      title="Админка платформы"
      nav={nav}
      userLabel={label}
      onLogout={logout}
      renderLink={(item) => {
        const withIcon = nav.find((entry) => entry.to === item.to);
        return (
          <Link key={item.to} to={item.to} className={`${navLinkClass(isActive(item.to))} flex items-center gap-3`}>
            {withIcon && <Icon icon={withIcon.icon} />}
            {item.label}
          </Link>
        );
      }}
    >
      <Outlet />
    </AppShell>
  );
}
