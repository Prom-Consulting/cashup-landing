import { Search01Icon } from "@hugeicons/core-free-icons";
import { MERCHANT_STATUS_LABELS, WORKFLOW_STATUS_LABELS, WORKFLOW_STATUS_ORDER, type Merchant } from "@loal/api";
import { Badge, Button, Card, EmptyState, ErrorState, Icon, Input, Loading, PageHeader } from "@loal/ui/shadcn";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMerchants } from "../../entities/merchant/api";
import { CreateMerchantForm } from "../../features/merchant/create-merchant-form";
import { formatDate } from "../../shared/lib/format";

function matches(merchant: Merchant, query: string) {
  const haystack = `${merchant.name} ${merchant.slug} ${merchant.contactEmail ?? ""} ${merchant.contactPhone ?? ""}`;
  return haystack.toLowerCase().includes(query.trim().toLowerCase());
}

/** Заведения, принимающие бонусы. Карты и клиенты принадлежат платформе, не им. */
export function MerchantsPage() {
  const merchants = useMerchants();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const rows = useMemo(
    () => (merchants.data ?? []).filter((merchant) => matches(merchant, query)),
    [merchants.data, query],
  );

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Заведения"
        description="Кто принимает бонусы Loal и на каком этапе подключения."
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

      <div className="relative max-w-[420px]">
        <Icon icon={Search01Icon} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Название, почта или телефон"
          aria-label="Поиск по заведениям"
          className="pl-12"
        />
      </div>

      {merchants.isPending && <Loading />}
      {merchants.isError && <ErrorState error={merchants.error} onRetry={() => merchants.refetch()} />}
      {merchants.isSuccess && rows.length === 0 && (
        <EmptyState
          title={query ? "Ничего не нашлось" : "Заведений пока нет"}
          description={query ? "Попробуйте изменить запрос." : "Создайте первое — оно появится здесь."}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((merchant) => {
          const step = WORKFLOW_STATUS_ORDER.indexOf(merchant.workflowStatus) + 1;
          return (
            <Card key={merchant.id}>
              <div className="flex items-start justify-between gap-3">
                <Link to={`/merchants/${merchant.id}`} className="text-xl font-bold underline-offset-4 hover:underline">
                  {merchant.name}
                </Link>
                <Badge tone={merchant.status === "active" ? "good" : "warn"}>
                  {MERCHANT_STATUS_LABELS[merchant.status]}
                </Badge>
              </div>
              <p className="mt-2 text-base text-muted-foreground">{merchant.slug}</p>
              <p className="mt-4 text-base">
                {WORKFLOW_STATUS_LABELS[merchant.workflowStatus]}{" "}
                <span className="text-muted-foreground">
                  · шаг {step} из {WORKFLOW_STATUS_ORDER.length}
                </span>
              </p>
              <p className="mt-1 text-base text-muted-foreground">Заведён {formatDate(merchant.createdAt)}</p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
