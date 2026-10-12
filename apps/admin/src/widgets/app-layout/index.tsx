import {
  Coupon01Icon,
  DoorIcon,
  Tag01Icon,
  CreditCardIcon,
  GiftIcon,
  Wallet01Icon,
  Settings02Icon,
  ShieldKeyIcon,
  Store01Icon,
  UserCircleIcon,
  UserGroupIcon,
  WorkflowSquare02Icon,
  CustomerSupportIcon,
  SquareLock02Icon,
  MoneyBag02Icon,
} from "@hugeicons/core-free-icons";
import { AppShell, navLinkClass, type NavItem } from "@loal/ui/app-shell";
import { Icon, type IconSvg } from "@loal/ui/shadcn";
import { Link, Outlet, useLocation } from "react-router";
import { useCurrentUser } from "../../entities/session/model";
import { useSupportTickets } from "../../entities/support/api";

const nav: (NavItem & { icon: IconSvg })[] = [
  { to: "/", label: "Заведения", icon: Store01Icon },
  { to: "/revenue", label: "Деньги", icon: MoneyBag02Icon },
  { to: "/customers", label: "Клиенты", icon: UserGroupIcon },
  { to: "/templates", label: "Карты", icon: Wallet01Icon },
  { to: "/programs", label: "Программы", icon: CreditCardIcon },
  { to: "/bonus-items", label: "Бонусные товары", icon: GiftIcon },
  { to: "/promo-codes", label: "Промокоды", icon: Coupon01Icon },
  { to: "/leads", label: "Заявки", icon: WorkflowSquare02Icon },
  { to: "/support", label: "Поддержка", icon: CustomerSupportIcon },
  { to: "/exit-requests", label: "Выход партнёров", icon: DoorIcon },
  { to: "/business-passwords", label: "Пароли партнёров", icon: SquareLock02Icon },
  { to: "/certificates", label: "Сертификаты", icon: ShieldKeyIcon },
  { to: "/tariffs", label: "Тарифы", icon: Tag01Icon },
  { to: "/settings", label: "Настройки", icon: Settings02Icon },
  { to: "/profile", label: "Профиль", icon: UserCircleIcon },
];

/** Каркас админки: разделы слева, содержимое маршрута внутри. */
export function AppLayout() {
  const { label, logout } = useCurrentUser();
  const location = useLocation();
  const isActive = (to: string) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to));
  // Сколько вопросов ждут ответа — число у пункта меню
  const waiting = useSupportTickets("open").data?.summary.open ?? 0;

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
            {item.to === "/support" && waiting > 0 && (
              <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                {waiting}
                <span className="sr-only"> ждут ответа</span>
              </span>
            )}
          </Link>
        );
      }}
    >
      <Outlet />
    </AppShell>
  );
}
