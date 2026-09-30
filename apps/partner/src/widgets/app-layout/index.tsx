import {
  Chart01Icon,
  CoinsSwapIcon,
  Agreement02Icon,
  CreditCardIcon,
  Invoice01Icon,
  LinkSquare02Icon,
  CashierIcon,
  Settings02Icon,
  Store01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { WelcomeToast } from "@loal/app-kit";
import { AppShell, navLinkClass, type NavItem } from "@loal/ui/app-shell";
import { Icon, type IconSvg } from "@loal/ui/shadcn";
import { Select } from "@loal/ui/select";
import { useId } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { useCurrentMerchant } from "../../entities/session/model";
import { CASHIER_APP_URL } from "../../shared/config/env";

type Item = NavItem & { icon: IconSvg; ownerOnly?: boolean };

/** ownerOnly — разделы владельца: кассиру и партнёру сервер там ответит 403. */
const nav: Item[] = [
  { to: "/", label: "Обзор", icon: Chart01Icon },
  { to: "/redeem", label: "Списать бонусы", icon: CoinsSwapIcon },
  { to: "/storefront", label: "Витрина", icon: Store01Icon },
  { to: "/deductions", label: "Списания", icon: CreditCardIcon, ownerOnly: true },
  { to: "/billing", label: "Оплата", icon: Invoice01Icon, ownerOnly: true },
  { to: "/team", label: "Команда", icon: UserGroupIcon, ownerOnly: true },
  { to: "/pos", label: "Касса", icon: CashierIcon },
  { to: "/webhooks", label: "Вебхуки", icon: LinkSquare02Icon, ownerOnly: true },
  { to: "/onec", label: "Обмен с 1С", icon: Settings02Icon, ownerOnly: true },
];

/** Раздел партнёра виден только партнёрам и их сотрудникам. */
const partnerNav: NavItem & { icon: IconSvg } = { to: "/partner", label: "Я партнёр", icon: Agreement02Icon };

export function AppLayout() {
  const { label, logout, memberships, merchantId, selectMerchant, membership, canManage } = useCurrentMerchant();
  const isPartner = membership?.role === "partner" || membership?.role === "partner_employee";
  const allowed = nav.filter((item) => canManage || !item.ownerOnly);
  const items = isPartner ? [allowed[0]!, partnerNav, ...allowed.slice(1)] : allowed;
  const location = useLocation();
  const selectId = useId();

  const isActive = (to: string) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to));

  // Кассир филиала работает в своём узком кабинете — здесь ему ничего не открыто
  if (memberships.length > 0 && memberships.every((m) => m.role === "partner_employee"))
    return <CashierElsewhere onLogout={logout} />;

  return (
    <AppShell
      title="Кабинет партнёра"
      direction="corporate"
      nav={items}
      userLabel={label}
      onLogout={logout}
      renderLink={(item) => {
        const withIcon = items.find((entry) => entry.to === item.to);
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
      <WelcomeToast />
    </AppShell>
  );
}

function CashierElsewhere({ onLogout }: { onLogout: () => void }) {
  const host = CASHIER_APP_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] place-items-center bg-cream px-5 py-10">
      <div className="w-full max-w-[440px] rounded-[28px] bg-paper p-7 sm:p-10">
        <h1 className="display text-[1.9rem] leading-tight">Ваш кабинет — {host}</h1>
        <p className="mt-3 text-lg leading-snug text-slate">
          Вы кассир филиала: списывать бонусы и смотреть свою историю нужно там. Войдите тем же номером телефона.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <a
            href={CASHIER_APP_URL}
            className="inline-flex items-center rounded-full bg-primary px-7 py-4 text-lg font-bold text-white hover:bg-graphite"
          >
            Открыть кабинет кассира
          </a>
          <button type="button" onClick={onLogout} className="text-base text-flame-ink underline underline-offset-4">
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}
