import { promoFromSearch } from "@loal/api";
import { ClientAuthForm, LegalLinks, useSession } from "@loal/app-kit";
import { useLocation, useNavigate } from "react-router";
import { SITE_URL } from "../../shared/config/env";
import { pendingPromo } from "../../shared/lib/promo-link";
import { rememberPhone } from "../../shared/lib/remembered-phone";
import { forgetReferral, recallReferral } from "../../shared/lib/referral";
import { useEffect, useState } from "react";

/**
 * Держатель карты входит и регистрируется одинаково — по телефону и коду из WhatsApp.
 * Пароля и почты у него нет и не должно быть.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { status } = useSession();
  const promo = promoFromSearch(search) ?? pendingPromo.recall();
  useEffect(() => {
    const incoming = promoFromSearch(search);
    if (incoming) pendingPromo.remember(incoming);
    if (status === "authenticated" && (incoming || pendingPromo.recall())) navigate("/", { replace: true });
  }, [search, status, navigate]);
  const [referral] = useState(recallReferral);

  return (
    <div className="mx-auto max-w-[420px]">
      <h1 className="display text-[clamp(2rem,8vw,2.5rem)] leading-[1.05]">Вход или регистрация</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Вход — по телефону и паролю. Нет аккаунта? Зарегистрируйтесь: телефон, пароль и код из сообщения.
      </p>
      {promo && <p role="status" className="mt-4 rounded-2xl bg-flame/10 px-4 py-3 text-base">
        Промокод <strong>{promo}</strong> применится автоматически после входа или регистрации.
      </p>}
      <div className="mt-8">
        <ClientAuthForm
          siteUrl={SITE_URL}
          // Открывали ссылку приглашения, а регистрируются отсюда — код всё равно учитываем
          referralCode={referral}
          onDone={({ isNewAccount, phone }) => {
            forgetReferral();
            rememberPhone(phone);
            navigate("/", { replace: true, state: { welcome: isNewAccount } });
          }}
        />
      </div>
      <LegalLinks siteUrl={SITE_URL} className="mt-8" />
    </div>
  );
}
