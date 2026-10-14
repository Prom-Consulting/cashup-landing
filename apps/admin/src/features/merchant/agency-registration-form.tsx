import {
  ApiError,
  PARTNER_CATEGORIES,
  coordsFrom2gis,
  merchantCabinetApi,
  merchantProfileFormSchema,
  merchantsApi,
  toPhoneDigits,
  BUSINESS_TARIFF_LABELS,
  BUSINESS_TARIFFS,
  isBusinessTariff,
  type AgencyPlan,
  type AgencyRegistrationResult,
  type BusinessTariff,
} from "@loal/api";
import { useApi } from "@loal/app-kit";
import { Field } from "@loal/ui/field";
import { ChoiceCards, PhoneInput, Spinner, TextInput, Textarea, formatPhone } from "@loal/ui/inputs";
import { Button } from "@loal/ui/shadcn";
import type { Point } from "@loal/ui/location-picker";
import { Select } from "@loal/ui/select";
import { StorefrontImages } from "@loal/ui/storefront-images";
import { useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useRef, useState } from "react";
import { Link } from "react-router";
import { merchantKeys } from "../../entities/merchant/api";
import { tariffKeys, useLaunchOffer, useTariffs } from "../../entities/platform/api";

// Карта тяжёлая — грузим её, только когда открыли анкету
const LocationPicker = lazy(() => import("@loal/ui/location-picker"));

const money = new Intl.NumberFormat("ru-RU");

/** Выбор в анкете: три тарифа Loal (Доп. №5) или «Только OctōPAY» — аккаунт только в OctōPAY. */
type Choice = BusinessTariff | "octopay";

/** Подписи с живыми ценами и местами акции — как на лендинге. */
function useChoices(): { id: Choice; label: string; note: string }[] {
  const tariffs = useTariffs();
  const offer = useLaunchOffer();
  const price = (code: BusinessTariff) => tariffs.data?.find((t) => t.code === code)?.priceKgs;
  const note = (code: BusinessTariff) => {
    const kgs = price(code);
    const monthly = kgs === undefined ? "" : `${money.format(kgs)} сом/мес`;
    const free = offer.data && offer.data.tariffs.includes(code) && offer.data.months > 0 && offer.data.left > 0;
    return free ? `0 сом ${offer.data!.months} мес. (мест: ${offer.data!.left}), потом ${monthly}` : monthly;
  };
  return [
    ...BUSINESS_TARIFFS.map((code) => ({ id: code, label: BUSINESS_TARIFF_LABELS[code].title, note: note(code) })),
    { id: "octopay" as const, label: "Только OctōPAY", note: "без Loal, комиссия с оборота" },
  ];
}

type FieldName = "name" | "category" | "contact" | "phone" | "comment" | "description" | "address" | "instagramUrl" | "twogisUrl";
const empty = { name: "", category: "", contact: "", phone: "", comment: "", description: "", address: "", instagramUrl: "", twogisUrl: "" };
type Values = typeof empty;

// Те же правила, что у анкеты на лендинге и у сервера
const rules: Record<FieldName, (v: Values, plan: AgencyPlan) => string> = {
  name: ({ name }) => {
    const value = name.trim();
    if (!value) return "Напишите название заведения";
    if (value.length < 2) return "Слишком короткое название";
    return value.length > 60 ? "Не длиннее 60 символов" : "";
  },
  category: ({ category }) => (category ? "" : "Выберите категорию"),
  contact: ({ contact }) => {
    const value = contact.trim();
    if (!value) return "Как обращаться к владельцу?";
    if (value.length < 2) return "Слишком короткое имя";
    if (value.length > 120) return "Не длиннее 120 символов";
    return /^[\p{L}\s-]+$/u.test(value) ? "" : "Только буквы, пробел и дефис";
  },
  phone: ({ phone }) =>
    !phone.trim() ? "Укажите телефон — он станет логином" : toPhoneDigits(phone) ? "" : "Проверьте номер: не хватает цифр или неверный код страны",
  description: ({ description }) => (description.trim().length > 2000 ? "Не длиннее 2000 символов" : ""),
  address: ({ address }, plan) =>
    plan === "octopay" ? "" : !address.trim() ? "Укажите адрес — улицу и дом" : address.trim().length > 200 ? "Не длиннее 200 символов" : "",
  instagramUrl: ({ instagramUrl }) => {
    const result = merchantProfileFormSchema.shape.instagramUrl.safeParse(instagramUrl);
    return result.success ? "" : (result.error.issues[0]?.message ?? "Проверьте ссылку");
  },
  twogisUrl: ({ twogisUrl }, plan) => {
    if (plan === "octopay") return "";
    if (!twogisUrl.trim()) return "Вставьте ссылку на заведение в 2ГИС или нажмите на карту ниже";
    const result = merchantProfileFormSchema.shape.twogisUrl.safeParse(twogisUrl);
    return result.success ? "" : (result.error.issues[0]?.message ?? "Проверьте ссылку");
  },
  comment: ({ comment }) => (comment.length > 500 ? "Не длиннее 500 символов" : ""),
};
const order: FieldName[] = ["name", "category", "contact", "phone", "description", "address", "twogisUrl", "instagramUrl", "comment"];

/** Ссылка 2ГИС на точку: так же, как на лендинге — координаты из неё читает каталог. */
const twogisPointLink = ({ lat, lng }: Point) => `https://2gis.kg/bishkek?m=${lng.toFixed(6)}%2C${lat.toFixed(6)}%2F18`;

function errorText(error: unknown): { phone?: string; general?: string } {
  if (error instanceof ApiError) {
    if (error.code === "PHONE_HAS_ACTIVE_MERCHANT")
      return { phone: "Этот номер уже работает в заведении Loal — владельцем или сотрудником. Укажите другой." };
    if (error.code === "APPLICATION_IN_PROGRESS")
      return { phone: "По этому номеру уже есть заявка с другими данными — найдите её в списке заведений." };
    if (error.code === "APPLICATION_EXISTS") return { phone: "На этот номер уже есть заявка на OctōPAY." };
    if (error.status === 409) return { phone: "На этот номер уже есть заявка или аккаунт." };
    if (error.status === 400) return { general: "Сервер не принял анкету — проверьте поля." };
    return { general: error.message };
  }
  return { general: "Не удалось создать заведение. Попробуйте ещё раз." };
}

/**
 * Новое заведение анкетой агентства — те же поля, что в заявке на loal.kg, но без кода: номер
 * подтверждает агентство. Заведение сразу работает, владелец получает в WhatsApp логин и временный
 * пароль; при входе кабинет попросит свой пароль и подтвердить номер или почту.
 */
export function AgencyRegistrationForm({ onClose }: { onClose?: () => void }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const choices = useChoices();
  const [choice, setChoice] = useState<Choice>("redeem");
  const plan: AgencyPlan = choice === "octopay" ? "octopay" : "loyalty";
  const [values, setValues] = useState<Values>(empty);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [point, setPoint] = useState<Point | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState("");
  const [failed, setFailed] = useState<string | null>(null);
  const [created, setCreated] = useState<(AgencyRegistrationResult & { phone: string; name: string; storefrontError?: string }) | null>(null);
  // Тот же requestId при повторе после сбоя — сервер не создаст второе заведение
  const requestId = useRef<string | null>(null);
  const autoLink = useRef("");
  const root = useRef<HTMLDivElement>(null);

  const set = (field: FieldName) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    requestId.current = null;
  };
  const check = (field: FieldName) => () => setErrors((current) => ({ ...current, [field]: rules[field](values, plan) || undefined }));

  // Точка на карте заполняет ссылку 2ГИС, пока её не вставили руками
  const pickPoint = (next: Point | null) => {
    setPoint(next);
    setValues((current) => {
      if (current.twogisUrl.trim() && current.twogisUrl !== autoLink.current) return current;
      const link = next ? twogisPointLink(next) : "";
      autoLink.current = link;
      return { ...current, twogisUrl: link };
    });
    setErrors((current) => ({ ...current, twogisUrl: undefined }));
  };

  const reset = () => {
    setValues(empty);
    setErrors({});
    setPoint(null);
    setLogo(null);
    setPhotos([]);
    setFailed(null);
    setCreated(null);
    requestId.current = null;
    autoLink.current = "";
  };

  const submit = async () => {
    const found: Partial<Record<FieldName, string>> = {};
    for (const field of order) {
      const message = rules[field](values, plan);
      if (message) found[field] = message;
    }
    setErrors(found);
    setFailed(null);
    const first = order.find((field) => found[field]);
    if (first) {
      root.current?.querySelector<HTMLElement>(`[data-field="${first}"] :is(input, textarea, button)`)?.focus();
      return;
    }
    const phone = toPhoneDigits(values.phone)!;
    const geo = point ?? coordsFrom2gis(values.twogisUrl);
    const category = PARTNER_CATEGORIES.find((item) => item.id === values.category);
    const storefront =
      plan === "octopay"
        ? undefined
        : {
            description: values.description.trim() || null,
            address: values.address.trim() || null,
            instagramUrl: values.instagramUrl.trim() || null,
            twogisUrl: values.twogisUrl.trim() || null,
            logoUrl: null,
            photos: [],
            lat: geo?.lat ?? null,
            lng: geo?.lng ?? null,
          };
    setSending(true);
    try {
      requestId.current ??= crypto.randomUUID();
      setProgress("Создаём заведение и отправляем доступ в WhatsApp…");
      const result = await merchantsApi(api).register({
        phone,
        requestId: requestId.current,
        plan,
        ...(isBusinessTariff(choice) ? { tariff: choice } : {}),
        name: values.name.trim(),
        contactName: values.contact.trim(),
        category: values.category,
        comment: values.comment.trim(),
        ...(storefront ? { storefront } : {}),
      });
      // Логотип и фото грузятся уже в созданное заведение, затем витрина сохраняется целиком
      let storefrontError: string | undefined;
      if (result.merchantId && storefront && (logo || photos.length > 0)) {
        try {
          const cabinet = merchantCabinetApi(api);
          setProgress("Загружаем логотип и фото…");
          const logoUrl = logo ? (await cabinet.uploadAsset(result.merchantId, "merchantLogo", logo)).url : null;
          const photoUrls: string[] = [];
          for (const [index, photo] of photos.entries()) {
            setProgress(`Загружаем фото ${index + 1} из ${photos.length}…`);
            photoUrls.push((await cabinet.uploadAsset(result.merchantId, "merchantPhoto", photo)).url);
          }
          await cabinet.saveProfile(result.merchantId, {
            ...storefront,
            category: category?.label ?? null,
            logoUrl,
            photos: photoUrls,
          });
        } catch (error) {
          storefrontError = error instanceof Error ? error.message : "Логотип и фото не сохранились";
        }
      }
      void queryClient.invalidateQueries({ queryKey: merchantKeys.all });
      // Место по акции могло уйти этому заведению
      void queryClient.invalidateQueries({ queryKey: tariffKeys.launchOffer });
      setCreated({ ...result, phone, name: values.name.trim(), storefrontError });
      root.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    } catch (error) {
      const text = errorText(error);
      if (text.phone) setErrors((current) => ({ ...current, phone: text.phone }));
      setFailed(text.general ?? null);
    } finally {
      setSending(false);
      setProgress("");
    }
  };

  if (created) {
    return (
      <div ref={root} className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">«{created.name}» подключено</h2>
        {created.ownerNotified ? (
          <p className="text-base">
            Логин и временный пароль отправлены в WhatsApp на <span className="font-semibold">{formatPhone(created.phone)}</span>
            {created.plan === "bundle" ? " — один и тот же для Loal и OctōPAY." : "."} При входе кабинет попросит свой пароль и
            подтвердить номер или почту.
          </p>
        ) : (
          <p role="alert" className="rounded-2xl bg-primary/10 px-4 py-3 text-base">
            Заведение создано, но WhatsApp не доставил сообщение с паролем. Отправьте его снова на экране{" "}
            <Link to="/business-passwords" className="font-semibold underline underline-offset-4">
              «Пароли партнёров»
            </Link>
            .
          </p>
        )}
        {isBusinessTariff(created.tariff) && (
          <p className="text-base">
            Тариф «{BUSINESS_TARIFF_LABELS[created.tariff].title}»
            {created.freeMonths ? `: ${created.freeMonths} мес. бесплатно по акции первых мест.` : "."}
          </p>
        )}
        {created.state !== "ready" && (
          <p className="text-base text-muted-foreground">Аккаунт OctōPAY ещё открывается — статус виден в карточке заведения.</p>
        )}
        {created.storefrontError && (
          <p role="alert" className="text-base text-destructive">
            Логотип и фото не сохранились: {created.storefrontError}. Добавьте их в карточке заведения, во вкладке «Витрина».
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={reset}>
            Добавить ещё заведение
          </Button>
          {created.merchantId && (
            <Button asChild variant="outline">
              <Link to={`/merchants/${created.merchantId}`}>Открыть заведение</Link>
            </Button>
          )}
          {onClose && (
            <Button type="button" variant="ghost" onClick={onClose}>
              Закрыть
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={root} className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold">Новое заведение</h2>
        <p className="mt-1 text-base text-muted-foreground">
          Та же анкета, что на loal.kg. Кода не будет: владелец получит в WhatsApp логин и временный пароль, а заведение сразу начнёт
          работать.
        </p>
      </div>

      <ChoiceCards
        name="agency-plan"
        legend="Тариф"
        value={choice}
        onChange={(next) => {
          setChoice(next);
          requestId.current = null;
        }}
        options={choices}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div data-field="name">
          <Field label="Название заведения" error={errors.name}>
            {(parts) => (
              <TextInput {...parts} value={values.name} onChange={(e) => set("name")(e.target.value)} onBlur={check("name")} placeholder="Dolce Vita" />
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
                options={PARTNER_CATEGORIES.map((item) => ({ id: item.id, label: item.label }))}
                placeholder="Выберите категорию"
              />
            )}
          </Field>
        </div>
        <div data-field="contact">
          <Field label="Как обращаться к владельцу" error={errors.contact}>
            {(parts) => (
              <TextInput {...parts} value={values.contact} onChange={(e) => set("contact")(e.target.value)} onBlur={check("contact")} placeholder="Азамат" />
            )}
          </Field>
        </div>
        <div data-field="phone">
          <Field label="Телефон владельца" hint="Станет логином. Сюда в WhatsApp придут логин и временный пароль." error={errors.phone}>
            {(parts) => <PhoneInput {...parts} value={values.phone} onValueChange={set("phone")} onBlur={check("phone")} />}
          </Field>
        </div>
      </div>

      {plan !== "octopay" && (
        <section aria-labelledby="agency-storefront" className="flex flex-col gap-6">
          <div>
            <h3 id="agency-storefront" className="text-lg font-semibold">
              Витрина заведения
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">Это увидят клиенты в каталоге loal.kg. Владелец сможет изменить всё в кабинете.</p>
          </div>
          <div data-field="description">
            <Field label="Описание заведения" optional error={errors.description}>
              {(parts) => (
                <Textarea
                  {...parts}
                  maxLength={2000}
                  value={values.description}
                  onValueChange={set("description")}
                  onBlur={check("description")}
                  placeholder="Расскажите о заведении, товарах или услугах"
                />
              )}
            </Field>
          </div>
          <div data-field="address">
            <Field label="Адрес" error={errors.address}>
              {(parts) => (
                <TextInput {...parts} value={values.address} onChange={(e) => set("address")(e.target.value)} onBlur={check("address")} placeholder="Город, улица, дом" />
              )}
            </Field>
          </div>
          <div data-field="twogisUrl">
            <Field
              label="Ссылка на 2ГИС"
              hint="Вставьте ссылку на заведение — или просто нажмите на карту ниже: ссылка заполнится сама."
              error={errors.twogisUrl}
            >
              {(parts) => (
                <TextInput {...parts} value={values.twogisUrl} onChange={(e) => set("twogisUrl")(e.target.value)} onBlur={check("twogisUrl")} placeholder="https://2gis.kg/…" />
              )}
            </Field>
          </div>
          <div>
            <p className="mb-3 font-medium">Точка на карте</p>
            <Suspense fallback={<div className="h-[300px] animate-pulse rounded-2xl bg-muted sm:h-[340px]" />}>
              <LocationPicker value={point} disabled={sending} onChange={pickPoint} />
            </Suspense>
          </div>
          <div data-field="instagramUrl">
            <Field label="Ссылка на Instagram" optional error={errors.instagramUrl}>
              {(parts) => (
                <TextInput
                  {...parts}
                  value={values.instagramUrl}
                  onChange={(e) => set("instagramUrl")(e.target.value)}
                  onBlur={check("instagramUrl")}
                  placeholder="https://www.instagram.com/…"
                />
              )}
            </Field>
          </div>
          <StorefrontImages logo={logo} photos={photos} disabled={sending} onLogo={setLogo} onPhotos={setPhotos} />
        </section>
      )}

      <div data-field="comment">
        <Field label="Комментарий" optional error={errors.comment}>
          {(parts) => (
            <Textarea
              {...parts}
              maxLength={500}
              value={values.comment}
              onValueChange={set("comment")}
              onBlur={check("comment")}
              placeholder="Сколько точек, какой процент планируют, о чём договорились"
            />
          )}
        </Field>
      </div>

      {failed && (
        <p role="alert" className="text-base font-medium text-destructive">
          {failed}
        </p>
      )}
      {progress && (
        <p role="status" className="text-base text-muted-foreground">
          {progress}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => void submit()} disabled={sending}>
          {sending ? <Spinner /> : "Создать и отправить доступ в WhatsApp"}
        </Button>
        {onClose && (
          <Button type="button" variant="ghost" onClick={onClose} disabled={sending}>
            Отмена
          </Button>
        )}
      </div>
    </div>
  );
}
