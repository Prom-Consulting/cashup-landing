import { isBranchAdmin, isMerchantOwner, membershipBranchIds } from "@loal/api";
import { useSession } from "@loal/app-kit";
import { createContext, createElement, use, useCallback, useMemo, useState, type ReactNode } from "react";

const MERCHANT_KEY = "loal.partner.merchant";

/**
 * Роли в кабинете магазина: владелец (admin) и администратор филиала (branch_admin). Кассира
 * (staff) пускаем только затем, чтобы отправить в его кабинет — cashier.loal.kg.
 */
const CABINET_ROLES = ["admin", "branch_admin", "staff"];

/**
 * Кабинет всегда работает в контексте одного заведения. Человек может работать
 * в нескольких — выбор запоминаем, чтобы при следующем входе открылось то же.
 */
function useCurrentMerchantValue() {
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

  const selectMerchant = useCallback((merchantId: string) => {
    setChosen(merchantId);
    try {
      localStorage.setItem(MERCHANT_KEY, merchantId);
    } catch {
      /* приватный режим — выбор просто не запомнится */
    }
  }, []);

  return useMemo(
    () => ({
      session,
      status,
      logout,
      memberships,
      membership,
      merchantId: membership?.merchantId ?? null,
      role: membership?.role ?? null,
      /**
       * Управляет магазином только владелец (admin): команда, оплата, 1С, вебхуки, журнал,
       * правка витрины, потолка и кассы. Остальным сервер ответит 403 — не показываем.
       */
      canManage: isMerchantOwner(membership?.role),
      /** Администратор филиала: свои кассиры, журнал и продажи своего филиала, счета клиентам. */
      isBranchAdmin: isBranchAdmin(membership?.role),
      /** Команда и журнал: владелец — весь магазин, администратор филиала — свой филиал. */
      canRunBranch: isMerchantOwner(membership?.role) || isBranchAdmin(membership?.role),
      /** Филиалы администратора филиалов (у владельца пусто — ему открыт весь магазин). */
      branchIds: membership ? membershipBranchIds(membership) : [],
      label: session?.email ?? "",
      selectMerchant,
    }),
    [session, status, logout, memberships, membership, selectMerchant],
  );
}

type CurrentMerchantValue = ReturnType<typeof useCurrentMerchantValue>;

const CurrentMerchantContext = createContext<CurrentMerchantValue | null>(null);

/** Один общий выбор магазина для меню и всех вложенных экранов. */
export function CurrentMerchantProvider({ children }: { children: ReactNode }) {
  const value = useCurrentMerchantValue();
  return createElement(CurrentMerchantContext.Provider, { value }, children);
}

export function useCurrentMerchant() {
  const value = use(CurrentMerchantContext);
  if (!value) throw new Error("useCurrentMerchant должен использоваться внутри CurrentMerchantProvider");
  return value;
}
