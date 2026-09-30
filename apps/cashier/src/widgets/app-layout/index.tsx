import { Chart01Icon, CoinsSwapIcon, Clock01Icon } from "@hugeicons/core-free-icons";
import { AppShell, navLinkClass, type NavItem } from "@loal/ui/app-shell";
import { Icon, type IconSvg } from "@loal/ui/shadcn";
import { Link, Outlet, useLocation } from "react-router";
import { useCashierOverview, useCashierSession } from "../../entities/cashier/api";

type Item = NavItem & { icon: IconSvg };

/** Узкий кабинет: у кассира ровно три дела — посмотреть филиал, списать, свериться с историей. */
const nav: Item[] = [
  { to: "/", label: "Обзор", icon: Chart01Icon },
  { to: "/redeem", label: "Списать бонусы", icon: CoinsSwapIcon },
  { to: "/history", label: "История", icon: Clock01Icon },
];

export function AppLayout() {
  const { label, logout } = useCashierSession();
  const overview = useCashierOverview();
  const location = useLocation();
  const branch = overview.data?.branch?.name;
  const name = overview.data?.cashier?.fullName;

  const isActive = (to: string) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to));

  return (
    <AppShell
      title={branch ? `Кассир · ${branch}` : "Кабинет кассира"}
      direction="corporate"
      nav={nav}
      userLabel={name || label}
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
