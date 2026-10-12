import { PROMO_AUDIENCE_LABELS, type PromoAudience, type PromoCode } from "@loal/api";
import {
  Badge,
  Card,
  Checkbox,
  Dialog,
  DialogContent,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  cn,
} from "@loal/ui/shadcn";
import { useState } from "react";
import { usePromoCodes, usePromoRedemptions } from "../../entities/promo/api";
import { CreatePromoDialog } from "../../features/promo/create-promo-dialog";
import { CopyCodeButton, CopyPromoLinkButton, DeletePromoButton, PromoActiveSwitch } from "../../features/promo/promo-row-actions";
import { EditPromoDialog } from "../../features/promo/edit-promo-dialog";
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

function expiryOf(promo: PromoCode) {
  if (!promo.expiresAt) return { text: "бессрочно", expired: false };
  const date = new Date(promo.expiresAt);
  const expired = date.getTime() < Date.now();
  return { text: `${expired ? "истёк" : "до"} ${shortDate.format(date)}`, expired };
}

/** Сколько раз применили: полоска до лимита; без лимита — просто число. */
function Usage({ promo, onOpen }: { promo: PromoCode; onOpen: () => void }) {
  const share = promo.maxUses ? Math.min(1, promo.uses / promo.maxUses) : null;
  return (
    <button
      type="button"
      onClick={onOpen}
      title="Кто применил"
      className="group flex w-full max-w-[200px] flex-col gap-1.5 rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring"
    >
      <span className="text-base tabular-nums underline-offset-4 group-hover:underline">
        <b>{money.format(promo.uses)}</b>
        <span className="text-muted-foreground">{promo.maxUses ? ` из ${money.format(promo.maxUses)}` : " · без лимита"}</span>
      </span>
      {share !== null && (
        <span aria-hidden="true" className="block h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <span
            className={cn("block h-full rounded-full", share >= 1 ? "bg-muted-foreground" : "bg-primary")}
            style={{ width: `${Math.max(share * 100, promo.uses ? 3 : 0)}%` }}
          />
        </span>
      )}
    </button>
  );
}

function PromoRow({ promo, onOpen }: { promo: PromoCode; onOpen: () => void }) {
  const expiry = expiryOf(promo);
  const used = Boolean(promo.maxUses && promo.uses >= promo.maxUses);
  const off = Boolean(promo.deletedAt) || !promo.active || expiry.expired || used;
  return (
    <li
      className={cn(
        "grid gap-4 px-5 py-4 sm:px-6 lg:grid-cols-[minmax(320px,1.6fr)_minmax(150px,0.8fr)_minmax(150px,0.9fr)_auto] lg:items-center",
        off && "bg-muted/40",
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1 sm:flex-nowrap">
          <span className={cn("rounded-lg bg-muted px-2.5 py-1 font-mono text-base font-bold tracking-wide", off && "text-muted-foreground")}>
            {promo.code}
          </span>
          <CopyCodeButton code={promo.code} compact />
          <CopyPromoLinkButton promo={promo} />
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          <Badge tone={promo.audience === "client" ? "neutral" : "quiet"}>{PROMO_AUDIENCE_LABELS[promo.audience]}</Badge>
          <span>
            +{promo.months} {promo.months === 1 ? "месяц" : promo.months < 5 ? "месяца" : "месяцев"}
          </span>
        </p>
        {promo.note && <p className="mt-1 truncate text-sm text-muted-foreground">{promo.note}</p>}
      </div>

      <Usage promo={promo} onOpen={onOpen} />

      <p className={cn("text-base whitespace-nowrap", expiry.expired ? "font-medium text-destructive" : "text-muted-foreground")}>
        {expiry.text}
        {used && !expiry.expired && <span className="block text-sm text-destructive">лимит исчерпан</span>}
      </p>

      <div className="flex flex-wrap items-center gap-1 lg:justify-end">
        {promo.deletedAt ? (
          <Badge tone="quiet">удалён</Badge>
        ) : (
          <>
            <PromoActiveSwitch promo={promo} />
            <EditPromoDialog promo={promo} />
            <DeletePromoButton promo={promo} />
          </>
        )}
      </div>
    </li>
  );
}

/** Промокоды на бесплатные месяцы подписки — для магазинов и для держателей карт. */
export function PromoCodesPage() {
  const [audience, setAudience] = useState<PromoAudience | "">("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [created, setCreated] = useState<string>();
  const [viewing, setViewing] = useState<PromoCode | null>(null);
  const promos = usePromoCodes({ audience: audience || undefined, includeDeleted });
  const rows = promos.data ?? [];
  const live = rows.filter((promo) => !promo.deletedAt && promo.active && !expiryOf(promo).expired);
  const totalUses = rows.reduce((sum, promo) => sum + promo.uses, 0);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Промокоды"
        description="Бесплатные месяцы подписки. Магазин вводит код в разделе «Оплата», клиент — в настройках кабинета или по ссылке."
        action={<CreatePromoDialog onCreated={setCreated} />}
      />

      {created && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-2 border-secondary">
          <p className="text-base">
            Промокод <span className="font-mono font-bold">{created}</span> создан.
          </p>
          <CopyCodeButton code={created} />
        </Card>
      )}

      {promos.isSuccess && rows.length > 0 && (
        <dl className="grid grid-cols-3 gap-3 sm:max-w-[640px]">
          {[
            { label: "Действуют", value: live.length },
            { label: "Применений", value: totalUses },
            { label: "Всего кодов", value: rows.filter((promo) => !promo.deletedAt).length },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-surface px-4 py-3">
              <dt className="text-sm text-muted-foreground">{item.label}</dt>
              <dd className="display mt-0.5 text-[1.75rem] leading-none tabular-nums">{money.format(item.value)}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Кому" className="flex flex-wrap gap-2">
          {(
            [
              { value: "", label: "Все" },
              { value: "client", label: PROMO_AUDIENCE_LABELS.client },
              { value: "merchant", label: PROMO_AUDIENCE_LABELS.merchant },
            ] as const
          ).map((item) => (
            <button
              key={item.value || "all"}
              type="button"
              aria-pressed={audience === item.value}
              onClick={() => setAudience(item.value)}
              className={cn(
                "min-h-10 rounded-full border-2 px-4 text-base transition-colors",
                audience === item.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface hover:border-foreground/40",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 text-base">
          <Checkbox checked={includeDeleted} onChange={(event) => setIncludeDeleted(event.target.checked)} />
          Показать удалённые
        </label>
      </div>

      {promos.isPending && <Loading />}
      {promos.isError && <ErrorState error={promos.error} onRetry={() => promos.refetch()} />}
      {promos.isSuccess && rows.length === 0 && (
        <EmptyState
          title="Промокодов пока нет"
          description="Создайте первый — например, на месяц для новых клиентов."
        />
      )}

      {rows.length > 0 && (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-border">
            {rows.map((promo) => (
              <PromoRow key={promo.id} promo={promo} onOpen={() => setViewing(promo)} />
            ))}
          </ul>
        </Card>
      )}

      <Redemptions promo={viewing} onClose={() => setViewing(null)} />
    </section>
  );
}
