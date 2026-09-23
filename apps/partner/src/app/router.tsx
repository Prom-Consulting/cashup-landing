import { RequireAuth, partnerMembership } from "@loal/app-kit";
import { Route, Routes } from "react-router";
import { EmployeesPage } from "../pages/employees";
import { LoginPage } from "../pages/login";
import { NotFoundPage } from "../pages/not-found";
import { OverviewPage } from "../pages/overview";
import { PaymentsPage } from "../pages/payments";
import { ProfilePage } from "../pages/profile";
import { AppLayout } from "../widgets/app-layout";

/** Кабинет открыт тем, у кого есть членство партнёра хотя бы в одном заведении. */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth
            allow={(session) => partnerMembership(session) !== null}
            deniedMessage="Эта учётная запись не привязана к партнёру. Попросите владельца заведения выдать доступ."
          >
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
