import { MERCHANT_ROLE_LABELS } from "@loal/api";
import { useSession } from "@loal/app-kit";
import { Logo } from "@loal/ui/logo";
import type { ReactNode } from "react";
import { CASHIER_ROLES } from "../../entities/cashier/api";
import { PARTNER_APP_URL } from "../../shared/config/env";

/**
 * Кабинет для кассиров: магазина (staff) и филиала (partner_employee). Владелец или партнёр,
 * вошедший сюда своим номером, видит, кем он вошёл, и уходит в свой кабинет — вместо
 * безликого «Доступ закрыт».
 */
export function CashierOnly({ children }: { children: ReactNode }) {
  const { session, logout } = useSession();
  const memberships = session?.merchants ?? [];
  if (memberships.some((item) => CASHIER_ROLES.includes(item.role))) return <>{children}</>;

  const role = memberships[0]?.role;
  const who = role ? MERCHANT_ROLE_LABELS[role]?.title : null;
  const partnerHost = PARTNER_APP_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] place-items-center bg-cream px-5 py-10">
      <div className="w-full max-w-[460px] rounded-[28px] bg-paper p-7 sm:p-10">
        <Logo direction="corporate" />
        {who ? (
          <>
            <h1 className="display mt-6 text-[1.9rem] leading-tight">Вы вошли как {who.toLowerCase()}</h1>
            <p className="mt-3 text-lg leading-snug text-slate">
              Это кабинет кассиров. Ваш кабинет — {partnerHost}: там управление заведением и списание
              бонусов. Войдите тем же номером.
            </p>
          </>
        ) : (
          <>
            <h1 className="display mt-6 text-[1.9rem] leading-tight">Этот номер не кассир</h1>
            <p className="mt-3 text-lg leading-snug text-slate">
              Кассира добавляет владелец заведения в «Команде» или партнёр в «Я партнёр → Кассиры» — по номеру
              телефона. После этого войдите сюда тем же номером.
            </p>
          </>
        )}
        <div className="mt-7 flex flex-wrap items-center gap-4">
          {who && (
            <a
              href={PARTNER_APP_URL}
              className="inline-flex items-center rounded-full bg-primary px-7 py-4 text-lg font-bold text-white hover:bg-graphite"
            >
              Открыть {partnerHost}
            </a>
          )}
          <button type="button" onClick={logout} className="text-base text-flame-ink underline underline-offset-4">
            Войти другим номером
          </button>
        </div>
      </div>
    </div>
  );
}
