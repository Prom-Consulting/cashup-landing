import { MERCHANT_ROLE_LABELS } from "@loal/api";
import { Button, Card, PageHeader } from "@loal/ui/shadcn";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { useCurrentMerchant } from "../../entities/session/model";

/**
 * Раздел владельца магазина. Администратору филиала вместо ошибки 403 — понятное объяснение:
 * кто это может и что делать, если права только что выдали.
 */
export function OwnerOnly({
  title,
  children,
  allowBranch = false,
}: {
  title: string;
  children: ReactNode;
  /** Раздел открыт и администратору филиала — сервер отдаст ему только его филиал. */
  allowBranch?: boolean;
}) {
  const { canManage, canRunBranch, role } = useCurrentMerchant();
  if (canManage || (allowBranch && canRunBranch)) return <>{children}</>;
  const who = role ? MERCHANT_ROLE_LABELS[role] : undefined;

  return (
    <section className="flex max-w-[640px] flex-col gap-6">
      <PageHeader title={title} />
      <Card className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Этот раздел — для владельца магазина</h2>
        <p className="text-lg leading-snug text-muted-foreground">
          {who ? `Вы — ${who.title.toLowerCase()}. ${who.can}` : "У вашей роли нет доступа к этому разделу."}
        </p>
        <p className="text-base text-muted-foreground">
          Если владелец только что выдал вам права, выйдите и войдите снова — роль обновляется при входе.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Button asChild>
            <Link to="/redeem">Списать бонусы</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">На главную</Link>
          </Button>
        </div>
      </Card>
    </section>
  );
}
