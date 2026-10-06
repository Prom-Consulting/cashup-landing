import { GoogleSignIn, LoginForm } from "@loal/app-kit";
import { Logo } from "@loal/ui/logo";
import { useNavigate } from "react-router";
import { GOOGLE_CLIENT_ID, PARTNER_APP_URL } from "../../shared/config/env";

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] place-items-center bg-cream px-5 py-10">
      <div className="w-full max-w-[420px] rounded-[28px] bg-paper p-7 sm:p-10">
        <Logo direction="corporate" />
        <h1 className="display mt-6 text-[2rem]">Кабинет кассира</h1>
        <p className="mt-2 text-lg text-slate">
          Войдите по номеру, который указал партнёр, — код придёт в WhatsApp.
        </p>
        <div className="mt-8">
          <LoginForm phoneOnly onDone={() => navigate("/", { replace: true })} />
        </div>
        <div className="mt-6">
          <GoogleSignIn clientId={GOOGLE_CLIENT_ID} onDone={() => navigate("/", { replace: true })} />
        </div>
        <p className="mt-6 text-base text-slate">
          Владелец или партнёр заведения?{" "}
          <a href={PARTNER_APP_URL} className="text-flame-ink underline underline-offset-4">
            Кабинет партнёра
          </a>
        </p>
      </div>
    </div>
  );
}
