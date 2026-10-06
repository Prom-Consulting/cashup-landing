import { GoogleLink } from "@loal/app-kit";
import { Card, PageHeader } from "@loal/ui/shadcn";
import { GOOGLE_CLIENT_ID } from "../../shared/config/env";

/** Настройки кассира: пока только вход через Google — номер и филиал задаёт партнёр. */
export function ProfilePage() {
  return (
    <section className="flex max-w-[560px] flex-col gap-6">
      <PageHeader title="Настройки" description="Как входить в кабинет кассира" />
      <Card>
        <h2 className="text-xl font-bold">Вход через Google</h2>
        <GoogleLink clientId={GOOGLE_CLIENT_ID} />
      </Card>
    </section>
  );
}
