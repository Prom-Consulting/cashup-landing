import {
  CashierIcon,
  Chart01Icon,
  Clock01Icon,
  CoinsSwapIcon,
  Store01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { WelcomeToast } from "@loal/app-kit";
import { AppShell, navLinkClass, type NavItem } from "@loal/ui/app-shell";
import { Icon, type IconSvg } from "@loal/ui/shadcn";
import { Link, Outlet, useLocation } from "react-router";
import {
  useCashierMerchant,
  useCashierOverview,
  useCashierSession,
  type CashierKind,
} from "../../entities/cashier/api";

type Item = NavItem & { icon: IconSvg };

/**
 * Узкий кабинет. Кассир магазина видит то же, что видел в кабинете партнёра: обзор, списание,
 * витрину и кассу. Кассир филиала — обзор, списание и свою историю.
 */
const NAV: Record<CashierKind, Item[]> = {
  merchant: [
    { to: "/", label: "Обзор", icon: Chart01Icon },
    { to: "/redeem", label: "Списать бонусы", icon: CoinsSwapIcon },
    { to: "/storefront", label: "Витрина", icon: Store01Icon },
    { to: "/pos", label: "Касса", icon: CashierIcon },
  ],
  branch: [
    { to: "/", label: "Обзор", icon: Chart01Icon },
    { to: "/redeem", label: "Списать бонусы", icon: CoinsSwapIcon },
    { to: "/client-payments", label: "Счёт клиенту", icon: Wallet01Icon },
    { to: "/history", label: "История", icon: Clock01Icon },
    { to: "/storefront", label: "Витрина", icon: Store01Icon },
    { to: "/pos", label: "Касса", icon: CashierIcon },
  ],
};

export function AppLayout() {
  const { label, logout, kind, merchantId } = useCashierSession();
  const overview = useCashierOverview(kind === "branch");
  const merchant = useCashierMerchant(kind === "merchant" ? merchantId : "");
  const location = useLocation();
  const nav = NAV[kind ?? "merchant"];

  const place = kind === "branch" ? (overview.data?.branch?.name ?? overview.data?.merchant?.name) : merchant.data?.name;
  const name = kind === "branch" ? overview.data?.cashier?.fullName : null;
  const isActive = (to: string) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to));

  return (
    <AppShell
      title={place ? `Кассир · ${place}` : "Кабинет кассира"}
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
      <WelcomeToast />
    </AppShell>
  );
}
