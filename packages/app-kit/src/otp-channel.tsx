import { ApiError, OTP_CHANNEL_LABELS, OTP_CHANNELS, type OtpChannel } from "@loal/api";
import { useId, useState } from "react";
import { useOtpChannelsQuery } from "./session";

const STORAGE_KEY = "loal.otp-channel";

function readStored(): OtpChannel | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "telegram" || value === "whatsapp" ? value : null;
  } catch {
    return null;
  }
}

/**
 * Куда прислать код. Выбор помнится на устройстве: кто однажды выбрал Telegram, получит
 * его и в следующий раз. Если Telegram на сервере выключен — всегда WhatsApp.
 */
export function useOtpChannel() {
  const query = useOtpChannelsQuery();
  const channels = query.data;
  const [chosen, setChosen] = useState<OtpChannel | null>(readStored);
  const channel: OtpChannel = chosen === "telegram" && channels?.telegram ? "telegram" : "whatsapp";
  const choose = (next: OtpChannel) => {
    setChosen(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Приватный режим: выбор просто не запомнится
    }
  };
  return { channel, choose, telegramAvailable: channels?.telegram === true, telegramChecking: query.isPending && query.isFetching, telegramCheckFailed: query.isError };
}

/**
 * «WhatsApp» / «Telegram» — выбор виден всегда. Пока Telegram на сервере не включён, его кнопка
 * неактивна с пометкой: человек видит, что такой способ есть.
 */
export function OtpChannelPicker({
  channel,
  onChange,
  available,
  checking = false,
  checkFailed = false,
  disabled,
}: {
  channel: OtpChannel;
  onChange: (channel: OtpChannel) => void;
  available: boolean;
  checking?: boolean;
  checkFailed?: boolean;
  disabled?: boolean;
}) {
  const labelId = useId();
  const hintId = useId();
  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-base text-muted-foreground">
        Куда прислать код
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="grid grid-cols-2 gap-1 rounded-full bg-cream p-1">
        {OTP_CHANNELS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={channel === option}
            aria-describedby={option === "telegram" && !available ? hintId : undefined}
            disabled={disabled || (option === "telegram" && !available)}
            onClick={() => onChange(option)}
            className={`rounded-full px-4 py-2.5 text-base font-semibold transition-colors disabled:opacity-60 ${
              channel === option ? "bg-graphite text-paper" : "text-slate hover:text-graphite"
            }`}
          >
            {OTP_CHANNEL_LABELS[option]}
          </button>
        ))}
      </div>
      {!available && (
        <span id={hintId} className="text-sm text-muted-foreground">
          {checking ? "Проверяем доступность Telegram…" : checkFailed
            ? "Не удалось проверить Telegram. Обновите страницу или используйте WhatsApp."
            : "Telegram сейчас отключён — получите код в WhatsApp."}
        </span>
      )}
    </div>
  );
}

export const otpSentText = (channel: OtpChannel, again = false) =>
  channel === "telegram"
    ? `Код ${again ? "отправлен повторно" : "отправлен"} в Telegram — личным сообщением от Loal`
    : `Код ${again ? "отправлен повторно" : "отправлен"} в WhatsApp`;

/** Ошибки канала кода, общие для всех форм; null — не про код, пусть форма скажет своё. */
export function otpChannelErrorText(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code === "OTP_DELIVERY_FAILED")
    return error.message || "Telegram не доставил код. Выберите WhatsApp и запросите код снова.";
  if (error.code === "OTP_CHANNEL_UNAVAILABLE") return "Код в Telegram сейчас недоступен — выберите WhatsApp.";
  return null;
}
