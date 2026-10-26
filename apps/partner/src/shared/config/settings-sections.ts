import {
  CashierIcon,
  CreditCardIcon,
  CustomerSupportIcon,
  Invoice01Icon,
  LinkSquare02Icon,
  NfcIcon,
  Settings02Icon,
  Store01Icon,
  UserAdd01Icon,
  UserGroupIcon,
  UserSettings01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvg } from "@loal/ui/shadcn";

/**
 * Разделы, собранные в «Настройках»: в меню остаются только ежедневные действия (обзор, касса,
 * счёт клиенту). access — кому виден раздел (как в меню), tariff — только при связи с OctōPAY,
 * ability — только если тариф разрешает списание или кэшбэк.
 */
export type SettingsSection = {
  to: string;
  label: string;
  about: string;
  icon: IconSvg;
  group: "Заведение" | "Журналы и команда" | "Касса и интеграции" | "Помощь и аккаунт";
  access?: "branch" | "owner";
  tariff?: "octopay";
  ability?: "redeem" | "cashback";
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { to: "/storefront", label: "Витрина", about: "Как заведение выглядит в каталоге Loal", icon: Store01Icon, group: "Заведение" },
  { to: "/billing", label: "Оплата", about: "Подписка Loal и счета", icon: Invoice01Icon, group: "Заведение", access: "owner" },
  {
    to: "/business-referrals",
    label: "Пригласить заведение",
    about: "Приведите заведение — получите бесплатные месяцы тарифа",
    icon: UserAdd01Icon,
    group: "Заведение",
    access: "owner",
  },
  {
    to: "/checkout-points",
    label: "NFC-кассы",
    about: "Самостоятельная оплата по NFC и QR",
    icon: NfcIcon,
    group: "Заведение",
    access: "owner",
    tariff: "octopay",
  },
  {
    to: "/deductions",
    label: "Списания",
    about: "Журнал оплат бонусами",
    icon: CreditCardIcon,
    group: "Журналы и команда",
    access: "branch",
    ability: "redeem",
  },

  { to: "/team", label: "Команда", about: "Сотрудники, филиалы и роли", icon: UserGroupIcon, group: "Журналы и команда", access: "branch" },
  { to: "/pos", label: "Касса", about: "Настройки кассы", icon: CashierIcon, group: "Касса и интеграции" },
  { to: "/webhooks", label: "Вебхуки", about: "Уведомления о событиях в ваши системы", icon: LinkSquare02Icon, group: "Касса и интеграции", access: "owner" },
  { to: "/onec", label: "Обмен с 1С", about: "Списания из вашей 1С", icon: Settings02Icon, group: "Касса и интеграции", access: "owner" },
  { to: "/support", label: "Поддержка", about: "Вопросы агентству Loal", icon: CustomerSupportIcon, group: "Помощь и аккаунт", access: "branch" },
  { to: "/profile", label: "Профиль", about: "Имя, почта, пароль, вход через Google", icon: UserSettings01Icon, group: "Помощь и аккаунт" },
];

export const SETTINGS_GROUPS: SettingsSection["group"][] = ["Заведение", "Журналы и команда", "Касса и интеграции", "Помощь и аккаунт"];

/** Какие разделы видит человек: по роли, связи с OctōPAY и тарифу. */
export function visibleSections(ctx: {
  canManage: boolean;
  canRunBranch: boolean;
  tariff: string;
  abilities: { redeem: boolean; cashback: boolean };
}) {
  return SETTINGS_SECTIONS.filter(
    (item) =>
      (!item.access || (item.access === "owner" ? ctx.canManage : ctx.canRunBranch)) &&
      (!item.tariff || item.tariff === ctx.tariff) &&
      (!item.ability || ctx.abilities[item.ability]),
  );
}

/** Адрес — раздел настроек (для подсветки «Настроек» в меню и ссылки «← Настройки»). */
export const isSettingsPath = (path: string) =>
  path === "/settings" || SETTINGS_SECTIONS.some((item) => path === item.to || path.startsWith(`${item.to}/`));
