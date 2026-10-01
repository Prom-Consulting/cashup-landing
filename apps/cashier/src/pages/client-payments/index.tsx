import { ClientPaymentForm, ClientPaymentList } from "@loal/app-kit";
import { Card, PageHeader } from "@loal/ui/shadcn";
import { useCashierSession } from "../../entities/cashier/api";

/** Счёт клиенту через OctōPAY: клиент выбирает бонусы Loal и оплачивает остаток банком. */
export function ClientPaymentsPage() {
  const { merchantId } = useCashierSession();
  if (!merchantId) return null;
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Счёт клиенту"
        description="Клиент открывает ссылку OctōPAY, выбирает, сколько бонусов Loal использовать, и оплачивает остаток банком."
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
