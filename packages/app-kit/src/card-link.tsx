import { Copy01Icon, LinkSquare02Icon, Tick02Icon, WhatsappIcon } from "@hugeicons/core-free-icons";
import { Button, Icon } from "@loal/ui/shadcn";
import { useState } from "react";

/** Номер для wa.me: только цифры с кодом страны. 0553… и 553… становятся 996553…. */
export function whatsappNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 9) digits = `996${digits}`;
  return /^996\d{9}$/.test(digits) ? digits : null;
}

/**
 * Ссылка на карту держателя: страница, где он добавляет её в Apple или Google Wallet.
 * Показываем адрес целиком, копирование одной кнопкой и готовое сообщение в WhatsApp.
 */
export function CardLink({ url, phone, name }: { url: string; phone?: string | null; name?: string }) {
  const [copied, setCopied] = useState(false);
  const wa = whatsappNumber(phone);
  const text = `${name ? `${name}, ваша` : "Ваша"} карта Loal: ${url} — откройте ссылку на телефоне и добавьте карту в Wallet.`;

  return (
    <div className="flex flex-col gap-3">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="rounded-2xl bg-muted px-4 py-3 text-base break-all underline-offset-4 hover:underline"
      >
        {url}
      </a>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              setCopied(false);
            }
          }}
        >
          <Icon icon={copied ? Tick02Icon : Copy01Icon} />
          {copied ? "Скопировано" : "Скопировать ссылку"}
        </Button>
        {wa && (
          <Button asChild size="sm">
            <a href={`https://wa.me/${wa}?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
              <Icon icon={WhatsappIcon} />
              Отправить в WhatsApp
            </a>
          </Button>
        )}
        <Button asChild variant="ghost" size="sm">
          <a href={url} target="_blank" rel="noreferrer">
            <Icon icon={LinkSquare02Icon} />
            Открыть
          </a>
        </Button>
      </div>
    </div>
  );
}
