import { ClientPaymentForm, ClientPaymentList } from "@loal/app-kit";
import { Card, PageHeader } from "@loal/ui/shadcn";
import { useCashierSession } from "../../entities/cashier/api";

/** Счёт клиенту через OctōPAY: оплатит по ссылке — бонусы на ту же сумму спишутся сами. */
export function ClientPaymentsPage() {
  const { merchantId } = useCashierSession();
  if (!merchantId) return null;
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Счёт клиенту"
        description="Клиент оплачивает по ссылке OctōPAY, и бонусы на ту же сумму спишутся с его карты сами."
      />
      <Card>
        <ClientPaymentForm merchantId={merchantId} />
      </Card>
      <Card>
        <h2 className="mb-4 text-xl font-bold">Мои счета</h2>
        <ClientPaymentList merchantId={merchantId} />
      </Card>
    </section>
  );
}
