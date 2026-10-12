import { ApiError, OTP_CHANNEL_LABELS, OTP_CHANNELS, type OtpChannel } from "@loal/api";
import { useId, useState } from "react";
import { useOtpChannels } from "./session";

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
  const channels = useOtpChannels();
  const [chosen, setChosen] = useState<OtpChannel | null>(readStored);
  const channel: OtpChannel = chosen === "telegram" && channels.telegram ? "telegram" : "whatsapp";
  const choose = (next: OtpChannel) => {
    setChosen(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Приватный режим: выбор просто не запомнится
    }
  };
  return { channel, choose, telegramAvailable: channels.telegram };
}

/** «WhatsApp» / «Telegram» — только когда выбор действительно есть. */
export function OtpChannelPicker({
  channel,
  onChange,
  available,
  disabled,
}: {
  channel: OtpChannel;
  onChange: (channel: OtpChannel) => void;
  available: boolean;
  disabled?: boolean;
}) {
  const labelId = useId();
  if (!available) return null;
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
            disabled={disabled}
            onClick={() => onChange(option)}
            className={`rounded-full px-4 py-2.5 text-base font-semibold transition-colors disabled:opacity-60 ${
              channel === option ? "bg-graphite text-paper" : "text-slate hover:text-graphite"
            }`}
          >
            {OTP_CHANNEL_LABELS[option]}
          </button>
        ))}
      </div>
    </div>
  );
}

export const otpSentText = (channel: OtpChannel, again = false) =>
  channel === "telegram"
    ? `Код ${again ? "отправлен повторно" : "отправлен"} в Telegram — сообщение «Verification code»`
    : `Код ${again ? "отправлен повторно" : "отправлен"} в WhatsApp`;

/** Ошибки канала кода, общие для всех форм; null — не про код, пусть форма скажет своё. */
export function otpChannelErrorText(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code === "OTP_DELIVERY_FAILED")
    return error.message || "Telegram не доставил код. Выберите WhatsApp и запросите код снова.";
  if (error.code === "OTP_CHANNEL_UNAVAILABLE") return "Код в Telegram сейчас недоступен — выберите WhatsApp.";
  return null;
}
