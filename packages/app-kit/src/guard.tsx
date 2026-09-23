import type { Membership, Session } from "@loal/api";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useSession } from "./session";

/** Права платформы: всё, что под /admin/v1/certificates, leads и настройками. */
export function isSuperAdmin(session: Session | null): boolean {
  return session?.role === "super_admin";
}

/** Членство партнёра — по нему кабинет знает свой memberId и merchantId. */
export function partnerMembership(session: Session | null): Membership | null {
  return session?.merchants.find((m) => m.role === "partner" || m.role === "partner_employee") ?? null;
}

/** Членства владельца или сотрудника заведения. */
export function staffMemberships(session: Session | null): Membership[] {
  return session?.merchants.filter((m) => m.role === "admin" || m.role === "staff") ?? [];
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="grid min-h-dvh place-items-center px-5 text-center">{children}</div>;
}

/**
 * Охрана маршрута. Это удобство интерфейса, а не защита данных: доступ решает
 * сервер по токену, здесь мы лишь не показываем экран, который всё равно не откроется.
 */
export function RequireAuth({
  children,
  allow,
  deniedMessage = "У этой учётной записи нет доступа к кабинету.",
  loginPath = "/login",
}: {
  children: ReactNode;
  allow?: (session: Session) => boolean;
  deniedMessage?: string;
  loginPath?: string;
}) {
  const { status, session, logout } = useSession();
  const location = useLocation();

  if (status === "loading") {
    return (
      <Centered>
        <p className="text-lg text-slate">Загружаем кабинет…</p>
      </Centered>
    );
  }

  if (status === "anonymous" || !session) {
    return <Navigate to={loginPath} replace state={{ from: location.pathname + location.search }} />;
  }

  if (allow && !allow(session)) {
    return (
      <Centered>
        <div className="max-w-[420px]">
          <h1 className="display text-[2rem]">Доступ закрыт</h1>
          <p className="mt-4 text-lg text-slate">{deniedMessage}</p>
          <button type="button" onClick={logout} className="mt-6 text-lg text-flame-ink underline underline-offset-4">
            Войти под другой учётной записью
          </button>
        </div>
      </Centered>
    );
  }

  return children;
}
