import { LoginForm } from "@loal/app-kit";
import { Logo } from "@loal/ui/logo";
import { Link, useNavigate } from "react-router";
import { SITE_URL } from "../../shared/config/env";

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="grid min-h-dvh place-items-center bg-cream px-5 py-10">
      <div className="w-full max-w-[420px] rounded-[28px] bg-paper p-7 sm:p-10">
        <Logo />
        <h1 className="display mt-6 text-[2rem]">Кабинет магазина</h1>
        <p className="mt-2 text-lg text-slate">Вход для заведений, принимающих бонусы Loal.</p>
        <div className="mt-8">
          <LoginForm onDone={() => navigate("/", { replace: true })} />
        </div>
        <p className="mt-6 text-base text-slate">
          Есть код приглашения?{" "}
          <Link to="/register" className="text-flame-ink underline underline-offset-4">
            Зарегистрироваться
          </Link>
        </p>
        <p className="mt-2 text-base text-slate">
          Ещё не партнёр?{" "}
          <a href={`${SITE_URL}/become-partner`} className="text-flame-ink underline underline-offset-4">
            Оставить заявку
          </a>
        </p>
      </div>
    </div>
  );
}
