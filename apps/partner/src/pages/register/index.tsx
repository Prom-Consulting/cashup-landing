import { RegisterForm } from "@loal/app-kit";
import { Logo } from "@loal/ui/logo";
import { Link, useNavigate } from "react-router";

/**
 * Регистрация по коду приглашения — прежний путь для старых заведений. Новых владельцев Loal
 * заводит по телефону, и они просто входят по коду из WhatsApp.
 */
export function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] place-items-center bg-cream px-5 py-10">
      <div className="w-full max-w-[460px] rounded-[28px] bg-paper p-7 sm:p-10">
        <Logo />
        <h1 className="display mt-6 text-[2rem]">Регистрация</h1>
        <p className="mt-2 text-lg text-slate">
          По коду приглашения вы становитесь владельцем заведения и сразу попадаете в кабинет.
        </p>
        <p className="mt-3 rounded-2xl bg-cream px-4 py-3 text-base">
          Кода нет, а Loal подключил ваше заведение по номеру телефона?{" "}
          <Link to="/login" className="text-flame-ink underline underline-offset-4">
            Войдите по номеру
          </Link>{" "}
          — регистрироваться не нужно.
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
