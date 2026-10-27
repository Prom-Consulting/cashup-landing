import { Add01Icon, ArrowRight01Icon, CheckmarkCircle02Icon, Store02Icon } from "@hugeicons/core-free-icons";
import { Badge, Button, Card, Icon, PageHeader } from "@loal/ui/shadcn";
import { Link, useNavigate } from "react-router";
import { useCurrentMerchant } from "../../entities/session/model";

const roleLabel = (role: string) =>
  role === "admin" ? "Владелец" : role === "branch_admin" ? "Администратор филиала" : "Кассир";

/**
 * «Мои заведения»: у одного аккаунта может быть несколько магазинов (филиализация). Показываем
 * список, отмечаем активное, даём переключиться и открыть новое заведение тем же номером.
 */
export function StoresPage() {
  const { memberships, merchantId, selectMerchant, canManage } = useCurrentMerchant();
  const navigate = useNavigate();

  const switchTo = (id: string) => {
    selectMerchant(id);
    navigate("/");
  };

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Мои заведения"
        description="Заведения на вашем аккаунте. Выберите, с каким работать, или откройте новое."
      />

      <Card className="p-0">
        <ul className="divide-y divide-border">
          {memberships.map((m) => {
            const active = m.merchantId === merchantId;
            return (
              <li key={m.merchantId} className="flex items-center gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-flame/10 text-flame-ink">
                  <Icon icon={Store02Icon} size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg font-bold">{m.merchantName ?? "Заведение"}</div>
                  <div className="text-sm text-muted-foreground">{roleLabel(m.role)}</div>
                </div>
                {active ? (
                  <Badge tone="good">
                    <Icon icon={CheckmarkCircle02Icon} size={16} />
                    Активно
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => switchTo(m.merchantId)}>
                    Перейти
                    <Icon icon={ArrowRight01Icon} size={18} />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      {canManage && (
        <Link
          to="/stores/new"
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-4 text-base font-semibold text-flame-ink transition-colors hover:border-flame/40"
        >
          <Icon icon={Add01Icon} size={20} />
          Открыть новое заведение
        </Link>
      )}
    </section>
  );
}
