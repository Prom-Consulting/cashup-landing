import { Search01Icon } from "@hugeicons/core-free-icons";
import {
  MERCHANT_LIFECYCLE_LABELS,
  TARIFF_LABELS,
  WORKFLOW_STATUS_LABELS,
  WORKFLOW_STATUS_ORDER,
  lifecycleOf,
  tariffOf,
  type ApplicationListItem,
  type Merchant,
  type MerchantListItem,
} from "@loal/api";
import { formatPhone } from "@loal/ui/inputs";
import { Badge, Button, Card, EmptyState, ErrorState, Icon, Input, Loading, PageHeader, cn } from "@loal/ui/shadcn";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMerchantsWithApplications } from "../../entities/merchant/api";
import { CreateMerchantForm } from "../../features/merchant/create-merchant-form";
import { ApplicationInfo } from "../../features/merchant-lifecycle/application-info";
import { RejectButton } from "../../features/merchant-lifecycle/reject-dialog";
import { formatDate } from "../../shared/lib/format";

const isApplication = (item: MerchantListItem): item is ApplicationListItem => item.kind === "application";
const lifecycle = (item: MerchantListItem) => (isApplication(item) ? item.lifecycle : lifecycleOf(item));

function matches(item: MerchantListItem, query: string) {
  const haystack = isApplication(item)
    ? `${item.name} ${item.contactPhone ?? ""}`
    : `${item.name} ${item.slug} ${item.contactEmail ?? ""} ${item.contactPhone ?? ""}`;
  return haystack.toLowerCase().includes(query.trim().toLowerCase());
}

/** Фильтры по состоянию: «ждут проверки» — первая забота агентства. */
const FILTERS: { value: string; label: string; match: (item: MerchantListItem) => boolean }[] = [
  { value: "all", label: "Все", match: () => true },
  { value: "review", label: "Ждут проверки", match: (item) => lifecycle(item) === "pending_review" },
  // Все заявки без заведения, и отклонённые тоже: видно, что с ними сделали
  { value: "applications", label: "Заявки без заведения", match: (item) => isApplication(item) },
  { value: "working", label: "Работают", match: (item) => !isApplication(item) && ["active", "trial"].includes(lifecycle(item)) },
  { value: "suspended", label: "Приостановлены", match: (item) => !isApplication(item) && lifecycle(item) === "suspended" },
  { value: "archive", label: "Архив", match: (item) => !isApplication(item) && ["rejected", "deleted", "erased"].includes(lifecycle(item)) },
];

function LifecycleBadge({ state }: { state: string }) {
  const info = MERCHANT_LIFECYCLE_LABELS[state];
  return <Badge tone={info?.tone ?? "quiet"}>{info?.label ?? state}</Badge>;
}

function MerchantCard({ merchant }: { merchant: Merchant }) {
  const state = lifecycleOf(merchant);
  const archived = ["rejected", "deleted", "erased"].includes(state);
  const step = WORKFLOW_STATUS_ORDER.indexOf(merchant.workflowStatus) + 1;
  return (
    <Card className={cn("flex flex-col gap-2", archived && "opacity-75")}>
      <div className="flex items-start justify-between gap-3">
        <Link to={`/merchants/${merchant.id}`} className="text-xl font-bold underline-offset-4 hover:underline">
          {merchant.name}
        </Link>
        <LifecycleBadge state={state} />
      </div>
      <p className="flex flex-wrap items-center gap-2 text-base text-muted-foreground">
        {merchant.slug}
        <Badge tone={tariffOf(merchant.tariff) === "octopay" ? "good" : "quiet"}>
          {TARIFF_LABELS[tariffOf(merchant.tariff)].short}
        </Badge>
      </p>
      {state === "deleted" && merchant.restorableUntil && (
        <p className="text-base">Удалён {formatDate(merchant.deletedAt)} · можно вернуть до {formatDate(merchant.restorableUntil)}</p>
      )}
      {state === "erased" && <p className="text-base text-muted-foreground">Прошло 30 дней — контакты стёрты, вернуть нельзя.</p>}
      {state === "rejected" && merchant.rejectionReason && (
        <p className="text-base">Отклонён: «{merchant.rejectionReason}»</p>
      )}
      {!archived && (
        <p className="text-base">
          {WORKFLOW_STATUS_LABELS[merchant.workflowStatus]}{" "}
          <span className="text-muted-foreground">
            · шаг {step} из {WORKFLOW_STATUS_ORDER.length}
          </span>
        </p>
      )}
      {merchant.application && <ApplicationInfo application={merchant.application} compact />}
      <p className="text-sm text-muted-foreground">Заведён {formatDate(merchant.createdAt)}</p>
    </Card>
  );
}

/** Заявка с сайта, за которой ещё нет заведения: страницы у неё нет, но отклонить можно. */
function ApplicationCard({ item }: { item: ApplicationListItem }) {
  const open = item.lifecycle !== "rejected";
  return (
    <Card className="flex flex-col gap-2 border-2 border-dashed border-border">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xl font-bold">{item.name}</p>
        <LifecycleBadge state={item.lifecycle} />
      </div>
      <p className="text-base text-muted-foreground">
        {item.contactPhone ? formatPhone(item.contactPhone) : "без телефона"}
        {item.createdAt ? ` · ${formatDate(item.createdAt)}` : ""}
      </p>
      {item.application && <ApplicationInfo application={item.application} compact />}
      {item.rejectionReason && <p className="text-base">Отклонена: «{item.rejectionReason}»</p>}
      {open && (
        <div className="mt-1">
          <RejectButton id={item.application?.id ?? item.id} kind="application" name={item.name} />
        </div>
      )}
    </Card>
  );
}

/** Заведения и заявки с сайта: кто ждёт проверки, кто работает, что в архиве. */
export function MerchantsPage() {
  const [showArchive, setShowArchive] = useState(false);
  const [filter, setFilter] = useState("all");
  const list = useMerchantsWithApplications(showArchive);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const option of FILTERS) result[option.value] = (list.data ?? []).filter((item) => option.match(item)).length;
    return result;
  }, [list.data]);
  const active = FILTERS.find((option) => option.value === filter) ?? FILTERS[0]!;
  const rows = useMemo(
    () => (list.data ?? []).filter((item) => active.match(item) && matches(item, query)),
    [list.data, query, active],
  );

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Заведения"
        description="Заявки с сайта, проверка, работа и архив — кто принимает бонусы Loal."
        action={
          <Button variant={creating ? "ghost" : "primary"} onClick={() => setCreating((value) => !value)}>
            {creating ? "Свернуть" : "Новое заведение"}
          </Button>
        }
      />

      {creating && (
        <Card>
          <CreateMerchantForm
            onCreated={(merchantId) => {
              setCreating(false);
              navigate(`/merchants/${merchantId}`);
            }}
          />
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-full max-w-[420px]">
          <Icon icon={Search01Icon} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Название, почта или телефон"
            aria-label="Поиск по заведениям"
            className="pl-12"
          />
        </div>
        <label className="flex items-center gap-2 text-base">
          <input
            type="checkbox"
            className="h-5 w-5 accent-[var(--primary)]"
            checked={showArchive}
            onChange={(event) => setShowArchive(event.target.checked)}
          />
          Показать удалённые
        </label>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Состояние">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              "min-h-10 rounded-full border-2 px-4 text-base transition-colors",
              filter === option.value ? "border-foreground bg-foreground text-background" : "border-border bg-surface hover:border-foreground/40",
            )}
          >
            {option.label}
            {list.isSuccess && <span className="ml-1.5 tabular-nums opacity-70">{counts[option.value]}</span>}
          </button>
        ))}
      </div>

      {list.isPending && <Loading />}
      {list.isError && <ErrorState error={list.error} onRetry={() => list.refetch()} />}
      {list.isSuccess && rows.length === 0 && (
        <EmptyState
          title={query ? "Ничего не нашлось" : filter === "review" ? "Никто не ждёт проверки" : "Здесь пока пусто"}
          description={query ? "Попробуйте изменить запрос." : filter === "archive" && !showArchive ? "Включите «Показать удалённые»." : undefined}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((item) =>
          isApplication(item) ? <ApplicationCard key={`a-${item.id}`} item={item} /> : <MerchantCard key={item.id} merchant={item} />,
        )}
      </div>
    </section>
  );
}
