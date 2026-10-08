import type { Customer } from "@loal/api";
import { Button, ConfirmDialog } from "@loal/ui/shadcn";
import { useDeleteCustomer } from "../../entities/card/api";

export function DeleteCustomerDialog({ customer, onDeleted }: {
  customer: Customer;
  onDeleted: (id: string) => void;
}) {
  const remove = useDeleteCustomer();
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Без имени";
  return (
    <ConfirmDialog
      trigger={<Button variant="danger" size="sm" disabled={remove.isPending}>Удалить пользователя</Button>}
      title={`Удалить пользователя «${name}»?`}
      description={[
        customer.phone ? `Телефон: ${customer.phone}.` : "",
        "Аккаунт, баланс, подписки и история операций будут удалены, карты станут недействительными. Доступ к кабинетам заведений закроется. Телефон и почту можно будет использовать для новой регистрации. Восстановить данные нельзя.",
      ].filter(Boolean).join(" ")}
      confirmLabel={remove.isPending ? "Удаляем…" : "Удалить навсегда"}
      onConfirm={async () => {
        await remove.mutateAsync(customer.id);
        onDeleted(customer.id);
      }}
    />
  );
}
