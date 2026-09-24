import { LoginForm } from "@loal/app-kit";
import { Logo } from "@loal/ui/logo";
import { useNavigate } from "react-router";

/** Держатель карты входит по телефону: пароля у него нет и не должно быть. */
export function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-[420px]">
      <Logo size="lg" />
      <h1 className="display mt-6 text-[clamp(2rem,8vw,2.5rem)] leading-[1.05]">Вход в карту</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Введите телефон — пришлём код в WhatsApp. Карта, баланс и история привяжутся к вам.
      </p>
      <div className="mt-8">
        <LoginForm defaultMode="phone" onDone={() => navigate("/", { replace: true })} />
      </div>
    </div>
  );
}
