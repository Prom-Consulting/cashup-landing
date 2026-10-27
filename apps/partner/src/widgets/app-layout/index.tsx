import { Chart01Icon, CoinsSwapIcon, Settings02Icon, Wallet01Icon } from "@hugeicons/core-free-icons";
import { ContactVerifyBanner, WelcomeToast } from "@loal/app-kit";
import { AppShell, navLinkClass, type NavItem } from "@loal/ui/app-shell";
import { Icon, type IconSvg } from "@loal/ui/shadcn";
import { Select } from "@loal/ui/select";
import { useId } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { type MerchantTariff } from "@loal/api";
import { useTariff } from "../../entities/merchant/api";
import { useSupportTickets } from "../../entities/support/api";
import { useCurrentMerchant } from "../../entities/session/model";
import { NotificationsBell } from "../notifications-bell";
import { StoreChooser } from "../store-chooser";
import { CASHIER_APP_URL } from "../../shared/config/env";
import { isSettingsPath } from "../../shared/config/settings-sections";
import { SettingsAside } from "./settings-aside";

type Item = NavItem & { icon: IconSvg; tariff?: MerchantTariff };

/**
 * В меню — только ежедневное: обзор, касса и счёт клиенту (на OctōPAY). Остальные разделы
 * собраны в «Настройках» (shared/config/settings-sections).
 */
const nav: Item[] = [
  { to: "/", label: "Обзор", icon: Chart01Icon },
  { to: "/redeem", label: "Списать бонусы", icon: CoinsSwapIcon },
  { to: "/client-payments", label: "Счёт клиенту", icon: Wallet01Icon, tariff: "octopay" },
  { to: "/settings", label: "Настройки", icon: Settings02Icon },
];

/** Касса называется по тарифу: «Больше клиентов» — только кэшбэк, «Очень много» — и то и другое. */
const tillLabel = (abilities: { redeem: boolean; cashback: boolean }) =>
  abilities.redeem && abilities.cashback ? "Бонусы и кэшбэк" : abilities.cashback ? "Дать кэшбэк" : "Списать бонусы";

export function AppLayout() {
  const { label, logout, memberships, merchantId, selectMerchant, canRunBranch, hasChosen } = useCurrentMerchant();
  const { tariff, abilities } = useTariff(merchantId ?? "");
  const items = nav
    .filter((item) => !item.tariff || item.tariff === tariff)
    .map((item) => (item.to === "/redeem" ? { ...item, label: tillLabel(abilities) } : item));
  const location = useLocation();
  const selectId = useId();
  // Ответ поддержки — повод заглянуть: число непрочитанных у пункта меню
  const support = useSupportTickets(canRunBranch ? (merchantId ?? "") : "");
  const supportUnread = support.data?.filter((ticket) => ticket.unread).length ?? 0;

  const inSettings = isSettingsPath(location.pathname);
  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : to === "/settings" ? inSettings : location.pathname.startsWith(to);

  // Кассир работает в своём кабинете, cashier.loal.kg: здесь владелец и администратор филиала
  if (memberships.length > 0 && memberships.every((m) => m.role === "staff"))
    return <CashierElsewhere onLogout={logout} />;

  // Несколько заведений на аккаунте — выбираем, с каким работать (выбор запоминается).
  if (memberships.length > 1 && !hasChosen) return <StoreChooser />;

  return (
    <AppShell
      title="Кабинет партнёра"
      direction="corporate"
      nav={items}
      userLabel={label}
      onLogout={logout}
      headerSlot={<NotificationsBell />}
      renderLink={(item) => {
        const withIcon = items.find((entry) => entry.to === item.to);
        return (
          <Link key={item.to} to={item.to} className={`${navLinkClass(isActive(item.to))} flex items-center gap-3`}>
            {withIcon && <Icon icon={withIcon.icon} />}
            {item.label}
            {item.to === "/settings" && supportUnread > 0 && (
              <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                {supportUnread}
                <span className="sr-only"> непрочитано</span>
              </span>
            )}
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
              options={memberships.map((m) => ({ id: m.merchantId, label: m.merchantName ?? m.merchantId }))}
              onChange={selectMerchant}
            />
          </div>
        </div>
      )}
      {/* Владелец, заведённый агентством с временным паролем, подтверждает номер или почту */}
      <ContactVerifyBanner />
      {inSettings ? (
        <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <SettingsAside />
          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      ) : (
        <Outlet />
      )}
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
