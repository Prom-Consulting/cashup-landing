import { AppShell, navLinkClass, type NavItem } from "@loal/ui/app-shell";
import { Select } from "@loal/ui/select";
import { useId } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { useCurrentStore } from "../../entities/session/model";

const nav: NavItem[] = [
  { to: "/", label: "Обзор" },
  { to: "/deductions", label: "Списания" },
  { to: "/billing", label: "Оплата" },
  { to: "/onec", label: "Обмен с 1С" },
  { to: "/profile", label: "Профиль" },
];

export function AppLayout() {
  const { label, logout, memberships, storeId, selectStore } = useCurrentStore();
  const location = useLocation();
  const selectId = useId();

  return (
    <AppShell
      title="Кабинет магазина"
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
      {/* Человек может работать в нескольких магазинах — тогда нужен выбор */}
      {memberships.length > 1 && storeId && (
        <div className="mb-6 max-w-[320px]">
          <label htmlFor={selectId} className="text-base text-slate">
            Магазин
          </label>
          <div className="mt-2">
            <Select
              id={selectId}
              invalid={false}
              value={storeId}
              options={memberships.map((m) => ({ id: m.storeId, label: m.storeId }))}
              onChange={selectStore}
            />
          </div>
        </div>
      )}
      <Outlet />
    </AppShell>
  );
}
