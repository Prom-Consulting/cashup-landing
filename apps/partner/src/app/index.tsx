import { AppProviders } from "@loal/app-kit";
import { BrowserRouter } from "react-router";
import { CurrentMerchantProvider } from "../entities/session/model";
import { API_URL, TOKEN_STORAGE_KEY } from "../shared/config/env";
import { AppRouter } from "./router";
import "./styles.css";

export function App() {
  return (
    <AppProviders baseUrl={API_URL} storageKey={TOKEN_STORAGE_KEY}>
      <CurrentMerchantProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </CurrentMerchantProvider>
    </AppProviders>
  );
}
