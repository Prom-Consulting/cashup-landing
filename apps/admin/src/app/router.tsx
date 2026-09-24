import { RequireAuth, isSuperAdmin } from "@loal/app-kit";
import { Route, Routes } from "react-router";
import { LeadsPage } from "../pages/leads";
import { LoginPage } from "../pages/login";
import { NotFoundPage } from "../pages/not-found";
import { ProfilePage } from "../pages/profile";
import { BonusItemsPage } from "../pages/bonus-items";
import { CertificatesPage } from "../pages/certificates";
import { CustomersPage } from "../pages/customers";
import { ProgramsPage } from "../pages/programs";
import { SettingsPage } from "../pages/settings";
import { MerchantDetailsPage } from "../pages/merchant-details";
import { MerchantsPage } from "../pages/merchants";
import { TemplateEditorPage } from "../pages/template-editor";
import { TemplatesPage } from "../pages/templates";
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
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="templates/:templateId" element={<TemplateEditorPage />} />
        <Route path="programs" element={<ProgramsPage />} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="bonus-items" element={<BonusItemsPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
