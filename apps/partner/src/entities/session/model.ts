import { partnerMembership, useSession } from "@loal/app-kit";

/**
 * Кабинет партнёра работает от одной записи членства: в ней и memberId для
 * запросов, и роль. Владелец видит всё, сотрудник партнёра — только свои экраны.
 */
export function useCurrentPartner() {
  const { session, logout, status } = useSession();
  const membership = partnerMembership(session);
  return {
    session,
    status,
    logout,
    membership,
    memberId: membership?.memberId ?? null,
    isEmployee: membership?.role === "partner_employee",
    label: session?.email ?? "",
  };
}
