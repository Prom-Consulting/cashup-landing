import { Navigate } from "react-router";

/** Старый адрес кэшбэка: касса теперь одна — /redeem, кэшбэк — её режим. */
export function CashbackPage() {
  return <Navigate to="/redeem?mode=cashback" replace />;
}
