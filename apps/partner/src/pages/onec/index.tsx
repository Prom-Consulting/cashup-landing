import { Button } from "@loal/ui/shadcn";
import { Card, ErrorState, Loading } from "@loal/ui/shadcn";
import { PageHeader } from "@loal/ui/page";
import { useState } from "react";
import { useCurrentStore } from "../../entities/session/model";
import { useOnecIntegration, useRegenerateOnecToken } from "../../entities/store/api";
import { formatDateTime } from "../../shared/lib/format";

/** Адрес вебхука копируют в настройки 1С магазина. Перевыпуск ломает старый адрес. */
export function OnecPage() {
  const { storeId, isOwner } = useCurrentStore();
  const onec = useOnecIntegration(storeId ?? "");
  const regenerate = useRegenerateOnecToken(storeId ?? "");
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  if (onec.isPending) return <Loading />;
  if (onec.isError) return <ErrorState error={onec.error} onRetry={() => onec.refetch()} />;

  return (
    <section className="flex max-w-[760px] flex-col gap-6">
      <PageHeader
        title="Обмен с 1С"
        description="Ваша 1С сообщает нам о списаниях по этому адресу. Передайте его своему 1С-специалисту."
      />

      <Card>
        <h2 className="text-xl font-bold">Адрес для 1С</h2>
        <p className="mt-3 rounded-2xl bg-cream px-4 py-3 text-lg break-all">{onec.data.inboundWebhookUrl}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(onec.data.inboundWebhookUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                setCopied(false);
              }
            }}
          >
            Скопировать
          </Button>
          {copied && (
            <span role="status" className="text-base text-muted-foreground">
              Скопировано
            </span>
          )}
          <span className="text-base text-muted-foreground">Создан {formatDateTime(onec.data.createdAt)}</span>
        </div>
      </Card>

      {isOwner && (
        <Card>
          <h2 className="text-xl font-bold">Перевыпустить токен</h2>
          <p className="mt-2 max-w-[70ch] text-base text-muted-foreground">
            Нужен, если адрес попал не в те руки. Старый адрес перестаёт работать сразу — 1С придётся настроить заново.
          </p>
          {regenerate.isError && <ErrorState error={regenerate.error} />}
          {confirming ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                disabled={regenerate.isPending}
                onClick={() => {
                  regenerate.mutate();
                  setConfirming(false);
                }}
              >
                {regenerate.isPending ? "Перевыпускаем…" : "Да, перевыпустить"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
                Отмена
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" className="mt-4" onClick={() => setConfirming(true)}>
              Перевыпустить
            </Button>
          )}
        </Card>
      )}
    </section>
  );
}
