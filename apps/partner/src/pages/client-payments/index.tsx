import { ClientPaymentForm, ClientPaymentList } from "@loal/app-kit";
import { Card, PageHeader } from "@loal/ui/shadcn";
import { useCurrentMerchant } from "../../entities/session/model";

/** Счёт клиенту через OctōPAY: клиент выбирает бонусы Loal и оплачивает остаток банком. */
export function ClientPaymentsPage() {
  const { merchantId, canManage } = useCurrentMerchant();
  if (!merchantId) return null;
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Счёт клиенту"
        description="Клиент открывает ссылку OctōPAY, выбирает, сколько бонусов Loal использовать, и оплачивает остаток банком."
      />
      <Card>
        <ClientPaymentForm merchantId={merchantId} setupHref={canManage ? "/" : undefined} />
      </Card>
      <Card>
        <h2 className="mb-4 text-xl font-bold">{canManage ? "Все счета" : "Счета филиала"}</h2>
        <ClientPaymentList merchantId={merchantId} />
      </Card>
    </section>
  );
}
