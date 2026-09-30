import { RequireAuth } from "@loal/app-kit";
import { Route, Routes } from "react-router";
import { HistoryPage } from "../pages/history";
import { LoginPage } from "../pages/login";
import { NotFoundPage } from "../pages/not-found";
import { OverviewPage } from "../pages/overview";
import { RedeemPage } from "../pages/redeem";
import { CASHIER_ROLE } from "../entities/cashier/api";
import { AppLayout } from "../widgets/app-layout";

/**
 * Кабинет открыт только кассиру филиала (partner_employee). Владельцу и партнёру здесь
 * делать нечего — их кабинет partner.loal.kg.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth
            allow={(session) => session.merchants.some((item) => item.role === CASHIER_ROLE)}
            deniedMessage="Это кабинет кассира филиала. Владельцы и партнёры заведений работают в кабинете партнёра — partner.loal.kg. Если вы кассир, попросите партнёра добавить вас по номеру телефона."
          >
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="redeem" element={<RedeemPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
