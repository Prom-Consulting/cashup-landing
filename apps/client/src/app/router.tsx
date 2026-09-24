import { RequireAuth } from "@loal/app-kit";
import { Route, Routes } from "react-router";
import { CardPage } from "../pages/card";
import { EnrollPage } from "../pages/enroll";
import { HistoryPage } from "../pages/history";
import { LoginPage } from "../pages/login";
import { MyCardPage } from "../pages/my-card";
import { NotFoundPage } from "../pages/not-found";
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
        <Route path="c/:serial" element={<CardPage />} />
        <Route path="enroll" element={<EnrollPage />} />
        <Route path="enroll/:templateId/:programId" element={<EnrollPage />} />
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
      </Route>
    </Routes>
  );
}
