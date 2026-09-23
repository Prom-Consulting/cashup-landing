import { Button, TextInput } from "@loal/ui/inputs";
import { Field } from "@loal/ui/field";
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
      <p className="mt-3 text-lg text-slate">
        Откройте ссылку из сообщения или введите номер карты — он указан под QR-кодом в Apple Wallet.
      </p>

      <form
        className="mt-8 flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (trimmed) navigate(`/c/${encodeURIComponent(trimmed)}`);
        }}
      >
        <Field label="Номер карты">
          {(parts) => (
            <TextInput
              {...parts}
              value={serial}
              onChange={(event) => setSerial(event.target.value)}
              placeholder="LOAL-0001-7788"
              autoComplete="off"
            />
          )}
        </Field>
        <Button type="submit" disabled={!trimmed}>
          Открыть карту
        </Button>
      </form>

      <p className="mt-8 text-base text-slate">
        Ещё нет карты?{" "}
        <a href={SITE_URL} className="text-flame-ink underline underline-offset-4">
          Оформить подписку на loal.kg
        </a>
      </p>
    </div>
  );
}
