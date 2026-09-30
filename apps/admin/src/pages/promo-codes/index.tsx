import { PROMO_AUDIENCE_LABELS, type PromoAudience, type PromoCode } from "@loal/api";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogContent,
  EmptyState,
  ErrorState,
  Loading,
  NativeSelect,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@loal/ui/shadcn";
import { useState } from "react";
import { usePromoCodes, usePromoRedemptions } from "../../entities/promo/api";
import { CreatePromoDialog } from "../../features/promo/create-promo-dialog";
import { CopyCodeButton, DeletePromoButton, PromoActiveSwitch } from "../../features/promo/promo-row-actions";
import { formatDateTime } from "../../shared/lib/format";

const money = new Intl.NumberFormat("ru-RU");
const shortDate = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" });

/** Кто применил код: магазины или держатели карт. */
function Redemptions({ promo, onClose }: { promo: PromoCode | null; onClose: () => void }) {
  const redemptions = usePromoRedemptions(promo?.id ?? null);
  return (
    <Dialog open={Boolean(promo)} onOpenChange={(open) => !open && onClose()}>
      {promo && (
        <DialogContent
          title={`Кто применил ${promo.code}`}
          description={`${PROMO_AUDIENCE_LABELS[promo.audience]}, по ${promo.months} мес.`}
          className="w-[min(640px,calc(100vw-2rem))]"
        >
          <div className="mt-5">
            {redemptions.isPending && <Loading rows={2} />}
            {redemptions.isError && <ErrorState error={redemptions.error} onRetry={() => redemptions.refetch()} />}
            {redemptions.isSuccess && redemptions.data.length === 0 && <EmptyState title="Код ещё никто не применял" />}
            {redemptions.isSuccess && redemptions.data.length > 0 && (
              <ul className="flex flex-col divide-y divide-border">
                {redemptions.data.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                    <span className="text-base font-medium">
                      {row.merchantName ?? row.userPhone ?? row.merchantId ?? row.userId ?? "—"}
                    </span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      +{row.months} мес. · {formatDateTime(row.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

/** Промокоды на бесплатные месяцы подписки — для магазинов и для держателей карт. */
export function PromoCodesPage() {
  const [audience, setAudience] = useState<PromoAudience | "">("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [created, setCreated] = useState<string>();
  const [viewing, setViewing] = useState<PromoCode | null>(null);
  const promos = usePromoCodes({ audience: audience || undefined, includeDeleted });

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Промокоды"
        description="Бесплатные месяцы подписки. Магазин вводит код в разделе «Оплата», клиент — в настройках кабинета."
        action={<CreatePromoDialog onCreated={setCreated} />}
      />

      {created && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-base">
            Промокод <span className="font-mono font-bold">{created}</span> создан.
          </p>
          <CopyCodeButton code={created} />
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-5">
        <NativeSelect
          aria-label="Кому"
          className="w-auto min-w-[200px]"
          value={audience}
          onChange={(event) => setAudience(event.target.value as PromoAudience | "")}
          placeholder="Все промокоды"
          options={Object.entries(PROMO_AUDIENCE_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <label className="flex items-center gap-2 text-base">
          <Checkbox checked={includeDeleted} onChange={(event) => setIncludeDeleted(event.target.checked)} />
          Показать удалённые
        </label>
      </div>

      {promos.isPending && <Loading />}
      {promos.isError && <ErrorState error={promos.error} onRetry={() => promos.refetch()} />}
      {promos.isSuccess && promos.data.length === 0 && (
        <EmptyState
          title="Промокодов пока нет"
          description="Создайте первый — например, на месяц для новых магазинов."
        />
      )}

      {promos.isSuccess && promos.data.length > 0 && (
        <div className="overflow-x-auto">
          <Table className="sm:[&_td]:px-3 sm:[&_th]:px-3">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Код</TableHeaderCell>
                <TableHeaderCell>Кому</TableHeaderCell>
                <TableHeaderCell className="text-right">Месяцев</TableHeaderCell>
                <TableHeaderCell className="text-right">Применили</TableHeaderCell>
                <TableHeaderCell>До</TableHeaderCell>
                <TableHeaderCell>Состояние</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {promos.data.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell primary>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-base font-bold whitespace-nowrap">{promo.code}</span>
                      <CopyCodeButton code={promo.code} compact />
                    </div>
                    {promo.note && <p className="text-sm text-muted-foreground">{promo.note}</p>}
                  </TableCell>
                  <TableCell label="Кому">{PROMO_AUDIENCE_LABELS[promo.audience]}</TableCell>
                  <TableCell label="Месяцев" className="text-right tabular-nums">{promo.months}</TableCell>
                  <TableCell label="Применили" className="text-right tabular-nums">
                    <Button variant="ghost" size="sm" title="Кто применил" onClick={() => setViewing(promo)}>
                      {money.format(promo.uses)}
                      {promo.maxUses ? ` из ${money.format(promo.maxUses)}` : ""}
                    </Button>
                  </TableCell>
                  <TableCell label="До" className="whitespace-nowrap">
                    {promo.expiresAt ? shortDate.format(new Date(promo.expiresAt)) : "бессрочно"}
                  </TableCell>
                  <TableCell label="Состояние">
                    {promo.deletedAt ? (
                      <Badge tone="quiet">удалён</Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <PromoActiveSwitch promo={promo} />
                        <DeletePromoButton promo={promo} />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Redemptions promo={viewing} onClose={() => setViewing(null)} />
    </section>
  );
}
