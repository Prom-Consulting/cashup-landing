import { RequireAuth } from "@loal/app-kit";
import { Route, Routes } from "react-router";
import { BillingPage } from "../pages/billing";
import { DashboardPage } from "../pages/dashboard";
import { DeductionsPage } from "../pages/deductions";
import { LoginPage } from "../pages/login";
import { NotFoundPage } from "../pages/not-found";
import { RegisterPage } from "../pages/register";
import { OnecPage } from "../pages/onec";
import { ProfilePage } from "../pages/profile";
import { PosPage } from "../pages/pos";
import { StorefrontPage } from "../pages/storefront";
import { TeamPage } from "../pages/team";
import { WebhooksPage } from "../pages/webhooks";
import { AppLayout } from "../widgets/app-layout";

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
        <Route path="deductions" element={<DeductionsPage />} />
        <Route path="storefront" element={<StorefrontPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="pos" element={<PosPage />} />
        <Route path="webhooks" element={<WebhooksPage />} />
        <Route path="onec" element={<OnecPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
