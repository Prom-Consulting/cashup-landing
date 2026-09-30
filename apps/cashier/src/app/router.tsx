import { RequireAuth } from "@loal/app-kit";
import { Route, Routes } from "react-router";
import { HistoryPage } from "../pages/history";
import { LoginPage } from "../pages/login";
import { NotFoundPage } from "../pages/not-found";
import { OverviewPage } from "../pages/overview";
import { PosPage } from "../pages/pos";
import { StorefrontPage } from "../pages/storefront";
import { RedeemPage } from "../pages/redeem";
import { CashierOnly } from "../widgets/cashier-only";
import { AppLayout } from "../widgets/app-layout";

/**
 * Кабинет кассиров: магазина (staff) и филиала (partner_employee). Владельцу и партнёру здесь
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
        <Route path="storefront" element={<StorefrontPage />} />
        <Route path="pos" element={<PosPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
