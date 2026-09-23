import { RequireAuth, isSuperAdmin } from "@loal/app-kit";
import { Route, Routes } from "react-router";
import { LeadsPage } from "../pages/leads";
import { LoginPage } from "../pages/login";
import { NotFoundPage } from "../pages/not-found";
import { ProfilePage } from "../pages/profile";
import { StoreCustomersPage } from "../pages/store-customers";
import { StoreDetailsPage } from "../pages/store-details";
import { StoresPage } from "../pages/stores";
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
        <Route index element={<StoresPage />} />
        <Route path="stores/:storeId" element={<StoreDetailsPage />} />
        <Route path="stores/:storeId/customers" element={<StoreCustomersPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
