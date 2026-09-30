import { RequireAuth } from "@loal/app-kit";
import { Route, Routes } from "react-router";
import { HistoryPage } from "../pages/history";
import { LoginPage } from "../pages/login";
import { NotFoundPage } from "../pages/not-found";
import { OverviewPage } from "../pages/overview";
import { RedeemPage } from "../pages/redeem";
import { CashierOnly } from "../widgets/cashier-only";
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
          <RequireAuth>
            <CashierOnly>
              <AppLayout />
            </CashierOnly>
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
