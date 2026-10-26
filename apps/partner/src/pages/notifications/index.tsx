import { useEffect, useRef } from "react";
import { Button, Card, EmptyState, ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { Link } from "react-router";
import { useMarkNotificationsRead, useNotifications } from "../../entities/notifications/api";
import { useCurrentMerchant } from "../../entities/session/model";

const when = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("ru-RU")} ${d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
};

/** Центр уведомлений: события заведения. Открыли — отметили всё прочитанным. */
export function NotificationsPage() {
  const { merchantId } = useCurrentMerchant();
  const inbox = useNotifications(merchantId ?? "");
  const markRead = useMarkNotificationsRead(merchantId ?? "");

  // Один раз за визит: открыли центр — считаем всё прочитанным (бейдж гаснет).
  const marked = useRef(false);
  useEffect(() => {
    if (!marked.current && merchantId && (inbox.data?.unread ?? 0) > 0) {
      marked.current = true;
      markRead.mutate(undefined);
    }
  }, [merchantId, inbox.data?.unread, markRead]);

  if (!merchantId) return null;
  const items = inbox.data?.items ?? [];

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Уведомления" description="События вашего заведения: ответы поддержки, награды и другое." />

      {inbox.isPending ? (
        <Card className="p-6">
          <Loading rows={4} />
        </Card>
      ) : inbox.isError ? (
        <Card className="p-6">
          <ErrorState error={inbox.error} onRetry={() => inbox.refetch()} />
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-0">
          <EmptyState title="Уведомлений пока нет" description="Здесь появятся события вашего заведения." />
        </Card>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const inner = (
                <div className="flex items-start gap-3">
                  {!item.read && <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-flame" />}
                  <div className={`min-w-0 ${item.read ? "pl-5" : ""}`}>
                    <div className="font-medium">{item.title}</div>
                    {item.body && <div className="mt-0.5 text-sm text-muted-foreground">{item.body}</div>}
                    <div className="mt-1 text-xs text-muted-foreground">{when(item.createdAt)}</div>
                  </div>
                </div>
              );
              return (
                <li key={item.id}>
                  {item.link ? (
                    <Link to={item.link} className="block px-6 py-4 transition-colors hover:bg-muted/40">
                      {inner}
                    </Link>
                  ) : (
                    <div className="px-6 py-4">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {items.some((i) => !i.read) && (
        <div>
          <Button type="button" variant="outline" onClick={() => markRead.mutate(undefined)} disabled={markRead.isPending}>
            Отметить все прочитанными
          </Button>
        </div>
      )}
    </section>
  );
}
