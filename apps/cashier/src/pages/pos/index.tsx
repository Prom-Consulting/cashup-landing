import { EARN_INPUT_MODES, REDEEM_INPUT_MODES } from "@loal/api";
import { Card, EmptyState, ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { useCashierPos, useCashierSession } from "../../entities/cashier/api";

const label = (list: { id: string; label: string }[], value: string | null | undefined) =>
  list.find((item) => item.id === value)?.label ?? "по умолчанию";

/** Как настроена касса магазина. Кассиру только посмотреть — меняет владелец. */
export function PosPage() {
  const { merchantId } = useCashierSession();
  const settings = useCashierPos(merchantId);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Касса"
        description="Что вы вводите при начислении и списании и можно ли платить частью баллами. Настройки меняет владелец."
      />
      {settings.isPending && <Loading rows={2} />}
      {settings.isError && <ErrorState error={settings.error} onRetry={() => settings.refetch()} />}
      {settings.isSuccess && settings.data.length === 0 && (
        <EmptyState title="Настроек пока нет" description="Касса работает по умолчанию." />
      )}
      <div className="flex flex-col gap-4">
        {(settings.data ?? []).map((row) => (
          <Card key={row.programId}>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-base text-muted-foreground">При начислении вводите</dt>
                <dd className="mt-1 text-lg">{label(EARN_INPUT_MODES, row.earnInputMode)}</dd>
              </div>
              <div>
                <dt className="text-base text-muted-foreground">При списании вводите</dt>
                <dd className="mt-1 text-lg">{label(REDEEM_INPUT_MODES, row.redeemInputMode)}</dd>
              </div>
              <div>
                <dt className="text-base text-muted-foreground">Потолок списания</dt>
                <dd className="mt-1 text-lg">
                  {row.maxRedeemPercent ? `не больше ${row.maxRedeemPercent}% от чека` : "без потолка"}
                </dd>
              </div>
              <div>
                <dt className="text-base text-muted-foreground">Оплата с баллами</dt>
                <dd className="mt-1 text-lg">{row.mixedPaymentEnabled ? "разрешена" : "выключена"}</dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>
    </section>
  );
}
