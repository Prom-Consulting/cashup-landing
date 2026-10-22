import { PasswordSetupForm, useProfile } from "@loal/app-kit";
import { formatPhone } from "@loal/ui/inputs";
import { Logo } from "@loal/ui/logo";
import type { ReactNode } from "react";
import { useCurrentMerchant } from "../../entities/session/model";

/**
 * Кабинет партнёра входит по номеру и паролю. Кто вошёл без своего пароля — по коду, Google или
 * временным паролем из WhatsApp, — сначала задаёт его: дальше кабинета не пускаем. Кассир сюда не
 * доходит (его кабинет — cashier.loal.kg), старый шлюз без поля password ничего не требует.
 */
export function PasswordGate({ children }: { children: ReactNode }) {
  const profile = useProfile();
  const { memberships, logout } = useCurrentMerchant();
  const password = profile.data?.password;
  const cashierOnly = memberships.length > 0 && memberships.every((m) => m.role === "staff");
  if (!password || cashierOnly || (password.set && !password.mustChange)) return <>{children}</>;

  const phone = profile.data?.phone ? formatPhone(profile.data.phone) : "ваш номер";
  return (
    <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] place-items-center bg-cream px-5 py-10">
      <div className="w-full max-w-[460px] rounded-[28px] bg-paper p-7 sm:p-10">
        <Logo direction="corporate" />
        <h1 className="display mt-6 text-[1.9rem] leading-tight">
          {password.mustChange ? "Придумайте свой пароль" : "Теперь вход — по паролю"}
        </h1>
        <p className="mt-3 text-lg leading-snug text-slate">
          {password.mustChange
            ? "Вы вошли временным паролем из WhatsApp. Замените его своим — временный после этого перестанет работать."
            : "Вход в кабинет партнёра теперь по номеру телефона и паролю. Задайте пароль один раз — и дальше входите им."}
        </p>
        <p className="mt-3 text-base text-slate">
          Логин — {phone}. Кассиров это не касается: они входят в кассу по коду.
        </p>
        <div className="mt-7">
          <PasswordSetupForm submitLabel="Сохранить и продолжить" />
        </div>
        <button type="button" onClick={logout} className="mt-6 text-base text-slate underline underline-offset-4">
          Выйти
        </button>
      </div>
    </div>
  );
}
