import { useSession } from "@loal/app-kit";
import { useMemo, useState } from "react";

const STORE_KEY = "loal.partner.store";

/** Роли, которым открыт кабинет магазина. */
const CABINET_ROLES = ["admin", "staff", "partner", "partner_employee"];

/**
 * Кабинет всегда работает в контексте одного магазина. Человек может состоять
 * в нескольких — выбор запоминаем, чтобы при следующем входе открылся тот же.
 */
export function useCurrentStore() {
  const { session, logout, status } = useSession();

  const memberships = useMemo(
    () => session?.stores.filter((membership) => CABINET_ROLES.includes(membership.role)) ?? [],
    [session],
  );

  const [chosen, setChosen] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORE_KEY);
    } catch {
      return null;
    }
  });

  const membership = memberships.find((item) => item.storeId === chosen) ?? memberships[0] ?? null;

  const selectStore = (storeId: string) => {
    setChosen(storeId);
    try {
      localStorage.setItem(STORE_KEY, storeId);
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
    storeId: membership?.storeId ?? null,
    isOwner: membership?.role === "admin" || membership?.role === "partner",
    label: session?.email ?? "",
    selectStore,
  };
}
