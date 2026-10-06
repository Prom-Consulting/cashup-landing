"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Field } from "@loal/ui/field";
import { Button, ChoiceCards, OtpInput, PhoneInput, Spinner, Textarea, TextInput, formatPhone } from "@loal/ui/inputs";
import { Select } from "@loal/ui/select";
import { z } from "zod";
import dynamic from "next/dynamic";
import { StorefrontImages } from "./storefront-images";
import type { Point } from "./location-picker";
import { toPhoneDigits, coordsFrom2gis, merchantProfileFormSchema } from "@loal/api";
import { categories } from "../_data/categories";
import { API_URL, EMAIL, PARTNER_APP_URL, PHONE, PHONE_HREF } from "../_data/site";

gsap.registerPlugin(useGSAP);

// Карта тяжёлая — грузим её только в браузере и только когда до неё дошли
const LocationPicker = dynamic(() => import("./location-picker"), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse rounded-2xl bg-cream sm:h-[340px]" />,
});

const plans = [
  { id: "loyalty", label: "Только лояльность", note: "бесплатно на старте" },
  { id: "bundle", label: "OctōPAY + лояльность", note: "без абонентской платы" },
  { id: "octopay", label: "Только OctōPAY", note: "комиссия с оборота" },
] as const;
const PLAN_LABEL: Record<PlanId, string> = { loyalty: plans[0].label, bundle: plans[1].label, octopay: plans[2].label };

type PlanId = (typeof plans)[number]["id"];
type FieldName = "name" | "category" | "contact" | "phone" | "comment" | "description" | "address" | "instagramUrl" | "twogisUrl";

const empty = { name: "", category: "", contact: "", phone: "", comment: "", description: "", address: "", instagramUrl: "", twogisUrl: "" };
type Values = typeof empty;

// Проверки полей — те же пределы, что у сервера. Возвращают текст ошибки или пустую строку.
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
    if (!phone.trim()) return "Укажите телефон — он станет логином";
    return toPhoneDigits(phone) ? "" : "Проверьте номер: не хватает цифр или неверный код страны";
  },
  description: ({ description }) => description.trim().length > 2000 ? "Не длиннее 2000 символов" : "",
  address: ({ address }) => address.trim().length > 200 ? "Не длиннее 200 символов" : "",
  instagramUrl: ({ instagramUrl }) => {
    const result = merchantProfileFormSchema.shape.instagramUrl.safeParse(instagramUrl);
    return result.success ? "" : result.error.issues[0]?.message ?? "Проверьте ссылку";
  },
  twogisUrl: ({ twogisUrl }) => {
    const result = merchantProfileFormSchema.shape.twogisUrl.safeParse(twogisUrl);
    return result.success ? "" : result.error.issues[0]?.message ?? "Проверьте ссылку";
  },
  comment: ({ comment }) => (comment.length > 500 ? "Не длиннее 500 символов" : ""),
};
const order: FieldName[] = ["name", "category", "contact", "phone", "description", "address", "instagramUrl", "twogisUrl", "comment"];

const resultSchema = z.object({
  id: z.string().uuid(),
  plan: z.enum(["loyalty", "bundle", "octopay"]),
  state: z.enum(["processing", "pending_payment", "ready", "action_required"]),
  requiresOctopayPassword: z.boolean().optional(),
  verificationStatus: z.enum(["pending", "verified"]).nullable().optional(),
  amount: z.number(),
  currency: z.literal("KGS"),
  paymentUrl: z.string().url().nullable(),
  partnerUrl: z.string().url().nullable(),
  octopayUrl: z.string().url().nullable(),
});
type Registration = z.infer<typeof resultSchema>;

class FormError extends Error {}
class PhoneExpired extends FormError {}

async function call(path: string, body?: unknown, token?: string) {
  const response = await fetch(`${API_URL.replace(/\/$/, "")}${path}`, {
    method: body === undefined ? "GET" : "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (response.status === 401) throw new PhoneExpired("Код не подошёл или подтверждение устарело. Запросите новый код.");
  if (response.status === 409)
    throw new FormError("На этот номер уже есть заявка или аккаунт. Проверьте статус заявки или напишите нам.");
  if (response.status === 429) throw new FormError("Слишком много попыток. Подождите минуту и попробуйте снова.");
  if (response.status === 400) throw new FormError("Проверьте поля заявки: сервер не принял данные.");
  if (!response.ok) throw new FormError("Сервис временно недоступен. Попробуйте через минуту.");
  return response.json();
}

/**
 * Черновик живёт в sessionStorage: перезагрузка или возврат со страницы оплаты не теряют ни
 * данные, ни requestId (повтор с ним не создаст вторую заявку), ни подтверждение телефона
 * (токен регистрации действует 30 минут).
 */
const DRAFT_KEY = "loal.partner-onboarding";
const TOKEN_TTL = 29 * 60_000;
type Draft = { plan: PlanId; values: Values; requestId: string | null; token: string | null; tokenUntil: number; point?: Point | null };

function readDraft(): Partial<Draft> {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<Draft>) : {};
  } catch {
    return {};
  }
}
function writeDraft(draft: Draft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Без памяти форма просто не переживёт перезагрузку
  }
}

const money = new Intl.NumberFormat("ru-RU");

type Step = "details" | "code";

export function PartnerForm() {
  const [logo, setLogo] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  // Точка на карте: из клика, «Где я» или координат в ссылке 2ГИС
  const [point, setPoint] = useState<Point | null>(null);
  const uploaded = useRef(new Map<File, string>());
  const [uploadProgress, setUploadProgress] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [plan, setPlan] = useState<PlanId>("bundle");
  const [values, setValues] = useState<Values>(empty);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [step, setStep] = useState<Step>("details");
  const [recovering, setRecovering] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Registration | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [tokenUntil, setTokenUntil] = useState(0);
  const [resendAt, setResendAt] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(0);
  const requestId = useRef<string | null>(null);
  const restored = useRef(false);
  const root = useRef<HTMLDivElement>(null);

  // Тариф из ссылки (?plan=…) важнее черновика: человек только что нажал на карточку тарифа
  useEffect(() => {
    const draft = readDraft();
    if (draft.values) setValues({ ...empty, ...draft.values });
    if (draft.point && typeof draft.point.lat === "number" && typeof draft.point.lng === "number") setPoint(draft.point);
    if (draft.plan && plans.some((item) => item.id === draft.plan)) setPlan(draft.plan);
    requestId.current = draft.requestId ?? null;
    if (draft.token && (draft.tokenUntil ?? 0) > Date.now()) {
      setToken(draft.token);
      setTokenUntil(draft.tokenUntil ?? 0);
    }
    const selected = new URLSearchParams(window.location.search).get("plan");
    if (plans.some((item) => item.id === selected)) setPlan(selected as PlanId);
    restored.current = true;
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    writeDraft({ plan, values, requestId: requestId.current, token, tokenUntil, point });
  }, [plan, values, token, tokenUntil, sent, point]);

  // Вставили ссылку 2ГИС с координатами — сразу ставим по ним точку на карте
  // Перешли к проверке статуса — курсор сразу в телефон (поле появляется после отрисовки)
  useEffect(() => {
    if (!recovering) return;
    // Панель появляется анимацией и в начале скрыта — фокус ставим, когда она уже видна
    const timer = setTimeout(
      () => root.current?.querySelector<HTMLInputElement>('[data-field="phone"] input')?.focus({ preventScroll: true }),
      500,
    );
    return () => clearTimeout(timer);
  }, [recovering]);

  const lastLink = useRef("");
  useEffect(() => {
    if (values.twogisUrl === lastLink.current) return;
    lastLink.current = values.twogisUrl;
    const geo = coordsFrom2gis(values.twogisUrl);
    if (geo) setPoint({ lat: geo.lat, lng: geo.lng });
  }, [values.twogisUrl]);

  // Подтверждённый телефон после перезагрузки — сразу показываем заявку, если она есть
  useEffect(() => {
    if (!token || sent) return;
    let active = true;
    call("/v1/public/partner-onboarding", undefined, token)
      .then((data) => {
        const existing = resultSchema.nullable().parse(data);
        if (active && existing) setSent(existing);
      })
      .catch((error) => {
        if (active && error instanceof PhoneExpired) setToken(null);
      });
    return () => {
      active = false;
    };
    // Только при восстановлении токена; дальше заявку ведёт отправка и опрос
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const update = () => setResendSeconds(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [resendAt]);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const panel = root.current?.querySelector("[data-panel]");
      if (panel) gsap.from(panel, { y: 16, autoAlpha: 0, duration: 0.45, ease: "power3.out" });
    },
    { scope: root, dependencies: [step, sent?.state, recovering], revertOnUpdate: false },
  );

  // Изменили данные до создания заявки — это новая попытка: прежний requestId с другими полями сервер отклонит
  const freshAttempt = () => {
    if (!sent) requestId.current = null;
  };

  const set = (field: FieldName) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (field === "phone") {
      setToken(null);
      setOtp("");
    }
    freshAttempt();
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  };

  const check = (field: FieldName) => () => {
    const message = rules[field](values);
    setErrors((e) => ({ ...e, [field]: message || undefined }));
  };

  const focusFirst = (found: Partial<Record<FieldName, string>>) => {
    const firstBad = order.find((f) => found[f]);
    if (!firstBad) return false;
    const el = root.current?.querySelector<HTMLElement>(`[data-field="${firstBad}"] :is(input, textarea, button)`);
    el?.focus();
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    return true;
  };

  const validatePassword = () => {
    if (password.length < 8 || new TextEncoder().encode(password).length > 72) throw new FormError("Пароль OctoPay: от 8 символов, не более 72 байт.");
    if (password !== passwordConfirm) throw new FormError("Пароли не совпадают.");
  };
  const acceptResult = (result: Registration) => { setSent(result); setPassword(""); setPasswordConfirm(""); };
  const phoneDigits = () => toPhoneDigits(values.phone)!;

  const sendCode = async () => {
    await call("/auth/otp/request", { phone: phoneDigits() });
    setResendAt(Date.now() + 60_000);
    setOtp("");
  };

  const uploadImage = async (file: File, slot: "merchantLogo" | "merchantPhoto", proof: string) => {
    const saved = uploaded.current.get(file);
    if (saved) return saved;
    const body = new FormData(); body.append("file", file);
    const response = await fetch(`${API_URL.replace(/\/$/, "")}/v1/public/partner-onboarding/assets?slot=${slot}`, {
      method: "POST", headers: { Authorization: `Bearer ${proof}` }, body, signal: AbortSignal.timeout(60_000),
    });
    if (response.status === 401) throw new PhoneExpired("Подтвердите телефон ещё раз, чтобы загрузить фотографии.");
    if (response.status === 413) throw new FormError("Размер изображения не должен превышать 5 МБ.");
    if (response.status === 429) throw new FormError("Загрузка временно занята. Подождите минуту и повторите.");
    if (!response.ok) throw new FormError("Не удалось загрузить изображение. Повторите отправку или выберите другой PNG/JPG.");
    const { url } = z.object({ url: z.string().url() }).parse(await response.json());
    uploaded.current.set(file, url); return url;
  };
  const collectStorefront = async (proof: string) => {
    try {
      let logoUrl: string | null = null;
      const photoUrls: string[] = [];
      if (logo) { setUploadProgress("Загружаем логотип…"); logoUrl = await uploadImage(logo, "merchantLogo", proof); }
      for (let i = 0; i < photos.length; i++) {
        setUploadProgress(`Загружаем фото ${i + 1} из ${photos.length}…`);
        photoUrls.push(await uploadImage(photos[i], "merchantPhoto", proof));
      }
      // Точка, выбранная на карте, важнее координат из ссылки
      const geo = point ?? coordsFrom2gis(values.twogisUrl);
      return { description: values.description.trim() || null, address: values.address.trim() || null,
        instagramUrl: values.instagramUrl.trim() || null, twogisUrl: values.twogisUrl.trim() || null,
        logoUrl, photos: photoUrls, lat: geo?.lat ?? null, lng: geo?.lng ?? null };
    } finally { setUploadProgress(""); }
  };

  /** Телефон подтверждён — продолжаем существующую заявку или создаём новую. */
  const finish = async (proof: string) => {
    const existing = resultSchema.nullable().parse(await call("/v1/public/partner-onboarding", undefined, proof));
    if (existing) {
      if (existing.requiresOctopayPassword && password) {
        validatePassword();
        return acceptResult(resultSchema.parse(await call("/v1/public/partner-onboarding/password", { password }, proof)));
      }
      return acceptResult(existing);
    }
    if (recovering) {
      setRecovering(false);
      setStep("details");
      throw new FormError("Заявки на этот номер нет. Телефон подтверждён — заполните данные, и подключим.");
    }
    if (plan !== "loyalty") {
      try { validatePassword(); } catch (error) { setStep("details"); throw error; }
    }
    const storefront = plan !== "octopay" ? await collectStorefront(proof) : undefined;
    requestId.current ??= crypto.randomUUID();
    const result = await call(
      "/v1/public/partner-onboarding",
      {
        requestId: requestId.current,
        plan,
        name: values.name.trim(),
        contactName: values.contact.trim(),
        category: values.category,
        comment: values.comment.trim(),
        ...(storefront ? { storefront } : {}),
        ...(plan !== "loyalty" ? { password } : {}),
      },
      proof,
    );
    acceptResult(resultSchema.parse(result));
  };

  const run = async (action: () => Promise<unknown>) => {
    setSending(true);
    setFailed(null);
    try {
      await action();
    } catch (error) {
      if (error instanceof PhoneExpired) {
        setToken(null);
        setOtp("");
        if (sent) { setSent(null); setRecovering(true); setStep("details"); }
      }
      setFailed(error instanceof FormError ? error.message : "Не удалось связаться с сервером. Попробуйте ещё раз.");
    } finally {
      setSending(false);
    }
  };

  const submitDetails = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found: Partial<Record<FieldName, string>> = {};
    for (const field of recovering ? ["phone" as const] : order) {
      if (plan === "octopay" && ["description", "address", "instagramUrl", "twogisUrl"].includes(field)) continue;
      const message = rules[field](values);
      if (message) found[field] = message;
    }
    setErrors(found);
    if (focusFirst(found)) return;
    void run(async () => {
      if (!recovering && plan !== "loyalty") validatePassword();
      // Номер уже подтверждён в этой сессии — второй код не нужен
      if (token) return finish(token);
      await sendCode();
      setStep("code");
    });
  };

  const submitCode = (code: string) =>
    run(async () => {
      if (token && tokenUntil > Date.now()) return finish(token);
      if (!/^\d{6}$/.test(code)) throw new FormError("Введите 6 цифр из WhatsApp.");
      const verified = z
        .object({ token: z.string().min(1) })
        .parse(await call("/auth/partner-onboarding/verify", { phone: phoneDigits(), otp: code }));
      setToken(verified.token);
      setTokenUntil(Date.now() + TOKEN_TTL);
      await finish(verified.token);
    });

  // Опрос: ждём создания кабинетов и подтверждения оплаты бэкендом
  useEffect(() => {
    if (!token || !sent || (sent.state === "ready" && sent.verificationStatus !== "pending") || sent.state === "action_required") return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const next = resultSchema.nullable().parse(await call("/v1/public/partner-onboarding", undefined, token));
        if (active && next) {
          setSent(next);
          setFailed(null);
        }
      } catch (error) {
        if (!active) return;
        if (error instanceof PhoneExpired) {
          setToken(null);
          setSent(null);
          setOtp("");
          setRecovering(true);
          setStep("details");
          setFailed("Подтверждение телефона устарело. Подтвердите номер ещё раз, чтобы увидеть статус заявки.");
          return;
        }
        setFailed("Не удалось обновить статус — пробуем снова. Подключение идёт и без этой страницы.");
      }
      if (active) timer = setTimeout(poll, 5000);
    };
    timer = setTimeout(poll, 3000);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [token, sent?.state, sent?.verificationStatus]);

  const badCount = order.filter((f) => errors[f]).length;

  return (
    <div ref={root} className="min-w-0 scroll-mt-24 rounded-[32px] border-2 border-graphite bg-paper p-6 sm:p-10">
      <Progress current={sent ? (sent.state === "ready" ? 4 : 3) : step === "code" ? 2 : 1} />

      {sent ? (
        <>
          <Status sent={sent} failed={failed} phone={values.phone} />
          {sent.requiresOctopayPassword && <form className="mt-6 flex flex-col gap-4" onSubmit={e => { e.preventDefault(); void run(async () => {
            validatePassword();
            if (!token) throw new PhoneExpired("Подтвердите телефон ещё раз.");
            const result = resultSchema.parse(await call("/v1/public/partner-onboarding/password", { password }, token));
            acceptResult(result);
            if (result.state === "action_required") throw new FormError("Подключение не завершено. Попробуйте ещё раз через минуту или обратитесь в поддержку.");
          }); }}>
            <p>{sent.state === "action_required" ? "Задайте новый пароль OctoPay. После подтверждения номера он заменит старый пароль существующего аккаунта. Аккаунт и карта LOAL сохранятся." : "Для входа в OctoPay задайте пароль."}</p>
            <PasswordFields password={password} confirm={passwordConfirm} setPassword={setPassword} setConfirm={setPasswordConfirm} disabled={sending} />
            <Button type="submit" disabled={sending}>{sending ? "Подключаем…" : sent.state === "action_required" ? "Повторить подключение" : "Сохранить пароль OctoPay"}</Button>
          </form>}
        </>
      ) : step === "code" ? (
        <div data-panel className="mt-8 flex flex-col gap-6">
          <div>
            <h3 className="display text-[1.75rem] leading-tight">Код из WhatsApp</h3>
            <p className="mt-2 text-lg leading-snug">
              Отправили на <span className="font-bold whitespace-nowrap">{formatPhone(values.phone)}</span>. Этот номер
              станет логином в кабинет.
            </p>
          </div>

          {!recovering && (
            <div className="flex flex-col rounded-2xl bg-cream px-4 py-3 text-base">
              <span className="font-bold">{PLAN_LABEL[plan]}</span>
              <span className="min-w-0 truncate">{values.name.trim()}</span>
            </div>
          )}

          <Field label="Код" hint="6 цифр. Код действует 5 минут." error={undefined}>
            {(parts) => (
              <OtpInput
                {...parts}
                value={otp}
                onValueChange={setOtp}
                onComplete={(code) => void submitCode(code)}
                autoFocus
                disabled={sending}
              />
            )}
          </Field>

          {uploadProgress && <p role="status" className="text-sm">{uploadProgress}</p>}
          {failed && <Alert text={failed} />}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" disabled={sending || otp.length < 6} onClick={() => void submitCode(otp)} className="gap-3">
              {sending && <Spinner />}
              {sending ? "Проверяем…" : recovering ? "Показать заявку" : plan === "loyalty" ? "Перейти к оплате" : "Подключить"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={sending || resendSeconds > 0}
              onClick={() => void run(sendCode)}
            >
              {resendSeconds > 0 ? `Новый код через ${resendSeconds} с` : "Отправить код ещё раз"}
            </Button>
          </div>

          <button
            type="button"
            onClick={() => {
              setStep("details");
              setFailed(null);
              setOtp("");
            }}
            className="w-fit text-base text-flame-ink underline underline-offset-4"
          >
            ← Изменить данные или номер
          </button>
        </div>
      ) : (
        <form data-panel onSubmit={submitDetails} noValidate className="mt-8">
          <fieldset disabled={sending} className="flex min-w-0 flex-col gap-6">
            {recovering ? (
              <div>
                <h3 className="display text-[1.75rem] leading-tight">Статус заявки</h3>
                <p className="mt-2 text-lg leading-snug">
                  Укажите телефон из заявки — пришлём код и покажем, на каком она этапе.
                </p>
              </div>
            ) : (
              <ChoiceCards
                name="plan"
                legend="Тариф"
                value={plan}
                onChange={(next) => {
                  setPlan(next);
                  freshAttempt();
                }}
                options={[...plans]}
              />
            )}

            {!recovering && (
              <div className="grid gap-6 sm:grid-cols-2">
                <div data-field="name">
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

                <div data-field="category">
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

                <div data-field="contact">
                  <Field label="Как к вам обращаться" error={errors.contact}>
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
                  <Field label="Телефон" hint="Пришлём код в WhatsApp. Номер станет логином." error={errors.phone}>
                    {(parts) => (
                      <PhoneInput {...parts} value={values.phone} onValueChange={set("phone")} onBlur={check("phone")} />
                    )}
                  </Field>
                </div>
              </div>
            )}

            {!recovering && plan !== "octopay" && <section className="space-y-5 rounded-2xl border border-current/10 p-5" aria-labelledby="storefront-heading">
              <div><h2 id="storefront-heading" className="text-xl font-semibold">Витрина заведения</h2><p className="mt-2 text-sm opacity-75">Эти данные появятся в карточке заведения после проверки супер-админом. Их можно будет изменить в кабинете.</p></div>
              <div data-field="description"><Field label="Описание заведения" optional error={errors.description}>{parts => <Textarea {...parts} maxLength={2000} value={values.description} onValueChange={set("description")} onBlur={check("description")} placeholder="Расскажите о заведении, товарах или услугах" />}</Field></div>
              <div data-field="address"><Field label="Адрес" optional error={errors.address}>{parts => <TextInput {...parts} value={values.address} onChange={event => set("address")(event.target.value)} onBlur={check("address")} placeholder="Город, улица, дом" />}</Field></div>
              <div data-field="twogisUrl"><Field label="Ссылка на 2ГИС" optional error={errors.twogisUrl} hint="Вставьте ссылку на заведение — если в ней есть координаты, точка на карте встанет сама.">{parts => <TextInput {...parts} value={values.twogisUrl} onChange={event => set("twogisUrl")(event.target.value)} onBlur={check("twogisUrl")} placeholder="https://2gis.kg/…" />}</Field></div>
              <div className="space-y-2">
                <p className="font-medium">
                  Точка на карте <span className="text-sm font-normal opacity-60">необязательно</span>
                </p>
                <LocationPicker
                  value={point}
                  disabled={sending}
                  onChange={(next) => {
                    setPoint(next);
                    freshAttempt();
                  }}
                />
              </div>
              <div data-field="instagramUrl"><Field label="Ссылка на Instagram" optional error={errors.instagramUrl}>{parts => <TextInput {...parts} value={values.instagramUrl} onChange={event => set("instagramUrl")(event.target.value)} onBlur={check("instagramUrl")} placeholder="https://www.instagram.com/…" />}</Field></div>
              <StorefrontImages logo={logo} photos={photos} disabled={sending} onLogo={file => { setLogo(file); freshAttempt(); }} onPhotos={files => { setPhotos(files); freshAttempt(); }} />
            </section>}

            {!recovering && plan !== "loyalty" && <PasswordFields password={password} confirm={passwordConfirm} setPassword={setPassword} setConfirm={setPasswordConfirm} disabled={sending} />}

            {recovering && (
              <div data-field="phone">
                <Field label="Телефон из заявки" error={errors.phone}>
                  {(parts) => (
                    <PhoneInput {...parts} value={values.phone} onValueChange={set("phone")} onBlur={check("phone")} />
                  )}
                </Field>
              </div>
            )}

            {!recovering && (
              <div data-field="comment">
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
            )}

            <p aria-live="polite" className="sr-only">
              {badCount > 0 ? `Не заполнено полей: ${badCount}` : ""}
            </p>

            {uploadProgress && <p role="status" className="text-sm">{uploadProgress}</p>}
            {failed && <Alert text={failed} />}

            <div className="flex flex-col gap-4">
              <Button type="submit" disabled={sending} className="w-full gap-3 sm:w-fit">
                {sending && <Spinner />}
                {sending ? "Отправляем код…" : token ? "Продолжить" : "Получить код в WhatsApp"}
              </Button>
              {!recovering && (
                <p className="max-w-[52ch] text-sm leading-relaxed opacity-75">
                  {plan === "loyalty"
                    ? "После кода — оплата первого месяца. Заведение в LOAL начнёт работу после проверки супер-админа."
                    : "После кода создадим аккаунты без оплаты. Для работы в LOAL нужна проверка супер-админа."}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  const next = !recovering;
                  setRecovering(next);
                  setErrors({});
                  setFailed(null);
                  // Форма меняет высоту — поднимаем её к началу, иначе человек остаётся под ней
                  requestAnimationFrame(() => root.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
                }}
                className="w-fit text-base text-flame-ink underline underline-offset-4"
              >
                {recovering ? "← Подать новую заявку" : "Уже подавали заявку? Проверить статус"}
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </div>
  );
}

/** Три шага подачи: где человек сейчас. */
function Progress({ current }: { current: 1 | 2 | 3 | 4 }) {
  const labels = ["Заявка", "Код", "Подключение"];
  return (
    <ol className="flex items-center gap-2 text-sm font-bold sm:gap-3" aria-label="Шаги подключения">
      {labels.map((label, index) => {
        const n = index + 1;
        const state = n < current ? "done" : n === current ? "now" : "next";
        return (
          <li key={label} className="flex min-w-0 items-center gap-2 sm:gap-3" aria-current={state === "now" ? "step" : undefined}>
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm ${
                state === "next" ? "border-2 border-smoke text-graphite/50" : "bg-flame-ink text-paper"
              }`}
            >
              {state === "done" ? "✓" : n}
            </span>
            {/* На телефоне подпись только у текущего шага — остальные кружками */}
            <span className={`truncate ${state === "next" ? "opacity-50" : ""} ${state === "now" ? "" : "hidden sm:inline"}`}>
              {label}
            </span>
            {n < labels.length && <span aria-hidden="true" className="h-0.5 w-4 shrink-0 bg-smoke sm:w-8" />}
          </li>
        );
      })}
    </ol>
  );
}

function Alert({ text }: { text: string }) {
  return (
    <p role="alert" className="rounded-2xl bg-cream px-4 py-3 text-base font-medium text-flame-ink">
      {text}{" "}
      <span className="font-normal text-graphite">
        Нужна помощь —{" "}
        <a href={`mailto:${EMAIL}`} className="underline underline-offset-4">
          {EMAIL}
        </a>
        .
      </span>
    </p>
  );
}

/** Этапы подключения: для лояльности есть оплата, для бесплатных тарифов — нет. */
function Status({ sent, failed, phone }: { sent: Registration; failed: string | null; phone: string }) {
  const paid = sent.plan === "loyalty";
  const stages = paid ? ["Заявка принята", "Оплата", "Кабинет готов"] : ["Заявка принята", "Создаём кабинеты", "Кабинеты готовы"];
  if (sent.plan !== "octopay") stages.push("Проверка супер-админа");
  const at =
    sent.state === "ready" ? 3 : sent.state === "pending_payment" ? 1 : sent.state === "processing" ? (paid ? 2 : 1) : 1;
  const amount = `${money.format(sent.amount)} сом`;
  // Оплачиваем только на странице OctōPAY: адрес из ответа сверяем, чужой не открываем
  const paymentUrl =
    sent.paymentUrl && new URL(sent.paymentUrl).origin === "https://payment.octopay.click" ? sent.paymentUrl : null;

  const title =
    sent.verificationStatus === "pending" ? "Заведение ожидает проверки" : sent.state === "ready"
      ? "Готово — можно входить"
      : sent.state === "pending_payment"
        ? `Оплатите первый месяц — ${amount}`
        : sent.state === "action_required"
          ? "Нужна помощь с подключением"
          : "Подключаем ваш бизнес";

  const text =
    sent.verificationStatus === "pending" ? "Кабинет создан. До проверки супер-админа заведение не показывается в каталоге LOAL и не принимает бонусы. Вы уже можете войти и проверить данные витрины." : sent.state === "ready"
      ? sent.plan === "octopay"
        ? "Аккаунт OctōPAY создан. Войдите по этому телефону и паролю, заданному в форме."
        : sent.plan === "bundle"
          ? "Кабинеты Loal и OctōPAY созданы и связаны. В LOAL вход по телефону и коду WhatsApp, в OctoPay — по телефону и вашему паролю."
          : "Кабинет Loal готов. Войдите по этому телефону и коду из WhatsApp."
      : sent.state === "pending_payment"
        ? "Оплата откроется в новой вкладке. Эта страница сама узнает, когда платёж пройдёт, — закрывать её не нужно."
        : sent.state === "action_required"
          ? sent.requiresOctopayPassword ? "Заявка сохранена. Укажите новый пароль OctoPay ниже — он заменит старый пароль аккаунта на подтверждённом номере. Если подключение не удаётся — свяжитесь с нами." : "Заявка сохранена, но автоматически подключить не получилось. Напишите или позвоните нам — закончим вручную."
          : "Заявка сохранена. Страница обновится сама, когда всё будет готово.";

  return (
    <div data-panel aria-live="polite" className="mt-8 flex flex-col gap-6">
      <div>
        <h3 className="display text-[clamp(1.6rem,3vw,2.1rem)] leading-tight text-flame">{title}</h3>
        <p className="mt-3 max-w-[52ch] text-lg leading-relaxed">{text}</p>
      </div>

      {sent.state !== "action_required" && (
        <ol className="flex flex-col gap-3">
          {stages.map((stage, index) => {
            const done = sent.verificationStatus === "pending" ? index < stages.length - 1 : index < at || sent.state === "ready";
            const now = !done && index === at;
            return (
              <li key={stage} className="flex items-center gap-3 text-base">
                <span
                  aria-hidden="true"
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                    done ? "bg-flame-ink text-paper" : now ? "border-2 border-flame-ink" : "border-2 border-smoke"
                  }`}
                >
                  {done ? "✓" : now ? <Spinner /> : null}
                </span>
                <span className={done || now ? "font-bold" : "opacity-50"}>{stage}</span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex flex-wrap gap-3">
        {sent.state === "pending_payment" && paymentUrl && (
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-flame px-7 py-4 text-lg font-bold text-white transition-colors hover:bg-flame-ink"
          >
            Оплатить {amount}
          </a>
        )}
        {sent.state === "ready" && sent.partnerUrl && (
          <a href={PARTNER_APP_URL} className="rounded-full bg-flame px-7 py-4 text-lg font-bold text-white transition-colors hover:bg-flame-ink">
            Войти в Loal
          </a>
        )}
        {sent.state === "ready" && sent.octopayUrl && !sent.requiresOctopayPassword && (
          <a
            href="https://octopay.click/auth/business"
            className="rounded-full bg-graphite px-7 py-4 text-lg font-bold text-white transition-opacity hover:opacity-85"
          >
            Войти в OctōPAY
          </a>
        )}
        {sent.state === "action_required" && (
          <a href={PHONE_HREF} className="rounded-full bg-graphite px-7 py-4 text-lg font-bold text-white">
            Позвонить {PHONE}
          </a>
        )}
      </div>

      {sent.state === "ready" && phone && (
        <p className="text-base">
          Логин: <span className="font-bold whitespace-nowrap">{formatPhone(phone)}</span>
        </p>
      )}
      {sent.state === "ready" && sent.plan !== "loyalty" && (
        <p className="rounded-2xl bg-cream px-4 py-3 text-base leading-relaxed">
          Абонентской платы нет — только комиссия с платежей. Чтобы принимать оплату, подключите банковский счёт в
          кабинете OctōPAY.
        </p>
      )}
      {sent.state === "pending_payment" && (
        <p className="text-sm opacity-75">
          Вернулись со страницы оплаты, а статус не сменился? Подождите минуту: платёж подтверждает банк.
        </p>
      )}
      {failed && <Alert text={failed} />}

      <p className="text-sm opacity-75">
        Поддержка:{" "}
        <a href={`mailto:${EMAIL}`} className="underline underline-offset-4">
          {EMAIL}
        </a>{" "}
        ·{" "}
        <a href={PHONE_HREF} className="underline underline-offset-4">
          {PHONE}
        </a>
      </p>
    </div>
  );
}

/** Поле пароля с «глазиком»: показать или скрыть набранное. */
function SecretInput({ parts, value, onChange, disabled, name, label }: {
  parts: { id: string; describedBy?: string; invalid: boolean };
  value: string; onChange: (value: string) => void; disabled: boolean; name: string; label: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <TextInput
        {...parts}
        name={name}
        type={shown ? "text" : "password"}
        autoComplete="new-password"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="pr-14"
      />
      <button
        type="button"
        onClick={() => setShown(!shown)}
        aria-label={shown ? `Скрыть ${label}` : `Показать ${label}`}
        aria-pressed={shown}
        className="absolute top-1/2 right-2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full opacity-70 transition-opacity hover:opacity-100"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {shown && <path d="M4 4l16 16" />}
        </svg>
      </button>
    </div>
  );
}

/** Пароль OctōPAY: глазик, живые подсказки — длина и совпадение видны до отправки. */
function PasswordFields({ password, confirm, setPassword, setConfirm, disabled }: {
  password: string; confirm: string; setPassword: (value: string) => void; setConfirm: (value: string) => void; disabled: boolean;
}) {
  const longEnough = password.length >= 8 && new TextEncoder().encode(password).length <= 72;
  const matches = confirm.length > 0 && password === confirm;
  const Check = ({ ok, children }: { ok: boolean; children: string }) => (
    <li className={`flex items-center gap-2 ${ok ? "text-graphite" : "opacity-60"}`}>
      <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold ${ok ? "bg-flame-ink text-paper" : "border-2 border-smoke"}`} aria-hidden="true">
        {ok ? "✓" : ""}
      </span>
      {children}
    </li>
  );
  return (
    <section className="space-y-4 rounded-2xl border border-current/10 p-5" aria-labelledby="octopay-password-heading">
      <div>
        <h2 id="octopay-password-heading" className="text-xl font-semibold">Пароль для OctōPAY</h2>
        <p className="mt-1 text-sm opacity-75">Уже есть OctōPAY на этот номер? После подтверждения номера этот пароль заменит старый. В Loal вход останется по коду из WhatsApp.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Пароль">
          {(parts) => <SecretInput parts={parts} name="octopay_password" label="пароль" value={password} onChange={setPassword} disabled={disabled} />}
        </Field>
        <Field label="Повторите пароль" error={confirm && !matches ? "Пароли не совпадают" : undefined}>
          {(parts) => <SecretInput parts={parts} name="octopay_password_confirmation" label="повтор пароля" value={confirm} onChange={setConfirm} disabled={disabled} />}
        </Field>
      </div>
      <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-live="polite">
        <Check ok={longEnough}>Не короче 8 символов</Check>
        <Check ok={matches}>Пароли совпадают</Check>
      </ul>
    </section>
  );
}
