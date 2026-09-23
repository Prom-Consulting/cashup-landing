import { Route, Routes } from "react-router";
import { CardPage } from "../pages/card";
import { HomePage } from "../pages/home";
import { NotFoundPage } from "../pages/not-found";
import { PageFrame } from "../widgets/page-frame";

/** Входа нет: все страницы публичные, доступ даёт сама ссылка с номером карты. */
export function AppRouter() {
  return (
    <Routes>
      <Route element={<PageFrame />}>
        <Route index element={<HomePage />} />
        <Route path="c/:serial" element={<CardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
