import type { Customer } from "@loal/api";
import { Button, ConfirmDialog } from "@loal/ui/shadcn";
import { useArchiveCustomer, useRestoreCustomer } from "../../entities/card/api";

export function CustomerArchiveAction({ customer, onDone }: {
  customer: Customer;
  onDone: (id: string) => void;
}) {
  const archive = useArchiveCustomer();
  const restore = useRestoreCustomer();
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Без имени";

  if (customer.archivedAt) {
    return (
      <ConfirmDialog
        trigger={<Button variant="outline" size="sm" disabled={restore.isPending}>Вернуть</Button>}
        title={`Вернуть клиента «${name}» из архива?`}
        description="Клиент снова сможет войти. Если действующей карты нет, ему будет выдана новая с сохранённым балансом."
        confirmLabel="Вернуть"
        tone="primary"
        onConfirm={async () => {
          await restore.mutateAsync(customer.id);
          onDone(customer.id);
        }}
      />
    );
  }

  return (
    <ConfirmDialog
      trigger={<Button variant="danger" size="sm" disabled={archive.isPending}>Удалить пользователя</Button>}
      title={`Отправить пользователя «${name}» в архив?`}
      description={[
        customer.phone ? `Телефон: ${customer.phone}.` : "",
        "Карты станут недействительными, вход закроется. Баланс, подписка и история сохранятся; клиента можно будет вернуть. Телефон останется занят.",
      ].filter(Boolean).join(" ")}
      confirmLabel="Отправить в архив"
      onConfirm={async () => {
        await archive.mutateAsync(customer.id);
        onDone(customer.id);
      }}
    />
  );
}
