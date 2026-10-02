"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Field } from "@loal/ui/field";
import { Button, ChoiceCards, PhoneInput, Spinner, Textarea, TextInput } from "@loal/ui/inputs";
import { Select } from "@loal/ui/select";
import { z } from "zod";
import { toPhoneDigits } from "@loal/api";
import { categories } from "../_data/categories";
import { API_URL, EMAIL, PARTNER_APP_URL } from "../_data/site";

gsap.registerPlugin(useGSAP);

const plans = [
  { id: "loyalty", label: "Только лояльность", note: "8 750 сом / месяц · 100 $ × 87,5" },
  { id: "bundle", label: "OctōPAY + лояльность", note: "без абонентской платы" },
  { id: "octopay", label: "Только OctōPAY", note: "комиссия с оборота" },
] as const;

type PlanId = (typeof plans)[number]["id"];
type FieldName = "name" | "category" | "contact" | "phone" | "comment";

const empty = { name: "", category: "", contact: "", phone: "", comment: "" };
type Values = typeof empty;

// Проверки полей. Возвращают текст ошибки или пустую строку.
const rules: Record<FieldName, (v: Values) => string> = {
  name: ({ name }) => {
    const value = name.trim();
    if (!value) return "Напишите название заведения";
    if (value.length < 2) return "Слишком короткое название";
    if (value.length > 60) return "Не длиннее 60 символов";
    return "";
  },
  category: ({ category }) => (category ? "" : "Выберите категорию"),
  contact: ({ contact }) => {
    const value = contact.trim();
    if (!value) return "Как к вам обращаться?";
    if (value.length < 2) return "Слишком короткое имя";
    if (value.length > 120) return "Не длиннее 120 символов";
    if (!/^[\p{L}\s-]+$/u.test(value)) return "Только буквы, пробел и дефис";
    return "";
  },
  // Те же правила номера, что у бэкенда: код страны и проверка по стране
  phone: ({ phone }) => {
    if (!phone.trim()) return "Оставьте телефон для связи";
    return toPhoneDigits(phone) ? "" : "Проверьте номер: не хватает цифр или неверный код страны";
  },
  comment: ({ comment }) => (comment.length > 500 ? "Не длиннее 500 символов" : ""),
};

const order: FieldName[] = ["name", "category", "contact", "phone", "comment"];

const resultSchema = z.object({
  id: z.string().uuid(), plan: z.enum(["loyalty", "bundle", "octopay"]),
  state: z.enum(["processing", "pending_payment", "ready", "action_required"]),
  amount: z.number(), currency: z.literal("KGS"), paymentUrl: z.string().url().nullable(),
  partnerUrl: z.string().url().nullable(), octopayUrl: z.string().url().nullable(),
});
type Registration = z.infer<typeof resultSchema>;
class FormError extends Error {}
class PhoneExpired extends FormError {}
async function call(path: string, body?: unknown, token?: string) {
  const response = await fetch(`${API_URL.replace(/\/$/, "")}${path}`, {
    method: body === undefined ? "GET" : "POST", cache: "no-store",
    signal: AbortSignal.timeout(20_000),
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (response.status === 401) throw new PhoneExpired("Подтвердите номер ещё раз или проверьте код.");
  if (response.status === 409) throw new FormError("Заявка или аккаунт уже существует. Обратитесь в поддержку.");
  if (response.status === 429) throw new FormError("Слишком много попыток. Подождите минуту.");
  if (!response.ok) throw new FormError("Сервис временно недоступен. Попробуйте ещё раз.");
  return response.json();
}

export function PartnerForm() {
  const [plan, setPlan] = useState<PlanId>("bundle");
  const [values, setValues] = useState<Values>(empty);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Registration | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [otpRequested, setOtpRequested] = useState(false);
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [recovering, setRecovering] = useState(false);
  const requestId = useRef<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("plan");
    if (plans.some((item) => item.id === selected)) setPlan(selected as PlanId);
  }, []);

  useEffect(() => {
    const update = () => setResendSeconds(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [resendAt]);

  useGSAP(
    () => {
      if (!sent || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(root.current!.querySelector("[data-sent]"), { y: 24, autoAlpha: 0, duration: 0.6, ease: "power3.out" });
    },
    { scope: root, dependencies: [sent?.state], revertOnUpdate: false },
  );

  const set = (field: FieldName) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (field === "phone") { setOtpRequested(false); setOtp(""); setToken(null); }
    // Ошибку убираем сразу, как только человек начал править поле.
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  };

  const check = (field: FieldName) => () => {
    setValues((v) => {
      const message = rules[field](v);
      setErrors((e) => ({ ...e, [field]: message || undefined }));
      return v;
    });
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found: Partial<Record<FieldName, string>> = {};
    for (const field of recovering ? ["phone" as const] : order) {
      const message = rules[field](values);
      if (message) found[field] = message;
    }
    setErrors(found);

    const firstBad = order.find((f) => found[f]);
    if (firstBad) {
      const el = root.current?.querySelector<HTMLElement>(`[data-field="${firstBad}"] :is(input, textarea, button)`);
      el?.focus();
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    setSending(true);
    setFailed(null);
    try {
      const phone = toPhoneDigits(values.phone)!;
      if (!otpRequested && !token) {
        await call("/auth/otp/request", { phone });
        setOtpRequested(true);
        setResendAt(Date.now() + 60_000);
        return;
      }
      let proof = token;
      if (!proof) {
        if (!/^\d{6}$/.test(otp)) throw new FormError("Введите 6 цифр из WhatsApp.");
        const verified = z.object({ token: z.string().min(1) }).parse(await call("/auth/partner-onboarding/verify", { phone, otp }));
        proof = verified.token;
        setToken(proof);
      }
      // A new OTP can resume an existing request after reload or a lost response.
      const existing = resultSchema.nullable().parse(await call("/v1/public/partner-onboarding", undefined, proof));
      if (existing) { setSent(existing); return; }
      if (recovering) {
        setRecovering(false);
        throw new FormError("Заявка не найдена. Телефон подтверждён — заполните данные для подключения.");
      }
      requestId.current ??= crypto.randomUUID();
      const result = await call("/v1/public/partner-onboarding", {
        requestId: requestId.current, plan, name: values.name.trim(),
        contactName: values.contact.trim(), category: values.category, comment: values.comment.trim(),
      }, proof);
      setSent(resultSchema.parse(result));
    } catch (error) {
      if (error instanceof PhoneExpired) { setToken(null); }
      setFailed(error instanceof FormError ? error.message : "Не удалось подключиться. Попробуйте ещё раз.");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!token || !sent || sent.state === "ready" || sent.state === "action_required") return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const next = resultSchema.nullable().parse(await call("/v1/public/partner-onboarding", undefined, token));
        if (active && next) { setSent(next); setFailed(null); }
      } catch (error) {
        if (active) {
          setFailed("Не удалось обновить статус. Подключение продолжится автоматически.");
          if (error instanceof PhoneExpired) {
            setToken(null); setSent(null); setOtpRequested(false); setOtp(""); setRecovering(true);
            setFailed("Подтвердите телефон ещё раз, чтобы увидеть статус заявки.");
          }
        }
      }
      if (active) timer = setTimeout(poll, 5000);
    };
    timer = setTimeout(poll, 3000);
    return () => { active = false; clearTimeout(timer); };
  }, [token, sent?.state]);

  const badCount = order.filter((f) => errors[f]).length;

  if (sent) {
    const title = sent.state === "ready" ? "Подключение завершено" : sent.state === "pending_payment" ? "Оплатите первый месяц" : sent.state === "action_required" ? "Нужна помощь с подключением" : "Подключаем ваш бизнес";
    return <div ref={root} className="rounded-[32px] border-2 border-graphite bg-paper p-8 sm:p-12">
      <div data-sent aria-live="polite">
        <h2 className="display text-3xl text-flame">{title}</h2>
        <p className="mt-4 text-lg leading-relaxed">
          {sent.state === "ready" ? (sent.plan === "octopay" ? "Аккаунт OctoPay создан. Войдите по указанному телефону и коду из WhatsApp." : "Кабинет LOAL готов. Войдите по указанному телефону и коду из WhatsApp.") :
           sent.state === "pending_payment" ? "Только лояльность — 8 750 сом в месяц (100 $ по курсу 87,5 сом). После оплаты кабинет создастся автоматически." :
           sent.state === "action_required" ? "Заявка сохранена. Обратитесь в поддержку для завершения подключения." :
           "Заявка сохранена. Эта страница обновится автоматически, когда кабинеты будут готовы."}
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          {sent.state === "pending_payment" && sent.paymentUrl && new URL(sent.paymentUrl).origin === "https://payment.octopay.click" && <a href={sent.paymentUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-flame px-7 py-4 font-bold text-white">Оплатить 8 750 сом</a>}
          {sent.partnerUrl && <a href={PARTNER_APP_URL} className="rounded-full bg-flame px-7 py-4 font-bold text-white">Войти в LOAL</a>}
          {sent.octopayUrl && <a href="https://octopay.click/auth/loal" className="rounded-full bg-graphite px-7 py-4 font-bold text-white">Войти в OctoPay</a>}
        </div>
        {sent.state === "ready" && sent.plan !== "loyalty" && <p className="mt-5 text-sm">Абонентской платы нет. Комиссия взимается с платежей. Подключите банковский счёт в OctoPay, чтобы принимать оплату.</p>}
        {failed && <p role="alert" className="mt-4">{failed}</p>}
        <p className="mt-6 text-sm">Поддержка: <a href={`mailto:${EMAIL}`} className="underline">{EMAIL}</a></p>
      </div>
    </div>;
  }

  return (
    <div ref={root} className="rounded-[32px] border-2 border-graphite bg-paper p-6 sm:p-10">
      <form onSubmit={submit} noValidate>
        <fieldset disabled={sending} className="flex min-w-0 flex-col gap-6">
        <Button type="button" variant="outline" onClick={() => { setRecovering(!recovering); setErrors({}); setFailed(null); }}>
          {recovering ? "Создать новую заявку" : "Уже подавали заявку? Проверить статус"}
        </Button>
        {recovering && <p>Подтвердите телефон из заявки, чтобы продолжить подключение или оплату.</p>}
        <div hidden={recovering}>
        <ChoiceCards name="plan" legend="Что подключаем" value={plan} onChange={setPlan} options={[...plans]} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div data-field="name" hidden={recovering}>
            <Field label="Название заведения" error={errors.name}>
              {(parts) => (
                <TextInput
                  {...parts}
                  name="name"
                  placeholder="Dolce Vita"
                  maxLength={60}
                  value={values.name}
                  onChange={(e) => set("name")(e.target.value)}
                  onBlur={check("name")}
                />
              )}
            </Field>
          </div>

          <div data-field="category" hidden={recovering}>
            <Field label="Категория" error={errors.category}>
              {(parts) => (
                <Select
                  {...parts}
                  value={values.category}
                  onChange={set("category")}
                  onBlur={check("category")}
                  options={categories.map((c) => ({ id: c.id, label: c.label }))}
                  placeholder="Выберите категорию"
                />
              )}
            </Field>
          </div>

          <div data-field="contact" hidden={recovering}>
            <Field label="Контактное лицо" error={errors.contact}>
              {(parts) => (
                <TextInput
                  {...parts}
                  name="contact"
                  placeholder="Азамат"
                  autoComplete="name"
                  value={values.contact}
                  onChange={(e) => set("contact")(e.target.value)}
                  onBlur={check("contact")}
                />
              )}
            </Field>
          </div>

          <div data-field="phone">
            <Field label="Телефон" hint="Подтвердите номер кодом из WhatsApp — он будет вашим логином" error={errors.phone}>
              {(parts) => (
                <PhoneInput {...parts} value={values.phone} onValueChange={set("phone")} onBlur={check("phone")} />
              )}
            </Field>
          </div>
        </div>

        <div data-field="comment" hidden={recovering}>
          <Field label="Комментарий" optional error={errors.comment}>
            {(parts) => (
              <Textarea
                {...parts}
                value={values.comment}
                onValueChange={set("comment")}
                onBlur={check("comment")}
                placeholder="Сколько точек, какой процент планируете, когда удобно созвониться"
              />
            )}
          </Field>
        </div>

        {otpRequested && !token && <Field label="Код из WhatsApp" hint="6 цифр. Код действует 5 минут.">
          {(parts) => <TextInput {...parts} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} />}
        </Field>}
        {otpRequested && !token && <Button type="button" variant="outline" disabled={sending || resendSeconds > 0} onClick={async () => {
          if (Date.now() < resendAt) { setFailed("Повторная отправка доступна через минуту."); return; }
          setSending(true);
          try { await call("/auth/otp/request", { phone: toPhoneDigits(values.phone)! }); setResendAt(Date.now() + 60_000); setFailed(null); }
          catch { setFailed("Не удалось отправить код. Попробуйте позже."); }
          finally { setSending(false); }
        }}>{resendSeconds > 0 ? `Повторить через ${resendSeconds} с` : "Отправить код повторно"}</Button>}

        <p aria-live="polite" className="sr-only">
          {badCount > 0 ? `Не заполнено полей: ${badCount}` : ""}
        </p>

        {failed && (
          <p role="alert" className="text-base font-medium text-flame-ink">
            {failed}{" "}
            <a href={`mailto:${EMAIL}`} className="underline underline-offset-4">
              {EMAIL}
            </a>
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button type="submit" disabled={sending} className="gap-3">
            {sending && <Spinner />}
            {sending ? "Подождите…" : !otpRequested && !token ? "Подтвердить телефон" : recovering ? "Проверить статус" : plan === "loyalty" ? "Перейти к оплате" : "Подключить бесплатно"}
          </Button>
          <p className="max-w-[40ch] text-sm opacity-75">
            Для лояльности кабинет создаётся после оплаты. Бесплатные тарифы подключаются после подтверждения телефона.
          </p>
        </div>
        </fieldset>
      </form>
    </div>
  );
}
