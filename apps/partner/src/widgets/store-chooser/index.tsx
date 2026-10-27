import { Add01Icon, Store01Icon } from "@hugeicons/core-free-icons";
import { Logo } from "@loal/ui/logo";
import { Icon } from "@loal/ui/shadcn";
import { useCurrentMerchant } from "../../entities/session/model";
import { SITE_URL } from "../../shared/config/env";

const roleLabel = (role: string) =>
  role === "admin" ? "Владелец" : role === "branch_admin" ? "Администратор филиала" : "Кассир";

/**
 * Выбор заведения на входе: у одного человека может быть несколько магазинов.
 * Показываем, когда магазинов больше одного и выбор на устройстве ещё не сделан.
 * Выбор запоминается — при следующем входе откроется то же.
 */
export function StoreChooser() {
  const { memberships, selectMerchant, label, logout } = useCurrentMerchant();

  return (
    <div className="grid min-h-dvh place-items-center bg-cream px-5 py-10">
      <div className="w-full max-w-[460px]">
        <Logo />
        <h1 className="display mt-6 text-[2rem] leading-tight">Выберите заведение</h1>
        <p className="mt-2 text-lg text-slate">
          На этом аккаунте несколько заведений. Выберите, с каким работать — выбор запомним.
        </p>

        <ul className="mt-8 flex flex-col gap-3">
          {memberships.map((m) => (
            <li key={m.merchantId}>
              <button
                type="button"
                onClick={() => selectMerchant(m.merchantId)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-smoke bg-paper p-5 text-left transition-colors hover:border-flame/40"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-flame/10 text-flame-ink">
                  <Icon icon={Store01Icon} size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-bold group-hover:text-flame-ink">
                    {m.merchantName ?? "Заведение"}
                  </span>
                  <span className="block text-sm text-slate">{roleLabel(m.role)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <a
          href={`${SITE_URL.replace(/\/$/, "")}/become-partner`}
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-smoke p-4 text-base font-semibold text-flame-ink transition-colors hover:border-flame/40"
        >
          <Icon icon={Add01Icon} size={20} />
          Открыть новое заведение
        </a>

        <button type="button" onClick={logout} className="mt-6 block w-full text-center text-base text-slate underline-offset-4 hover:underline">
          Выйти
        </button>
      </div>
    </div>
  );
}
