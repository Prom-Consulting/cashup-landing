import { isSuperAdmin, useSession } from "@loal/app-kit";

/** Кто вошёл — в терминах экрана: имя для шапки и признак платформенного админа. */
export function useCurrentUser() {
  const { session, logout, status } = useSession();
  return {
    session,
    status,
    logout,
    label: session?.email ?? "",
    isPlatformAdmin: isSuperAdmin(session),
  };
}
