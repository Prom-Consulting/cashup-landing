import { ClientPaymentForm, ClientPaymentList } from "@loal/app-kit";
import { Card, PageHeader } from "@loal/ui/shadcn";
import { useCurrentMerchant } from "../../entities/session/model";

/** Счёт клиенту через OctōPAY: клиент платит по ссылке, бонусы на ту же сумму спишутся сами. */
export function ClientPaymentsPage() {
  const { merchantId, canManage } = useCurrentMerchant();
  if (!merchantId) return null;
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Счёт клиенту"
        description="Клиент оплачивает по ссылке OctōPAY, и бонусы на ту же сумму спишутся с его карты сами — подтверждать ничего не нужно."
      />
      <Card>
        <ClientPaymentForm merchantId={merchantId} />
      </Card>
      <Card>
        <h2 className="mb-4 text-xl font-bold">{canManage ? "Все счета" : "Счета филиала"}</h2>
        <ClientPaymentList merchantId={merchantId} />
      </Card>
    </section>
  );
}
