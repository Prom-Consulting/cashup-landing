import { ApiError } from "@loal/api";
import { PhoneSignInForm } from "@loal/app-kit";
import { Button, Loading } from "@loal/ui/shadcn";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useReferralVisit } from "../../entities/referral/api";
import { forgetReferral, rememberReferral } from "../../shared/lib/referral";
import { rememberPhone } from "../../shared/lib/remembered-phone";

/**
 * REF-01: человек открыл ссылку приглашения. Отмечаем переход и сразу даём
 * зарегистрироваться — с тем же deviceId и кодом, чтобы пригласивший получил своё.
 */
export function ReferralPage() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const visit = useReferralVisit(code);
  const [referral, setReferral] = useState<string | undefined>(code);

  const status = visit.error instanceof ApiError ? visit.error.status : null;
  useEffect(() => {
    if (visit.isSuccess) rememberReferral(code);
    if (status === 404 || status === 409) forgetReferral();
  }, [visit.isSuccess, status, code]);

  if (visit.isPending) return <Loading label="Открываем приглашение…" rows={2} />;

  if (status === 404)
    return (
      <div className="flex flex-col gap-4">
        <h1 className="display text-[clamp(2rem,8vw,2.5rem)] leading-[1.05]">Приглашение не найдено</h1>
        <p className="text-lg text-muted-foreground">
          Ссылка устарела или в ней опечатка. Зарегистрироваться в Loal можно и без неё.
        </p>
        <Button asChild size="lg" className="self-start">
          <Link to="/login">Войти или зарегистрироваться</Link>
        </Button>
      </div>
    );

  if (status === 409)
    return (
      <div className="flex flex-col gap-4">
        <h1 className="display text-[clamp(2rem,8vw,2.5rem)] leading-[1.05]">Это ваша ссылка</h1>
        <p className="text-lg text-muted-foreground">
          Приглашать себя нельзя — отправьте её друзьям. За каждого, кто оплатит подписку, вы получите 500 бонусов.
        </p>
        <Button asChild size="lg" className="self-start">
          <Link to="/">К моей карте</Link>
        </Button>
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="brand-gradient inline-flex rounded-full px-4 py-1.5 text-sm font-bold text-white">
          Вас пригласили
        </p>
        <h1 className="display mt-4 text-[clamp(2rem,8vw,2.5rem)] leading-[1.05]">Добро пожаловать в Loal</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Введите телефон — пришлём код в WhatsApp. После регистрации появится карта Loal, а бонусами можно будет
          закрывать часть покупки у партнёров.
        </p>
      </div>
      <PhoneSignInForm
        referralCode={referral}
        onReferralRejected={() => {
          forgetReferral();
          setReferral(undefined);
        }}
        onDone={({ isNewAccount, phone }) => {
          forgetReferral();
          rememberPhone(phone);
          navigate("/", { replace: true, state: { welcome: isNewAccount } });
        }}
      />
    </div>
  );
}
