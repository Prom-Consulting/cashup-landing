import { Icon, PageHeader } from "@loal/ui/shadcn";
import { Link } from "react-router";
import { useTariff } from "../../entities/merchant/api";
import { useCurrentMerchant } from "../../entities/session/model";
import { useSupportTickets } from "../../entities/support/api";
import { SETTINGS_GROUPS, visibleSections } from "../../shared/config/settings-sections";

/** «Настройки»: всё, что не нужно каждый день, — разделы заведения, журналы, интеграции и помощь. */
export function SettingsPage() {
  const { merchantId, canManage, canRunBranch } = useCurrentMerchant();
  const { tariff, abilities } = useTariff(merchantId ?? "");
  const sections = visibleSections({ canManage, canRunBranch, tariff, abilities });
  const support = useSupportTickets(canRunBranch ? (merchantId ?? "") : "");
  const unread = support.data?.filter((ticket) => ticket.unread).length ?? 0;

  return (
    <section className="flex flex-col gap-8">
      <PageHeader title="Настройки" description="Витрина, журналы, команда, интеграции и помощь." />
      {SETTINGS_GROUPS.map((group) => {
        const items = sections.filter((item) => item.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group} className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-muted-foreground">{group}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="flex h-full items-start gap-4 rounded-[24px] bg-surface p-5 shadow-[0_0.75rem_2rem_rgb(22_21_21/0.06)] transition-colors hover:bg-muted"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted">
                      <Icon icon={item.icon} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-lg font-bold">
                        {item.label}
                        {item.to === "/support" && unread > 0 && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                            {unread}
                            <span className="sr-only"> непрочитано</span>
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-base leading-snug text-muted-foreground">{item.about}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
