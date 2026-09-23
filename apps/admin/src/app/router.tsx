import { RequireAuth, isSuperAdmin } from "@loal/app-kit";
import { Route, Routes } from "react-router";
import { LeadsPage } from "../pages/leads";
import { LoginPage } from "../pages/login";
import { NotFoundPage } from "../pages/not-found";
import { ProfilePage } from "../pages/profile";
import { CustomersPage } from "../pages/customers";
import { MerchantDetailsPage } from "../pages/merchant-details";
import { MerchantsPage } from "../pages/merchants";
import { AppLayout } from "../widgets/app-layout";

/** Все экраны, кроме входа, доступны только администратору платформы. */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth
            allow={(session) => isSuperAdmin(session)}
            deniedMessage="Админка открыта только сотрудникам платформы. Владельцам заведений — кабинет партнёра."
          >
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<MerchantsPage />} />
        <Route path="merchants/:merchantId" element={<MerchantDetailsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
