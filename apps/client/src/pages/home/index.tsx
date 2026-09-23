import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { Button, Icon, Input, Label } from "@loal/ui/shadcn";
import { Logo } from "@loal/ui/logo";
import { useState } from "react";
import { useNavigate } from "react-router";
import { SITE_URL } from "../../shared/config/env";

/**
 * Держатель карты обычно приходит по прямой ссылке. Эта страница — на случай,
 * когда ссылку потеряли: по номеру с карты открываем ту же страницу.
 */
export function HomePage() {
  const [serial, setSerial] = useState("");
  const navigate = useNavigate();
  const trimmed = serial.trim();

  return (
    <div className="mx-auto max-w-[460px]">
      <Logo size="lg" />
      <h1 className="display mt-6 text-[clamp(2rem,6vw,2.75rem)]">Ваша карта Loal</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Откройте ссылку из сообщения или введите номер карты — он указан под QR-кодом в Apple Wallet.
      </p>

      <form
        className="mt-8 flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (trimmed) navigate(`/c/${encodeURIComponent(trimmed)}`);
        }}
      >
        <div>
          <Label htmlFor="serial">Номер карты</Label>
          <Input
            id="serial"
            value={serial}
            onChange={(event) => setSerial(event.target.value)}
            placeholder="LOAL-0001-7788"
            autoComplete="off"
            className="mt-2"
          />
        </div>
        <Button type="submit" size="lg" disabled={!trimmed}>
          Открыть карту
          <Icon icon={ArrowRight02Icon} />
        </Button>
      </form>

      <p className="mt-8 text-base text-muted-foreground">
        Ещё нет карты?{" "}
        <a href={SITE_URL} className="text-destructive underline underline-offset-4">
          Оформить подписку на loal.kg
        </a>
      </p>
    </div>
  );
}
