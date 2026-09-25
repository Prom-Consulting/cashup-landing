import { PhoneSignInForm } from "@loal/app-kit";
import { useNavigate } from "react-router";

/**
 * Держатель карты входит и регистрируется одинаково — по телефону и коду из WhatsApp.
 * Пароля и почты у него нет и не должно быть.
 */
export function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-[420px]">
      <h1 className="display text-[clamp(2rem,8vw,2.5rem)] leading-[1.05]">Вход или регистрация</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Введите телефон — пришлём код в WhatsApp. Карта, баланс и история привяжутся к этому номеру.
      </p>
      <div className="mt-8">
        <PhoneSignInForm onDone={() => navigate("/", { replace: true })} />
      </div>
    </div>
  );
}
