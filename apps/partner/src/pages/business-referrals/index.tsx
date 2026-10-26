import { useState } from "react";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Button, Card, EmptyState, ErrorState, Icon, Loading, PageHeader } from "@loal/ui/shadcn";
import { useBusinessReferrals, useEnrollBusinessReferrals } from "../../entities/business-referrals/api";
import { useCurrentMerchant } from "../../entities/session/model";

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-muted/50 p-5">
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* буфер недоступен — ссылку видно, скопируют вручную */
    }
  };
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <code className="min-w-0 flex-1 truncate rounded-xl bg-muted px-4 py-3 text-base">{url}</code>
      <Button type="button" variant="outline" onClick={copy} className="shrink-0 gap-2">
        <Icon icon={copied ? Tick02Icon : Copy01Icon} />
        {copied ? "Скопировано" : "Скопировать"}
      </Button>
    </div>
  );
}

const statusLabel = (status: string) =>
  status === "active" ? "Работает" : status === "pending_review" ? "На проверке" : status === "suspended" ? "Приостановлено" : status;

export function BusinessReferralsPage() {
  const { merchantId } = useCurrentMerchant();
  const query = useBusinessReferrals(merchantId ?? "");
  const enroll = useEnrollBusinessReferrals(merchantId ?? "");

  if (!merchantId) return null;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Пригласить заведение"
        description="Приведите другое заведение в Loal — когда оно оплатит тариф, вы получите бесплатные месяцы своего."
      />

      {query.isPending ? (
        <Card className="p-6">
          <Loading rows={3} />
        </Card>
      ) : query.isError ? (
        <Card className="p-6">
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        </Card>
      ) : !query.data ? (
        <Card className="flex flex-col items-start gap-5 p-8">
          <div>
            <h2 className="text-xl font-bold">Получите свою ссылку</h2>
            <p className="mt-2 max-w-[52ch] text-muted-foreground">
              Поделитесь ссылкой с другими заведениями. За каждое приведённое заведение, которое оплатит тариф, вам
              начислится бесплатный месяц вашего тарифа. Лимита нет.
            </p>
          </div>
          <Button type="button" onClick={() => enroll.mutate()} disabled={enroll.isPending}>
            {enroll.isPending ? "Готовим…" : "Получить ссылку"}
          </Button>
          {enroll.isError && <ErrorState error={enroll.error} onRetry={() => enroll.mutate()} />}
        </Card>
      ) : (
        <>
          <Card className="flex flex-col gap-5 p-6 sm:p-8">
            <div>
              <h2 className="text-lg font-bold">Ваша ссылка-приглашение</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {query.data.rewardMonths === 1
                  ? "1 бесплатный месяц тарифа за каждое оплатившее заведение."
                  : `${query.data.rewardMonths} бесплатных месяца тарифа за каждое оплатившее заведение.`}
              </p>
            </div>
            <CopyLink url={query.data.referralUrl} />
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <Stat value={query.data.stats.invited} label="Приглашено заведений" />
            <Stat value={query.data.stats.rewarded} label="Оплатили тариф" />
            <Stat value={query.data.stats.monthsEarned} label="Месяцев начислено" />
          </div>

          <Card className="p-0">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-lg font-bold">Приведённые заведения</h2>
            </div>
            {query.data.referrals.length === 0 ? (
              <EmptyState
                title="Пока никого"
                description="Поделитесь ссылкой — приглашённые заведения появятся здесь."
              />
            ) : (
              <ul className="divide-y divide-border">
                {query.data.referrals.map((item, index) => (
                  <li key={index} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{item.name}</div>
                      <div className="mt-0.5 text-sm text-muted-foreground">
                        {new Date(item.joinedAt).toLocaleDateString("ru-RU")} · {statusLabel(item.status)}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${
                        item.rewarded ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.rewarded ? "Награда начислена" : "Ждём оплаты тарифа"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </section>
  );
}
