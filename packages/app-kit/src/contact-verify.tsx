import { ApiError, toPhoneDigits, type ContactKind } from "@loal/api";
import { Field } from "@loal/ui/field";
import { Button, OtpInput, PhoneInput, Spinner, TextInput } from "@loal/ui/inputs";
import { Dialog, DialogContent } from "@loal/ui/shadcn";
import { useState } from "react";
import { loginErrorText, useCooldown } from "./login-form";
import { OtpChannelPicker, otpSentText, useOtpChannel } from "./otp-channel";
import { useOtpChannels, useProfile, useRequestContactCode, useVerifyContact } from "./session";

function contactErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "CONTACT_TAKEN") return "Этот номер или почта уже принадлежат другому аккаунту — укажите другой.";
    if (error.code === "EMAIL_UNAVAILABLE") return "Письмо сейчас не отправить — подтвердите номер телефона.";
  }
  return loginErrorText(error);
}

const tabClass = (active: boolean) =>
  `rounded-full px-4 py-2 text-base transition-colors ${active ? "bg-graphite text-paper" : "text-slate hover:text-graphite"}`;

/**
 * Подтверждение номера или почты кодом: текущих или новых. Номер — код в WhatsApp или Telegram,
 * почта — письмом (если на сервере включена). Новый контакт заменяет прежний.
 */
function ContactVerifyForm({ onDone }: { onDone: () => void }) {
  const profile = useProfile();
  const channels = useOtpChannels();
  const { channel, choose, telegramAvailable } = useOtpChannel();
  const requestCode = useRequestContactCode();
  const verify = useVerifyContact();
  const cooldown = useCooldown();
  const [kind, setKind] = useState<ContactKind>("phone");
  const [phone, setPhone] = useState(profile.data?.phone ?? "");
  const [email, setEmail] = useState(profile.data?.email ?? "");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const value = kind === "phone" ? (toPhoneDigits(phone) ?? "") : email.trim();
  const busy = requestCode.isPending || verify.isPending;

  const send = async () => {
    setError(null);
    setStatus(null);
    if (kind === "phone" && !value) return setError("Проверьте номер: не хватает цифр или неверный код страны");
    if (kind === "email" && !/^\S+@\S+\.\S+$/.test(value)) return setError("Похоже, в почте опечатка");
    try {
      await requestCode.mutateAsync({ kind, value, ...(kind === "phone" ? { channel } : {}) });
      setSentTo(value);
      setCode("");
      cooldown.start();
      setStatus(kind === "phone" ? otpSentText(channel) : "Код отправлен на почту — проверьте и папку «Спам»");
    } catch (cause) {
      setError(contactErrorText(cause));
    }
  };

  const confirm = async (entered = code) => {
    if (!sentTo || entered.length !== 6) return;
    setError(null);
    try {
      await verify.mutateAsync({ kind, value: sentTo, code: entered });
      onDone();
    } catch (cause) {
      setCode("");
      setError(contactErrorText(cause));
    }
  };

  const switchKind = (next: ContactKind) => {
    setKind(next);
    setSentTo(null);
    setCode("");
    setError(null);
    setStatus(null);
  };

  return (
    <div className="flex flex-col gap-5">
      {channels.email && (
        <div className="flex gap-1" role="tablist" aria-label="Что подтвердить">
          <button type="button" role="tab" aria-selected={kind === "phone"} className={tabClass(kind === "phone")} onClick={() => switchKind("phone")}>
            Номер телефона
          </button>
          <button type="button" role="tab" aria-selected={kind === "email"} className={tabClass(kind === "email")} onClick={() => switchKind("email")}>
            Почта
          </button>
        </div>
      )}

      {kind === "phone" ? (
        <>
          <Field label="Номер телефона" hint="Текущий или новый — новый станет вашим логином">
            {(parts) => (
              <PhoneInput
                {...parts}
                value={phone}
                onValueChange={(next) => {
                  setPhone(next);
                  setSentTo(null);
                }}
                disabled={busy}
              />
            )}
          </Field>
          <OtpChannelPicker channel={channel} onChange={choose} available={telegramAvailable} disabled={busy} />
        </>
      ) : (
        <Field label="Почта" hint="Текущая или новая">
          {(parts) => (
            <TextInput
              {...parts}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setSentTo(null);
              }}
              disabled={busy}
            />
          )}
        </Field>
      )}

      {sentTo && (
        <Field label="Код из сообщения">
          {(parts) => (
            <OtpInput
              {...parts}
              value={code}
              onValueChange={setCode}
              onComplete={(entered) => void confirm(entered)}
              autoFocus
              disabled={busy}
            />
          )}
        </Field>
      )}

      {error ? (
        <p role="alert" className="text-base font-medium text-flame-ink">
          {error}
        </p>
      ) : (
        status && (
          <p role="status" className="text-base text-slate">
            {status}
          </p>
        )
      )}

      {sentTo ? (
        <div className="flex flex-col gap-3">
          <Button type="button" onClick={() => void confirm()} disabled={busy || code.length !== 6}>
            {verify.isPending ? <Spinner /> : "Подтвердить"}
          </Button>
          <button
            type="button"
            disabled={busy || cooldown.left > 0}
            onClick={() => void send()}
            className="self-start text-base text-slate underline-offset-4 hover:underline disabled:no-underline disabled:opacity-60"
          >
            {cooldown.left > 0 ? `Прислать код снова через ${cooldown.left} с` : "Прислать код снова"}
          </button>
        </div>
      ) : (
        <Button type="button" onClick={() => void send()} disabled={busy || cooldown.left > 0}>
          {requestCode.isPending ? <Spinner /> : cooldown.left > 0 ? `Новый код через ${cooldown.left} с` : "Получить код"}
        </Button>
      )}
    </div>
  );
}

/**
 * Полоса сверху кабинета, пока ни номер, ни почта не подтверждены кодом (например, у владельца,
 * которого завело агентство с временным паролем). Нажал — диалог с подтверждением.
 */
export function ContactVerifyBanner() {
  const profile = useProfile();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const data = profile.data;
  // Старый шлюз без полей — ничего не просим
  const needed = data && data.phoneVerified === false && data.emailVerified === false;

  if (done)
    return (
      <p role="status" className="mb-6 rounded-2xl bg-secondary/40 px-4 py-3 text-base font-medium">
        Готово — контакт подтверждён.
      </p>
    );
  if (!needed) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-6 flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary/10 px-4 py-3 text-left text-base transition-colors hover:bg-primary/15"
      >
        <span>
          <span className="font-bold">Подтвердите свою почту или номер телефона</span>
          <span className="block text-sm text-muted-foreground">
            Так вы сможете восстановить вход и получать важные сообщения о заведении.
          </span>
        </span>
        <span className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white">Подтвердить</span>
      </button>
      <DialogContent
        title="Подтвердите контакт"
        description="Пришлём код на ваш номер или почту. Можно указать новый — он заменит прежний."
      >
        <ContactVerifyForm
          onDone={() => {
            setOpen(false);
            setDone(true);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
