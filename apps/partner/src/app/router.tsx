import { RequireAuth } from "@loal/app-kit";
import { Route, Routes } from "react-router";
import { BillingPage } from "../pages/billing";
import { CheckoutPointsPage } from "../pages/checkout-points";
import { ClientPaymentsPage } from "../pages/client-payments";
import { DashboardPage } from "../pages/dashboard";
import { DeductionsPage } from "../pages/deductions";
import { LoginPage } from "../pages/login";
import { NotFoundPage } from "../pages/not-found";
import { RegisterPage } from "../pages/register";
import { OnecPage } from "../pages/onec";
import { ProfilePage } from "../pages/profile";
import { PosPage } from "../pages/pos";
import { RedeemPage } from "../pages/redeem";
import { StorefrontPage } from "../pages/storefront";
import { TeamPage } from "../pages/team";
import { WebhooksPage } from "../pages/webhooks";
import { AppLayout } from "../widgets/app-layout";
import { OwnerOnly } from "../widgets/owner-only";

/** Кабинет открыт тем, кто состоит хотя бы в одном магазине. */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <RequireAuth
            allow={(session) => session.merchants.length > 0}
            deniedMessage="Эта учётная запись не привязана к заведению. Попросите нас выдать доступ или войдите под другой."
          >
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="redeem" element={<RedeemPage />} />
        <Route path="client-payments" element={<ClientPaymentsPage />} />
        <Route
          path="checkout-points"
          element={
            <OwnerOnly title="NFC-кассы">
              <CheckoutPointsPage />
            </OwnerOnly>
          }
        />
        <Route
          path="deductions"
          element={
            <OwnerOnly title="Списания" allowBranch>
              <DeductionsPage />
            </OwnerOnly>
          }
        />
        <Route path="storefront" element={<StorefrontPage />} />
        <Route
          path="billing"
          element={
            <OwnerOnly title="Оплата">
              <BillingPage />
            </OwnerOnly>
          }
        />
        <Route
          path="team"
          element={
            <OwnerOnly title="Команда" allowBranch>
              <TeamPage />
            </OwnerOnly>
          }
        />
        <Route path="pos" element={<PosPage />} />
        <Route
          path="webhooks"
          element={
            <OwnerOnly title="Вебхуки">
              <WebhooksPage />
            </OwnerOnly>
          }
        />
        <Route
          path="onec"
          element={
            <OwnerOnly title="Обмен с 1С">
              <OnecPage />
            </OwnerOnly>
          }
        />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
