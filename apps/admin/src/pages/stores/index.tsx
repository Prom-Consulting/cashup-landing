import { STORE_STATUS_LABELS, WORKFLOW_STATUS_LABELS, WORKFLOW_STATUS_ORDER, type Store } from "@loal/api";
import { Badge, Card, EmptyState, ErrorState, Loading, PageHeader } from "@loal/ui/page";
import { SearchInput } from "@loal/ui/inputs";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useStores } from "../../entities/store/api";
import { formatDate } from "../../shared/lib/format";

function matches(store: Store, query: string) {
  const haystack = `${store.name} ${store.slug} ${store.contactEmail ?? ""} ${store.contactPhone ?? ""}`;
  return haystack.toLowerCase().includes(query.trim().toLowerCase());
}

export function StoresPage() {
  const stores = useStores();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => (stores.data ?? []).filter((store) => matches(store, query)), [stores.data, query]);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Магазины" description="Заведения, подключённые к платформе, и стадия работы по каждому." />

      <SearchInput
        value={query}
        onValueChange={setQuery}
        label="Поиск по магазинам"
        placeholder="Название, почта или телефон"
        className="max-w-[420px]"
      />

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
              <p className="mt-2 text-base text-slate">
                {store.kind === "issuer" ? "Выпускает карты" : "Принимает карты"} · {store.slug}
              </p>
              <p className="mt-4 text-base">
                {WORKFLOW_STATUS_LABELS[store.workflowStatus]}{" "}
                <span className="text-slate">
                  · шаг {step} из {WORKFLOW_STATUS_ORDER.length}
                </span>
              </p>
              <p className="mt-1 text-base text-slate">Оплачен до {formatDate(store.subscriptionPaidUntil)}</p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
