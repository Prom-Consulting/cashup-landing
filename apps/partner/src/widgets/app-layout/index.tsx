import {
  Chart01Icon,
  CreditCardIcon,
  Invoice01Icon,
  LinkSquare02Icon,
  CashierIcon,
  Settings02Icon,
  Store01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { AppShell, navLinkClass, type NavItem } from "@loal/ui/app-shell";
import { Icon, type IconSvg } from "@loal/ui/shadcn";
import { Select } from "@loal/ui/select";
import { useId } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { useCurrentMerchant } from "../../entities/session/model";

const nav: (NavItem & { icon: IconSvg })[] = [
  { to: "/", label: "Обзор", icon: Chart01Icon },
  { to: "/storefront", label: "Витрина", icon: Store01Icon },
  { to: "/deductions", label: "Списания", icon: CreditCardIcon },
  { to: "/billing", label: "Оплата", icon: Invoice01Icon },
  { to: "/team", label: "Команда", icon: UserGroupIcon },
  { to: "/pos", label: "Касса", icon: CashierIcon },
  { to: "/webhooks", label: "Вебхуки", icon: LinkSquare02Icon },
  { to: "/onec", label: "Обмен с 1С", icon: Settings02Icon },
];

export function AppLayout() {
  const { label, logout, memberships, merchantId, selectMerchant } = useCurrentMerchant();
  const location = useLocation();
  const selectId = useId();

  const isActive = (to: string) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to));

  return (
    <AppShell
      title="Кабинет магазина"
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
      {/* Человек может работать в нескольких магазинах — тогда нужен выбор */}
      {memberships.length > 1 && merchantId && (
        <div className="mb-6 max-w-[320px]">
          <label htmlFor={selectId} className="text-base text-muted-foreground">
            Магазин
          </label>
          <div className="mt-2">
            <Select
              id={selectId}
              invalid={false}
              value={merchantId}
              options={memberships.map((m) => ({ id: m.merchantId, label: m.merchantId }))}
              onChange={selectMerchant}
            />
          </div>
        </div>
      )}
      <Outlet />
    </AppShell>
  );
}
