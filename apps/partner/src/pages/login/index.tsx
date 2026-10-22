import { BusinessLoginForm, GoogleSignIn } from "@loal/app-kit";
import { Logo } from "@loal/ui/logo";
import { Link, useNavigate } from "react-router";
import { GOOGLE_CLIENT_ID, SITE_URL } from "../../shared/config/env";

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] place-items-center bg-cream px-5 py-10">
      <div className="w-full max-w-[420px] rounded-[28px] bg-paper p-7 sm:p-10">
        <Logo />
        <h1 className="display mt-6 text-[2rem]">Кабинет магазина</h1>
        <p className="mt-2 text-lg text-slate">Вход для заведений, принимающих бонусы Loal.</p>
        {/* С октября 2026 вход владельцев и администраторов — по паролю; объясняем, откуда его взять */}
        <div className="mt-6 rounded-2xl bg-cream px-4 py-3 text-base leading-snug">
          <p className="font-semibold">Вход — по номеру или почте и паролю</p>
          <p className="mt-1 text-slate">
            Временный пароль мы прислали в WhatsApp. Нет пароля или забыли — войдите по коду и задайте свой.
          </p>
        </div>
        <div className="mt-8">
          <BusinessLoginForm onDone={() => navigate("/", { replace: true })} />
        </div>
        <div className="mt-6">
          <GoogleSignIn clientId={GOOGLE_CLIENT_ID} onDone={() => navigate("/", { replace: true })} />
        </div>
        <p className="mt-6 text-base text-slate">
          Дали код приглашения?{" "}
          <Link to="/register" className="text-flame-ink underline underline-offset-4">
            Зарегистрироваться
          </Link>
        </p>
        <p className="mt-2 text-base text-slate">
          Ещё не партнёр?{" "}
          <a href={`${SITE_URL}/become-partner`} className="text-flame-ink underline underline-offset-4">
            Стать партнером
          </a>
        </p>
      </div>
    </div>
  );
}
