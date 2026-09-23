import { STORE_STATUS_LABELS, WORKFLOW_STATUS_LABELS } from "@loal/api";
import { Badge, Card, EmptyState, ErrorState, Loading, PageHeader } from "@loal/ui/page";
import { Button } from "@loal/ui/inputs";
import { Link, useParams } from "react-router";
import { useCreateInvite, useStore, useStoreInvites, useStoreMembers } from "../../entities/store/api";
import { formatDate, formatDateTime } from "../../shared/lib/format";

const MEMBER_ROLE_LABELS: Record<string, string> = {
  admin: "Владелец",
  staff: "Сотрудник",
  partner: "Партнёр",
  partner_employee: "Сотрудник партнёра",
};

/** Карточка магазина: реквизиты, команда и коды приглашения владельца. */
export function StoreDetailsPage() {
  const { storeId = "" } = useParams();
  const store = useStore(storeId);
  const members = useStoreMembers(storeId);
  const invites = useStoreInvites(storeId);
  const createInvite = useCreateInvite(storeId);

  if (store.isPending) return <Loading />;
  if (store.isError) return <ErrorState error={store.error} onRetry={() => store.refetch()} />;

  return (
    <section className="flex flex-col gap-6">
      <Link to="/" className="text-base text-slate underline-offset-4 hover:underline">
        ← К списку магазинов
      </Link>

      <PageHeader
        title={store.data.name}
        description={`${store.data.slug} · создан ${formatDate(store.data.createdAt)}`}
        action={<Badge tone={store.data.status === "active" ? "good" : "warn"}>{STORE_STATUS_LABELS[store.data.status]}</Badge>}
      />

      <Card>
        <h2 className="text-xl font-bold">Реквизиты</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-base text-slate">Стадия работы</dt>
            <dd className="text-lg">{WORKFLOW_STATUS_LABELS[store.data.workflowStatus]}</dd>
          </div>
          <div>
            <dt className="text-base text-slate">Подписка оплачена до</dt>
            <dd className="text-lg">{formatDate(store.data.subscriptionPaidUntil)}</dd>
          </div>
          <div>
            <dt className="text-base text-slate">Почта</dt>
            <dd className="text-lg">{store.data.contactEmail ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-base text-slate">Телефон</dt>
            <dd className="text-lg">{store.data.contactPhone ?? "—"}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">Команда</h2>
        {members.isPending && <Loading />}
        {members.isError && <ErrorState error={members.error} onRetry={() => members.refetch()} />}
        {members.isSuccess && members.data.length === 0 && <EmptyState title="В магазине пока нет сотрудников" />}
        <ul className="mt-4 flex flex-col gap-3">
          {(members.data ?? []).map((member) => (
            <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-smoke pt-3">
              <span className="text-lg">{MEMBER_ROLE_LABELS[member.role] ?? member.role}</span>
              <span className="text-base text-slate">
                {member.acceptedAt ? `принял приглашение ${formatDateTime(member.acceptedAt)}` : "приглашение не принято"}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Коды приглашения владельца</h2>
          <Button type="button" variant="outline" disabled={createInvite.isPending} onClick={() => createInvite.mutate()}>
            {createInvite.isPending ? "Создаём…" : "Создать код"}
          </Button>
        </div>
        <p className="mt-2 max-w-[70ch] text-base text-slate">
          По коду владелец регистрируется сам и сразу получает права на этот магазин.
        </p>
        {createInvite.isError && <ErrorState error={createInvite.error} />}
        {invites.isPending && <Loading />}
        {invites.isSuccess && invites.data.length === 0 && <EmptyState title="Кодов пока нет" />}
        <ul className="mt-4 flex flex-col gap-3">
          {(invites.data ?? []).map((invite) => (
            <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-smoke pt-3">
              <code className="rounded-lg bg-cream px-3 py-2 text-lg tracking-wide">{invite.code}</code>
              <span className="text-base text-slate">
                {invite.redeemedAt ? `использован ${formatDateTime(invite.redeemedAt)}` : "не использован"}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
