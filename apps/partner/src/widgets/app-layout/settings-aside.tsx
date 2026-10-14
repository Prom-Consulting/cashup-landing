import { Icon } from "@loal/ui/shadcn";
import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import { useTariff } from "../../entities/merchant/api";
import { useCurrentMerchant } from "../../entities/session/model";
import { useSupportTickets } from "../../entities/support/api";
import { SETTINGS_GROUPS, visibleSections } from "../../shared/config/settings-sections";

/** Разделы «Настроек», которые видит человек, — по роли, OctōPAY и тарифу. */
export function useSettingsSections() {
  const { merchantId, canManage, canRunBranch } = useCurrentMerchant();
  const { tariff, abilities } = useTariff(merchantId ?? "");
  return visibleSections({ canManage, canRunBranch, tariff, abilities });
}

/**
 * Второе меню «Настроек»: на десктопе — колонка слева от раздела, на телефоне — строка
 * разделов сверху, прокручивается вбок.
 */
export function SettingsAside() {
  const { merchantId, canRunBranch } = useCurrentMerchant();
  const sections = useSettingsSections();
  const location = useLocation();
  const support = useSupportTickets(canRunBranch ? (merchantId ?? "") : "");
  const unread = support.data?.filter((ticket) => ticket.unread).length ?? 0;
  const strip = useRef<HTMLElement>(null);
  // На телефоне открытый раздел может быть за краем строки — подвигаем её к нему
  useEffect(() => {
    const current = strip.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (current && strip.current) strip.current.scrollLeft = current.offsetLeft - 20;
  }, [location.pathname, sections.length]);
  const active = (to: string) => location.pathname === to || location.pathname.startsWith(`${to}/`);
  const badge = (to: string) =>
    to === "/support" && unread > 0 ? (
      <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
        {unread}
        <span className="sr-only"> непрочитано</span>
      </span>
    ) : null;

  return (
    <>
      <nav ref={strip} aria-label="Настройки" className="-mx-5 mb-6 overflow-x-auto px-5 lg:hidden">
        <ul className="flex w-max gap-2">
          {sections.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active(item.to) ? "page" : undefined}
                className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-base font-semibold whitespace-nowrap transition-colors ${
                  active(item.to) ? "bg-graphite text-white" : "bg-surface text-foreground hover:bg-muted"
                }`}
              >
                {item.label}
                {badge(item.to)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label="Настройки" className="hidden lg:block">
        <div className="sticky top-12 flex flex-col gap-6">
          <p className="display text-[1.6rem] leading-none">Настройки</p>
          {SETTINGS_GROUPS.map((group) => {
            const items = sections.filter((item) => item.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group}>
                <p className="mb-1.5 px-3 text-sm font-semibold text-muted-foreground">{group}</p>
                <ul className="flex flex-col gap-0.5">
                  {items.map((item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        aria-current={active(item.to) ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-base font-semibold transition-colors ${
                          active(item.to) ? "bg-surface shadow-[0_0.5rem_1.5rem_rgb(22_21_21/0.06)]" : "text-muted-foreground hover:bg-surface/60 hover:text-foreground"
                        }`}
                      >
                        <Icon icon={item.icon} className={active(item.to) ? "text-primary" : undefined} />
                        {item.label}
                        {badge(item.to)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
}
