import { RegisterForm } from "@loal/app-kit";
import { Logo } from "@loal/ui/logo";
import { Link, useNavigate } from "react-router";

/** Регистрация владельца заведения по коду приглашения от Loal. */
export function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="grid min-h-dvh place-items-center bg-cream px-5 py-10">
      <div className="w-full max-w-[460px] rounded-[28px] bg-paper p-7 sm:p-10">
        <Logo />
        <h1 className="display mt-6 text-[2rem]">Регистрация</h1>
        <p className="mt-2 text-lg text-slate">
          По коду приглашения вы становитесь владельцем заведения и сразу попадаете в кабинет.
        </p>
        <div className="mt-8">
          <RegisterForm onDone={() => navigate("/", { replace: true })} />
        </div>
        <p className="mt-6 text-base text-slate">
          Уже есть доступ?{" "}
          <Link to="/login" className="text-flame-ink underline underline-offset-4">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
