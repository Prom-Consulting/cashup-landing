import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { Button, Icon, Input, Label } from "@loal/ui/shadcn";
import { useState } from "react";
import { useNavigate } from "react-router";
import { SITE_URL } from "../../shared/config/env";

/**
 * Обычно держатель карты приходит по прямой ссылке. Эта страница — для случая,
 * когда ссылку потеряли: по номеру с карты открываем ту же самую карту.
 */
export function HomePage() {
  const [serial, setSerial] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-[420px]">
      <h1 className="display text-[clamp(2rem,8vw,2.75rem)] leading-[1.05]">
        Карта Loal
        <br />в браузере
      </h1>
      <p className="mt-4 text-lg leading-snug text-muted-foreground">
        Откройте ссылку из сообщения — увидите баланс и QR для кассы. Если ссылка потерялась, введите номер карты: он
        напечатан под QR-кодом.
      </p>

      <form
        className="mt-8 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = serial.trim();
          if (!trimmed) {
            setError("Введите номер карты");
            return;
          }
          navigate(`/c/${encodeURIComponent(trimmed)}`);
        }}
      >
        <div>
          <Label htmlFor="serial">Номер карты</Label>
          <Input
            id="serial"
            value={serial}
            onChange={(event) => {
              setSerial(event.target.value);
              setError(null);
            }}
            placeholder="LOAL-0001-7788"
            autoComplete="off"
            aria-invalid={Boolean(error)}
            className="mt-2 tabular-nums"
          />
          {error && (
            <p role="alert" className="mt-2 text-base text-destructive">
              {error}
            </p>
          )}
        </div>
        <Button type="submit" size="lg">
          Открыть карту
          <Icon icon={ArrowRight02Icon} />
        </Button>
      </form>

      {/* Показываем, как выглядит карта, чтобы человек узнал её в Wallet */}
      <div className="mt-12">
        <p className="text-base text-muted-foreground">Карта выглядит так</p>
        <div className="receipt mt-3 bg-graphite px-6 pt-6 pb-8 text-white">
          <p className="font-brand text-xl font-bold">Loal</p>
          <p className="mt-6 text-base text-slate-soft">Баланс бонусов</p>
          <p className="display text-[2.75rem] leading-none tabular-nums text-amber">100 000</p>
          <p className="mt-1 text-base text-slate-soft">сом, потратить у партнёров</p>
        </div>
      </div>

      <p className="mt-10 text-base text-muted-foreground">
        Ещё нет карты?{" "}
        <a href={SITE_URL} className="text-destructive underline underline-offset-4">
          Оформить подписку на loal.kg
        </a>
      </p>
    </div>
  );
}
