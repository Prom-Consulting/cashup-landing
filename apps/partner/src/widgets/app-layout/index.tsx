import {
  Chart01Icon,
  CoinsSwapIcon,
  CreditCardIcon,
  Invoice01Icon,
  LinkSquare02Icon,
  CashierIcon,
  Settings02Icon,
  Store01Icon,
  UserGroupIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { WelcomeToast } from "@loal/app-kit";
import { AppShell, navLinkClass, type NavItem } from "@loal/ui/app-shell";
import { Icon, type IconSvg } from "@loal/ui/shadcn";
import { Select } from "@loal/ui/select";
import { useId } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { type MerchantTariff } from "@loal/api";
import { useTariff } from "../../entities/merchant/api";
import { useCurrentMerchant } from "../../entities/session/model";
import { CASHIER_APP_URL } from "../../shared/config/env";

/**
 * Кто видит раздел: все, владелец и администратор филиала, или только владелец.
 * tariff — раздел есть только на этом тарифе («Счёт клиенту» — на OctōPAY + Loal).
 */
type Item = NavItem & { icon: IconSvg; access?: "branch" | "owner"; tariff?: MerchantTariff };

const nav: Item[] = [
  { to: "/", label: "Обзор", icon: Chart01Icon },
  { to: "/redeem", label: "Списать бонусы", icon: CoinsSwapIcon },
  { to: "/client-payments", label: "Счёт клиенту", icon: Wallet01Icon, tariff: "octopay" },
  { to: "/storefront", label: "Витрина", icon: Store01Icon },
  { to: "/deductions", label: "Списания", icon: CreditCardIcon, access: "branch" },
  { to: "/team", label: "Команда", icon: UserGroupIcon, access: "branch" },
  { to: "/billing", label: "Оплата", icon: Invoice01Icon, access: "owner" },
  { to: "/pos", label: "Касса", icon: CashierIcon },
  { to: "/webhooks", label: "Вебхуки", icon: LinkSquare02Icon, access: "owner" },
  { to: "/onec", label: "Обмен с 1С", icon: Settings02Icon, access: "owner" },
];

export function AppLayout() {
  const { label, logout, memberships, merchantId, selectMerchant, canManage, canRunBranch } = useCurrentMerchant();
  const { tariff } = useTariff(merchantId ?? "");
  const items = nav.filter(
    (item) =>
      (!item.access || (item.access === "owner" ? canManage : canRunBranch)) &&
      (!item.tariff || item.tariff === tariff),
  );
  const location = useLocation();
  const selectId = useId();

  const isActive = (to: string) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to));

  // Кассир работает в своём кабинете, cashier.loal.kg: здесь владелец и администратор филиала
  if (memberships.length > 0 && memberships.every((m) => m.role === "staff"))
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
          Вы кассир: списывать бонусы, смотреть витрину и кассу нужно там. Войдите тем же номером телефона.
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
