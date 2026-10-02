import { ClientPaymentForm, ClientPaymentList } from "@loal/app-kit";
import { Card, Loading, PageHeader } from "@loal/ui/shadcn";
import { useCashierOverview, useCashierSession } from "../../entities/cashier/api";

/** Счёт клиенту через OctōPAY: клиент выбирает бонусы Loal и оплачивает остаток банком. */
export function ClientPaymentsPage() {
  const { merchantId } = useCashierSession();
  const overview = useCashierOverview();
  if (!merchantId) return null;
  if (overview.isPending) return <Loading rows={3} />;
  if (overview.data?.tariff !== "octopay")
    return (
      <section className="flex max-w-[640px] flex-col gap-6">
        <PageHeader title="Счёт клиенту" />
        <Card>
          <p className="text-lg leading-snug">
            Счёт клиенту доступен, когда магазин подключён к OctōPAY. Подключает владелец — до тех пор бонусы списывайте
            через «Списать бонусы».
          </p>
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
        <ClientPaymentForm merchantId={merchantId} branches={overview.data?.branches} />
      </Card>
      <Card>
        <h2 className="mb-4 text-xl font-bold">Мои счета и NFC-оплаты</h2>
        <ClientPaymentList merchantId={merchantId} />
      </Card>
    </section>
  );
}
