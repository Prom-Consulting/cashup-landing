import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { applyStoredBackground } from "./shared/lib/background";

applyStoredBackground();

// Чистый CSR: сервер отдаёт пустой index.html, всё рисуется в браузере.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
