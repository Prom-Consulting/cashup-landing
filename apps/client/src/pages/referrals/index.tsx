import { Copy01Icon, Share08Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { ApiError, type ReferralDashboard } from "@loal/api";
import { Button, Card, ErrorState, FormStatus, Icon, Loading } from "@loal/ui/shadcn";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useEnrollReferrals, useReferralDashboard } from "../../entities/referral/api";
import { formatDate } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");

const terms = [
  { value: "2 000", text: "бонусов на карту сразу, как подключитесь" },
  { value: "+500", text: "за каждого друга, который оплатит подписку" },
  { value: "∞", text: "друзей — без лимита, а ваша карта не замораживается" },
];

/** Ещё не реферер: условия и одна кнопка. Повторное подключение безопасно — сервер не начислит дважды. */
function Join() {
  const enroll = useEnrollReferrals();
  return (
    <section className="flex flex-col gap-6 lg:max-w-[760px]">
      <div className="brand-gradient flex flex-col gap-5 rounded-[28px] p-7 text-white sm:p-9">
        <h1 className="display text-[clamp(2rem,6vw,3rem)] leading-[1.05]">Приглашайте друзей в Loal</h1>
        <p className="max-w-[46ch] text-lg leading-snug text-white/90">
          Делитесь своей ссылкой. Друг регистрируется по ней — и когда оплатит подписку, вы получите бонусы.
        </p>
        <ul className="grid gap-3 sm:grid-cols-3">
          {terms.map((term) => (
            <li key={term.value} className="rounded-[20px] bg-white/15 p-4 backdrop-blur-sm">
              <span className="display block text-[2rem] leading-none tabular-nums">{term.value}</span>
              <span className="mt-2 block text-base leading-snug text-white/90">{term.text}</span>
            </li>
          ))}
        </ul>
        <Button
          size="lg"
          disabled={enroll.isPending}
          onClick={() => enroll.mutate()}
          className="self-start bg-graphite text-white hover:bg-white hover:text-graphite"
        >
          {enroll.isPending ? "Подключаем…" : "Стать реферером"}
        </Button>
      </div>
      <FormStatus
        message={
          !enroll.isError
            ? undefined
            : enroll.error instanceof ApiError && enroll.error.status === 404
              ? "Программа вот-вот заработает — загляните сюда чуть позже."
              : enroll.error.message || "Не получилось подключить. Попробуйте ещё раз."
        }
      />
    </section>
  );
}

function useQr(value: string) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    QRCode.toDataURL(value, {
      margin: 0,
      width: 480,
      errorCorrectionLevel: "M",
      color: { dark: "#161515", light: "#ffffff" },
    })
      .then(setSrc)
      .catch(() => setSrc(null));
  }, [value]);
  return src;
}

/** Ссылка — главное: скопировать, поделиться системным меню или показать QR вживую. */
function LinkCard({ url, code }: { url: string; code: string }) {
  const qr = useQr(url);
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-base text-muted-foreground">Ваша ссылка</p>
        <p className="mt-1 truncate font-mono text-lg font-bold">{url.replace(/^https?:\/\//, "")}</p>
        <p className="mt-1 text-sm text-muted-foreground">Код приглашения: {code}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={copy}>
            <Icon icon={copied ? Tick02Icon : Copy01Icon} />
            {copied ? "Скопировано" : "Скопировать"}
          </Button>
          {canShare && (
            <Button
              variant="outline"
              onClick={() =>
                navigator
                  .share({ title: "Loal", text: "Бонусы у партнёров Loal — регистрируйся по моей ссылке", url })
                  .catch(() => undefined)
              }
            >
              <Icon icon={Share08Icon} />
              Поделиться
            </Button>
          )}
        </div>
      </div>
      {qr && (
        <div className="shrink-0 self-center rounded-[20px] bg-white p-3 shadow-[0_8px_24px_rgb(22_21_21/0.08)]">
          <img src={qr} alt="QR-код ссылки приглашения" className="h-36 w-36 [image-rendering:pixelated]" />
          <p className="mt-2 text-center text-xs text-graphite/70">Покажите другу</p>
        </div>
      )}
    </Card>
  );
}

function Dashboard({ data }: { data: ReferralDashboard }) {
  const stats = [
    { label: "Переходы", value: data.stats.visits },
    { label: "Регистрации", value: data.stats.registrations },
    { label: "Оплатили", value: data.stats.paid },
    { label: "Заработано бонусов", value: data.stats.pointsEarned, accent: true },
  ];

  return (
    <section className="flex flex-col gap-6 lg:max-w-[960px]">
      <div>
        <h1 className="display text-[2rem] leading-tight lg:text-[2.5rem]">Друзья</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          За первую оплату подписки каждого друга — 500 бонусов на вашу карту.
        </p>
      </div>

      <LinkCard url={data.referralUrl} code={data.code} />

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <li
            key={stat.label}
            className={`rounded-[22px] p-5 ${stat.accent ? "brand-gradient text-white" : "bg-surface"}`}
          >
            <span className="display block text-[2rem] leading-none tabular-nums">{money.format(stat.value)}</span>
            <span className={`mt-2 block text-base ${stat.accent ? "text-white/90" : "text-muted-foreground"}`}>
              {stat.label}
            </span>
          </li>
        ))}
      </ul>

      <Card>
        <h2 className="text-xl font-bold">Приглашённые</h2>
        {data.referrals.length === 0 ? (
          <p className="mt-3 text-base text-muted-foreground">
            Пока никто не зарегистрировался по ссылке. Отправьте её друзьям — здесь появится каждый.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {data.referrals.map((friend, index) => (
              <li key={friend.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>
                  <span className="block text-base font-bold">Друг {data.referrals.length - index}</span>
                  <span className="text-sm text-muted-foreground">
                    {friend.registeredAt ? `зарегистрировался ${formatDate(friend.registeredAt)}` : "зарегистрировался"}
                  </span>
                </span>
                {friend.paid ? (
                  <span className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-white tabular-nums">
                    +{money.format(friend.points ?? 500)}
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">ждём оплату</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}

/** REF-01: приглашать друзей может любой клиент — отдельной роли нет. */
export function ReferralsPage() {
  const dashboard = useReferralDashboard();
  if (dashboard.isPending) return <Loading rows={3} />;
  if (dashboard.isError) {
    if (dashboard.error instanceof ApiError && dashboard.error.status === 404) return <Join />;
    return <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />;
  }
  return <Dashboard data={dashboard.data} />;
}
