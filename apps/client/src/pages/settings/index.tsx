import { Logout01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useSession } from "@loal/app-kit";
import { formatPhone } from "@loal/ui/inputs";
import { Button, Card, ConfirmDialog, Icon, cn } from "@loal/ui/shadcn";
import { useNavigate } from "react-router";
import { useMyCard } from "../../entities/me/api";
import { BACKGROUNDS, useBackground } from "../../shared/lib/background";

/** Настройки держателя карты: кто вошёл, фон кабинета и выход. */
export function SettingsPage() {
  const { logout } = useSession();
  const navigate = useNavigate();
  const card = useMyCard();
  const [background, setBackground] = useBackground();
  const customer = card.data?.customer;
  const name = [customer?.firstName, customer?.lastName].filter(Boolean).join(" ");

  return (
    <section className="flex flex-col gap-5">
      <h1 className="display text-[2rem] leading-tight">Настройки</h1>

      <Card className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Вы вошли как</p>
        <p className="text-xl font-bold">{name || "Держатель карты Loal"}</p>
        {customer?.phone && (
          <p className="text-base text-muted-foreground tabular-nums">{formatPhone(customer.phone)}</p>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold">Фон</h2>
          <p className="text-sm text-muted-foreground">Запомнится на этом телефоне.</p>
        </div>
        <div role="radiogroup" aria-label="Фон кабинета" className="grid grid-cols-5 gap-2">
          {BACKGROUNDS.map((item) => {
            const active = item.id === background;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setBackground(item.id)}
                className="flex flex-col items-center gap-1.5 rounded-2xl p-1 outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span
                  className={cn(
                    "relative grid aspect-square w-full place-items-center rounded-2xl border-2 transition-colors",
                    active ? "border-primary" : "border-border",
                  )}
                  style={{ background: item.swatch }}
                >
                  {active && (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-white">
                      <Icon icon={Tick02Icon} size={14} />
                    </span>
                  )}
                </span>
                <span className={cn("text-xs", active ? "font-bold" : "text-muted-foreground")}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <ConfirmDialog
        trigger={
          <Button variant="outline" size="lg" className="w-full">
            <Icon icon={Logout01Icon} />
            Выйти
          </Button>
        }
        title="Выйти из кабинета?"
        description="Карта в Wallet останется и продолжит работать. Войти снова можно по номеру телефона."
        confirmLabel="Выйти"
        onConfirm={() => {
          logout();
          navigate("/login", { replace: true });
        }}
      />
    </section>
  );
}
