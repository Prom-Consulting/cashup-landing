import { ClientPaymentForm, ClientPaymentList } from "@loal/app-kit";
import { Button, Card, Loading, PageHeader } from "@loal/ui/shadcn";
import { Link } from "react-router";
import { useBranches, useTariff } from "../../entities/merchant/api";
import { useCurrentMerchant } from "../../entities/session/model";

/** Счёт клиенту через OctōPAY: клиент выбирает бонусы Loal и оплачивает остаток банком. */
export function ClientPaymentsPage() {
  const { merchantId, canManage, isBranchAdmin, branchIds } = useCurrentMerchant();
  const { tariff, isPending } = useTariff(merchantId ?? "");
  const branches = useBranches(merchantId ?? "");
  // Счёт администратора нескольких филиалов записывается на выбранный; владельцу филиал не нужен
  const workBranches = isBranchAdmin
    ? (branches.data ?? []).filter((branch) => !branch.archivedAt && branchIds.includes(branch.id))
    : undefined;
  if (!merchantId) return null;
  if (isPending) return <Loading rows={3} />;
  // «Счёт клиенту» — часть тарифа OctōPAY + Loal; на «Только Loal» объясняем, как его получить
  if (tariff !== "octopay")
    return (
      <section className="flex max-w-[640px] flex-col gap-6">
        <PageHeader title="Счёт клиенту" />
        <Card className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Доступно на тарифе OctōPAY + Loal</h2>
          <p className="text-lg leading-snug text-muted-foreground">
            Клиент платит по ссылке OctōPAY и сам решает, сколько бонусов потратить. А Loal на этом тарифе бесплатен.
          </p>
          <p className="text-base text-muted-foreground">
            {canManage
              ? "Подключите магазин в OctōPAY на главной — тариф сменится сам."
              : "Подключить OctōPAY может владелец магазина."}
          </p>
          {canManage && (
            <div>
              <Button asChild>
                <Link to="/">Подключить OctōPAY</Link>
              </Button>
            </div>
          )}
        </Card>
      </section>
    );
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Счёт клиенту"
        description="Клиент открывает ссылку OctōPAY, выбирает, сколько бонусов Loal использовать, и оплачивает остаток банком."
      />
      <Card>
        <ClientPaymentForm merchantId={merchantId} setupHref={canManage ? "/" : undefined} branches={workBranches} />
      </Card>
      <Card>
        <h2 className="mb-4 text-xl font-bold">{canManage ? "Все счета" : "Счета филиала"}</h2>
        <ClientPaymentList merchantId={merchantId} />
      </Card>
    </section>
  );
}
