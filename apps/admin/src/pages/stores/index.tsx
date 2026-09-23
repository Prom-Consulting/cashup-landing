import {
  STORE_STATUS_LABELS,
  WORKFLOW_STATUS_LABELS,
  WORKFLOW_STATUS_ORDER,
  type Store,
  type StoreKind,
} from "@loal/api";
import { Badge, Card, EmptyState, ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Button, Icon, Input } from "@loal/ui/shadcn";
import { CreateStoreForm } from "../../features/store/create-store-form";
import { useNavigate } from "react-router";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useStores } from "../../entities/store/api";
import { formatDate } from "../../shared/lib/format";

function matches(store: Store, query: string) {
  const haystack = `${store.name} ${store.slug} ${store.contactEmail ?? ""} ${store.contactPhone ?? ""}`;
  return haystack.toLowerCase().includes(query.trim().toLowerCase());
}

const kindFilters: { id: StoreKind | "all"; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "merchant", label: "Принимают карты" },
  { id: "issuer", label: "Выпускают карты" },
];

export function StoresPage() {
  const [kind, setKind] = useState<StoreKind | "all">("all");
  const stores = useStores(kind === "all" ? undefined : kind);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const rows = useMemo(() => (stores.data ?? []).filter((store) => matches(store, query)), [stores.data, query]);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Магазины"
        description="Заведения, подключённые к платформе, и стадия работы по каждому."
        action={
          <Button type="button" variant={creating ? "ghost" : "primary"} onClick={() => setCreating((value) => !value)}>
            {creating ? "Свернуть" : "Новый магазин"}
          </Button>
        }
      />

      {creating && (
        <Card>
          <CreateStoreForm
            onCreated={(storeId) => {
              setCreating(false);
              navigate(`/stores/${storeId}`);
            }}
          />
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {kindFilters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setKind(filter.id)}
            className={`rounded-full px-4 py-2 text-base transition-colors ${
              kind === filter.id ? "bg-graphite text-paper" : "bg-paper text-graphite hover:bg-smoke"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="relative max-w-[420px]">
        <Icon icon={Search01Icon} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Название, почта или телефон"
          aria-label="Поиск по магазинам"
          className="pl-12"
        />
      </div>

      {stores.isPending && <Loading />}
      {stores.isError && <ErrorState error={stores.error} onRetry={() => stores.refetch()} />}
      {stores.isSuccess && rows.length === 0 && (
        <EmptyState title="Ничего не нашлось" description="Попробуйте изменить запрос." />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((store) => {
          const step = WORKFLOW_STATUS_ORDER.indexOf(store.workflowStatus) + 1;
          return (
            <Card key={store.id}>
              <div className="flex items-start justify-between gap-3">
                <Link to={`/stores/${store.id}`} className="text-xl font-bold underline-offset-4 hover:underline">
                  {store.name}
                </Link>
                <Badge tone={store.status === "active" ? "good" : "warn"}>{STORE_STATUS_LABELS[store.status]}</Badge>
              </div>
              <p className="mt-2 text-base text-muted-foreground">
                {store.kind === "issuer" ? "Выпускает карты" : "Принимает карты"} · {store.slug}
              </p>
              <p className="mt-4 text-base">
                {WORKFLOW_STATUS_LABELS[store.workflowStatus]}{" "}
                <span className="text-muted-foreground">
                  · шаг {step} из {WORKFLOW_STATUS_ORDER.length}
                </span>
              </p>
              <p className="mt-1 text-base text-muted-foreground">
                Оплачен до {formatDate(store.subscriptionPaidUntil)}
              </p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
