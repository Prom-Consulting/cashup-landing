import { useSession } from "@loal/app-kit";
import { useMemo, useState } from "react";

const MERCHANT_KEY = "loal.partner.merchant";

/** Роли, которым открыт кабинет заведения. */
const CABINET_ROLES = ["admin", "staff", "partner", "partner_employee"];

/**
 * Кабинет всегда работает в контексте одного заведения. Человек может работать
 * в нескольких — выбор запоминаем, чтобы при следующем входе открылось то же.
 */
export function useCurrentMerchant() {
  const { session, logout, status } = useSession();

  const memberships = useMemo(
    () => session?.merchants.filter((membership) => CABINET_ROLES.includes(membership.role)) ?? [],
    [session],
  );

  const [chosen, setChosen] = useState<string | null>(() => {
    try {
      return localStorage.getItem(MERCHANT_KEY);
    } catch {
      return null;
    }
  });

  const membership = memberships.find((item) => item.merchantId === chosen) ?? memberships[0] ?? null;

  const selectMerchant = (merchantId: string) => {
    setChosen(merchantId);
    try {
      localStorage.setItem(MERCHANT_KEY, merchantId);
    } catch {
      /* приватный режим — выбор просто не запомнится */
    }
  };

  return {
    session,
    status,
    logout,
    memberships,
    membership,
    merchantId: membership?.merchantId ?? null,
    /** Витрину и оплату меняет владелец или партнёр, сотрудник только смотрит. */
    canManage: membership?.role === "admin" || membership?.role === "partner",
    label: session?.email ?? "",
    selectMerchant,
  };
}
