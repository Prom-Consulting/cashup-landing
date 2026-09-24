import { EARN_INPUT_MODES, REDEEM_INPUT_MODES } from "@loal/api";
import { Button, Card, EmptyState, ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { usePosSettings, useResetPosSettings, useUpdatePosSettings } from "../../entities/merchant/api";
import { useCurrentMerchant } from "../../entities/session/model";

const label = (list: { id: string; label: string }[], value: string | null | undefined) =>
  list.find((item) => item.id === value)?.label ?? "по умолчанию";

/** Что кассир вводит при начислении и списании. Одна строка на программу. */
export function PosPage() {
  const { merchantId, canManage } = useCurrentMerchant();
  const settings = usePosSettings(merchantId ?? "");
  const update = useUpdatePosSettings(merchantId ?? "");
  const reset = useResetPosSettings(merchantId ?? "");

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Касса"
        description="Как выглядит экран кассира: что он вводит при начислении и списании и можно ли платить частью баллами."
      />

      {settings.isPending && <Loading rows={2} />}
      {settings.isError && <ErrorState error={settings.error} onRetry={() => settings.refetch()} />}
      {settings.isSuccess && settings.data.length === 0 && (
        <EmptyState
          title="Настроек пока нет"
          description="Касса работает по умолчанию. Настройки появятся, когда платформа подключит программу."
        />
      )}

      <div className="flex flex-col gap-4">
        {(settings.data ?? []).map((row) => (
          <Card key={row.programId}>
            <h2 className="text-xl font-bold">Программа {row.programId}</h2>

            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-base text-muted-foreground">При начислении кассир вводит</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {EARN_INPUT_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      disabled={!canManage || update.isPending}
                      aria-pressed={row.earnInputMode === mode.id}
                      onClick={() => update.mutate({ programId: row.programId, body: { earnInputMode: mode.id } })}
                      className={`h-11 rounded-2xl border-2 px-4 text-base transition-colors disabled:opacity-60 ${
                        row.earnInputMode === mode.id
                          ? "border-secondary bg-secondary text-secondary-foreground"
                          : "border-border bg-surface hover:border-foreground"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </dd>
              </div>

              <div>
                <dt className="text-base text-muted-foreground">При списании кассир вводит</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {REDEEM_INPUT_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      disabled={!canManage || update.isPending}
                      aria-pressed={row.redeemInputMode === mode.id}
                      onClick={() => update.mutate({ programId: row.programId, body: { redeemInputMode: mode.id } })}
                      className={`h-11 rounded-2xl border-2 px-4 text-base transition-colors disabled:opacity-60 ${
                        row.redeemInputMode === mode.id
                          ? "border-secondary bg-secondary text-secondary-foreground"
                          : "border-border bg-surface hover:border-foreground"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </dd>
              </div>

              <div>
                <dt className="text-base text-muted-foreground">Потолок списания</dt>
                <dd className="text-lg">
                  {row.maxRedeemPercent ? `не больше ${row.maxRedeemPercent}% от чека` : "без потолка"}
                </dd>
              </div>

              <div>
                <dt className="text-base text-muted-foreground">Оплата с баллами</dt>
                <dd className="mt-2">
                  <button
                    type="button"
                    disabled={!canManage || update.isPending}
                    onClick={() =>
                      update.mutate({
                        programId: row.programId,
                        body: { mixedPaymentEnabled: !row.mixedPaymentEnabled },
                      })
                    }
                    className={`h-11 rounded-2xl border-2 px-4 text-base transition-colors disabled:opacity-60 ${
                      row.mixedPaymentEnabled
                        ? "border-secondary bg-secondary text-secondary-foreground"
                        : "border-border bg-surface hover:border-foreground"
                    }`}
                  >
                    {row.mixedPaymentEnabled ? "разрешена" : "выключена"}
                  </button>
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-base text-muted-foreground">
              Сейчас: начисление — {label(EARN_INPUT_MODES, row.earnInputMode)}, списание —{" "}
              {label(REDEEM_INPUT_MODES, row.redeemInputMode)}.
            </p>

            {canManage && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                disabled={reset.isPending}
                onClick={() => reset.mutate(row.programId)}
              >
                Вернуть значения по умолчанию
              </Button>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
