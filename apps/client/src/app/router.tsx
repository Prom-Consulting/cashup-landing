import { RequireAuth } from "@loal/app-kit";
import { Route, Routes } from "react-router";
import { CardPage } from "../pages/card";
import { EnrollPage, LegacyEnrollRedirect } from "../pages/enroll";
import { HistoryPage } from "../pages/history";
import { LoginPage } from "../pages/login";
import { MyCardPage } from "../pages/my-card";
import { NotFoundPage } from "../pages/not-found";
import { PaymentReturnPage } from "../pages/payment-return";
import { ReferralPage } from "../pages/referral";
import { ReferralsPage } from "../pages/referrals";
import { SettingsPage } from "../pages/settings";
import { AppLayout } from "../widgets/app-layout";
import { PageFrame } from "../widgets/page-frame";

/**
 * Две части: кабинет за входом по телефону и публичная страница карты по ссылке —
 * её открывают те, кому карту выдали в заведении.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route element={<PageFrame />}>
        <Route path="/login" element={<LoginPage />} />
        {/* Регистрация и вход у клиента — одна форма по телефону */}
        <Route path="/register" element={<LoginPage />} />
        <Route path="c/:serial" element={<CardPage />} />
        {/* REF-01: ссылка приглашения — отметить переход и зарегистрировать с кодом */}
        <Route path="ref/:code" element={<ReferralPage />} />
        <Route path="enroll" element={<EnrollPage />} />
        {/* Самозапись с явной программой бэкенд убрал: старые QR ведут на карту платформы */}
        <Route path="enroll/:templateId/:programId" element={<LegacyEnrollRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route
        element={
          <RequireAuth deniedMessage="Войдите по номеру телефона, чтобы увидеть свою карту.">
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<MyCardPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="referrals" element={<ReferralsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        {/* Сюда OctōPAY возвращает после оплаты подписки (OCTOPAY_CLIENT_RETURN_URL) */}
        <Route path="payment/return" element={<PaymentReturnPage />} />
      </Route>
    </Routes>
  );
}
