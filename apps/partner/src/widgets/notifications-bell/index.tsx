import { Notification03Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@loal/ui/shadcn";
import { Link } from "react-router";
import { useNotifications } from "../../entities/notifications/api";
import { useCurrentMerchant } from "../../entities/session/model";

/** Колокольчик уведомлений в шапке кабинета: ссылка на центр с бейджем непрочитанных. */
export function NotificationsBell() {
  const { merchantId, canRunBranch } = useCurrentMerchant();
  const inbox = useNotifications(canRunBranch ? (merchantId ?? "") : "");
  if (!merchantId || !canRunBranch) return null;
  const unread = inbox.data?.unread ?? 0;
  return (
    <Link
      to="/notifications"
      aria-label={unread > 0 ? `Уведомления, непрочитанных: ${unread}` : "Уведомления"}
      className="relative grid h-11 w-11 place-items-center rounded-full text-current hover:bg-white/10"
    >
      <Icon icon={Notification03Icon} size={22} />
      {unread > 0 && (
        <span className="absolute right-1.5 top-1.5 grid min-h-[1.1rem] min-w-[1.1rem] place-items-center rounded-full bg-flame px-1 text-[0.625rem] font-bold leading-none text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
