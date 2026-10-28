import { CheckmarkCircle02Icon, Delete02Icon, ImageAdd01Icon } from "@hugeicons/core-free-icons";
import {
  LOAL_TARIFFS,
  LOAL_TARIFF_LABELS,
  PARTNER_AUDIENCES,
  PARTNER_CATEGORIES,
  authApi,
  coordsFrom2gis,
  openStoreFormSchema,
  reverseGeocode,
  searchAddress,
  type AddressHit,
  type OpenStoreFormValues,
} from "@loal/api";
import { FocusFirstError, fieldError, zodValidate } from "@loal/forms";
import { Button, Card, ChipSelect, Icon, Input, Label, NativeSelect, Textarea } from "@loal/ui/shadcn";
import LocationPicker, { type MapMarker, type Point } from "@loal/ui/location-picker";
import { Form, Formik } from "formik";
import { useRef, useState } from "react";
import { useApi } from "./session";

const categoryOptions = PARTNER_CATEGORIES.map((item) => ({ value: item.id, label: item.label }));
const audienceOptions = PARTNER_AUDIENCES.map((item) => ({ value: item.id, label: item.label }));
const MAX_PHOTOS = 6;

const initialValues: OpenStoreFormValues = {
  name: "",
  contactName: "",
  category: "",
  description: "",
  address: "",
  twogisUrl: "",
  instagramUrl: "",
  comment: "",
};

class SubmitError extends Error {}

/**
 * Форма «ещё одно заведение» для уже вошедшего владельца (филиализация). Телефон берётся из
 * сессии (session-proof), код из WhatsApp не нужен. Создаётся заявка (pending_review), которую
 * подтверждает агентство — после одобрения заведение появляется в «Моих заведениях».
 */
export function OpenStoreForm({
  onDone,
  existingPoints,
}: {
  onDone?: () => void;
  /** Уже открытые заведения владельца — показываем на карте для контекста. */
  existingPoints?: MapMarker[];
}) {
  const api = useApi();
  const base = api.baseUrl.replace(/\/$/, "");
  const [tariff, setTariff] = useState<(typeof LOAL_TARIFFS)[number]>("even_more_clients");
  const [audiences, setAudiences] = useState<string[]>([]);
  const [point, setPoint] = useState<Point | null>(null);
  const [addrHits, setAddrHits] = useState<AddressHit[]>([]);
  const [addrOpen, setAddrOpen] = useState(false);
  const addrAbort = useRef<AbortController | null>(null);
  const addrTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Подсказки адреса — с задержкой, чтобы не дёргать геокодер на каждую букву.
  const queryAddress = (text: string) => {
    if (addrTimer.current) clearTimeout(addrTimer.current);
    addrAbort.current?.abort();
    if (text.trim().length < 3) {
      setAddrHits([]);
      setAddrOpen(false);
      return;
    }
    addrTimer.current = setTimeout(async () => {
      const ctrl = new AbortController();
      addrAbort.current = ctrl;
      const hits = await searchAddress(text, ctrl.signal);
      setAddrHits(hits);
      setAddrOpen(hits.length > 0);
    }, 450);
  };
  const [logo, setLogo] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [progress, setProgress] = useState("");
  const [done, setDone] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const uploaded = useRef(new Map<File, string>());
  const requestId = useRef<string | null>(null);

  const uploadImage = async (file: File, slot: "merchantLogo" | "merchantPhoto", proof: string) => {
    const saved = uploaded.current.get(file);
    if (saved) return saved;
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(`${base}/v1/public/partner-onboarding/assets?slot=${slot}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${proof}` },
      body,
      signal: AbortSignal.timeout(60_000),
    });
    if (response.status === 413) throw new SubmitError("Размер изображения не должен превышать 5 МБ.");
    if (response.status === 429) throw new SubmitError("Загрузка временно занята. Подождите минуту и повторите.");
    if (!response.ok) throw new SubmitError("Не удалось загрузить изображение. Выберите другое и повторите.");
    const url = (await response.json().catch(() => ({})))?.url;
    if (typeof url !== "string") throw new SubmitError("Не удалось загрузить изображение. Повторите позже.");
    uploaded.current.set(file, url);
    return url;
  };

  const createStore = async (proof: string, values: OpenStoreFormValues) => {
    let logoUrl: string | null = null;
    const photoUrls: string[] = [];
    try {
      if (logo) {
        setProgress("Загружаем логотип…");
        logoUrl = await uploadImage(logo, "merchantLogo", proof);
      }
      for (let i = 0; i < photos.length; i++) {
        setProgress(`Загружаем фото ${i + 1} из ${photos.length}…`);
        photoUrls.push(await uploadImage(photos[i], "merchantPhoto", proof));
      }
    } finally {
      setProgress("");
    }
    const geo = point ?? coordsFrom2gis(values.twogisUrl);
    const storefront = {
      description: values.description.trim() || null,
      address: values.address.trim() || null,
      instagramUrl: values.instagramUrl?.trim() || null,
      twogisUrl: values.twogisUrl.trim() || null,
      logoUrl,
      photos: photoUrls,
      lat: geo?.lat ?? null,
      lng: geo?.lng ?? null,
      ...(audiences.length ? { audiences } : {}),
    };
    requestId.current ??= crypto.randomUUID();
    const response = await fetch(`${base}/v1/public/partner-onboarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${proof}` },
      body: JSON.stringify({
        requestId: requestId.current,
        plan: "loyalty",
        tariff,
        name: values.name.trim(),
        contactName: values.contactName.trim(),
        category: values.category,
        comment: values.comment.trim(),
        storefront,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (response.status === 409) {
      const code = ((await response.json().catch(() => ({}))) as { error?: string }).error;
      if (code === "PHONE_HAS_ACTIVE_MERCHANT")
        throw new SubmitError("Этот номер уже работает сотрудником в заведении Loal — открыть магазин на него нельзя.");
      if (code === "APPLICATION_IN_PROGRESS")
        throw new SubmitError("По вашему номеру уже обрабатывается другая заявка. Дождитесь решения по ней.");
      throw new SubmitError("На этот номер уже есть незавершённая заявка. Напишите нам, если это ошибка.");
    }
    if (response.status === 400) throw new SubmitError("Проверьте поля: сервер не принял данные.");
    if (response.status === 429) throw new SubmitError("Слишком много попыток. Подождите минуту и попробуйте снова.");
    if (!response.ok) throw new SubmitError("Сервис временно недоступен. Попробуйте через минуту.");
  };

  if (done)
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-secondary text-secondary-foreground">
          <Icon icon={CheckmarkCircle02Icon} size={30} />
        </span>
        <h2 className="text-2xl font-bold">Заявка отправлена</h2>
        <p className="max-w-[420px] text-base text-muted-foreground">
          Мы подтвердим заведение — после одобрения оно появится в «Моих заведениях», и вы сможете на него
          переключиться.
        </p>
        <Button className="mt-2" onClick={() => onDone?.()}>
          К моим заведениям
        </Button>
      </Card>
    );

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(openStoreFormSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        if (!point && !coordsFrom2gis(values.twogisUrl)) {
          helpers.setStatus("Поставьте точку на карте или вставьте ссылку на заведение в 2ГИС.");
          helpers.setSubmitting(false);
          return;
        }
        try {
          const { token: proof } = await authApi(api).partnerOnboardingSessionProof();
          await createStore(proof, values);
          setDone(true);
        } catch (error) {
          helpers.setStatus(
            error instanceof SubmitError ? error.message : "Не удалось открыть заведение. Попробуйте ещё раз.",
          );
        } finally {
          helpers.setSubmitting(false);
          setProgress("");
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-6" noValidate>
          <FocusFirstError form={form} />

          <Card className="flex flex-col gap-6 p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <TextField name="name" label="Название заведения" form={form} placeholder="Например, Мир Востока на Чуй" />
              <div>
                <Label htmlFor="category">Категория</Label>
                <NativeSelect
                  id="category"
                  name="category"
                  className="mt-2"
                  placeholder="Выберите категорию"
                  value={form.values.category}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  invalid={Boolean(fieldError(form, "category"))}
                  options={categoryOptions}
                />
                {fieldError(form, "category") && (
                  <p className="mt-2 text-base text-destructive">{fieldError(form, "category")}</p>
                )}
              </div>
              <TextField name="contactName" label="Как к вам обращаться" form={form} placeholder="Имя владельца" />
              <TextField name="instagramUrl" label="Instagram" form={form} placeholder="https://instagram.com/…" />
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-6">
            <div>
              <p className="text-lg font-bold">Тариф</p>
              <p className="mt-1 text-base text-muted-foreground">
                Доступ к приёму бонусов открывает оплата — её настроите после одобрения заявки.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {LOAL_TARIFFS.map((id) => {
                const on = tariff === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTariff(id)}
                    aria-pressed={on}
                    className={`rounded-2xl border-2 p-4 text-left transition-colors ${
                      on ? "border-primary bg-surface" : "border-border hover:border-foreground/40"
                    }`}
                  >
                    <span className="block font-bold">{LOAL_TARIFF_LABELS[id].title}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{LOAL_TARIFF_LABELS[id].about}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="flex flex-col gap-6 p-6">
            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                className="mt-2"
                placeholder="Коротко о заведении — что предлагаете"
                value={form.values.description}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                invalid={Boolean(fieldError(form, "description"))}
              />
              {fieldError(form, "description") && (
                <p className="mt-2 text-base text-destructive">{fieldError(form, "description")}</p>
              )}
            </div>

            <div data-field="address" className="relative">
              <Label htmlFor="address">Адрес</Label>
              <Input
                id="address"
                name="address"
                className="mt-2"
                autoComplete="off"
                placeholder="Начните вводить улицу и дом — подскажем"
                value={form.values.address}
                onChange={(e) => {
                  form.handleChange(e);
                  queryAddress(e.target.value);
                }}
                onFocus={() => {
                  if (addrHits.length) setAddrOpen(true);
                }}
                onBlur={(e) => {
                  form.handleBlur(e);
                  setTimeout(() => setAddrOpen(false), 150);
                }}
                invalid={Boolean(fieldError(form, "address"))}
              />
              {addrOpen && (
                <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1rem_3rem_rgb(22_21_21/0.14)]">
                  {addrHits.map((hit, i) => (
                    <li key={`${hit.lat},${hit.lng},${i}`}>
                      <button
                        type="button"
                        // не теряем фокус поля до клика — иначе onBlur закроет список раньше
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          void form.setFieldValue("address", hit.short);
                          setPoint({ lat: hit.lat, lng: hit.lng });
                          setAddrOpen(false);
                        }}
                        className="block w-full px-4 py-2.5 text-left hover:bg-muted"
                      >
                        <span className="block font-medium">{hit.short}</span>
                        <span className="block truncate text-sm text-muted-foreground">{hit.full}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {fieldError(form, "address") && (
                <p className="mt-2 text-base text-destructive">{fieldError(form, "address")}</p>
              )}
            </div>

            <div>
              <p className="text-base font-medium text-foreground">Точка на карте</p>
              <p className="mt-1 mb-3 text-base text-muted-foreground">
                Нажмите на карту, где находится заведение, — адрес подставим сам.
                {existingPoints && existingPoints.length > 0 && (
                  <> Янтарные метки — ваши заведения.</>
                )}
              </p>
              <LocationPicker
                value={point}
                markers={existingPoints}
                onChange={(p) => {
                  setPoint(p);
                  // Клик по карте — подставляем адрес, если его ещё не вводили вручную.
                  if (p && !form.values.address.trim()) {
                    void reverseGeocode(p.lat, p.lng).then((addr) => {
                      if (addr) void form.setFieldValue("address", addr);
                    });
                  }
                }}
              />
              <div className="mt-4">
                <Label htmlFor="twogisUrl">Ссылка 2ГИС (необязательно)</Label>
                <Input
                  id="twogisUrl"
                  name="twogisUrl"
                  className="mt-2"
                  placeholder="https://2gis.kg/bishkek/firm/…"
                  value={form.values.twogisUrl}
                  onChange={form.handleChange}
                  onBlur={(e) => {
                    form.handleBlur(e);
                    const geo = coordsFrom2gis(form.values.twogisUrl);
                    if (geo) setPoint(geo);
                  }}
                  invalid={Boolean(fieldError(form, "twogisUrl"))}
                />
                {fieldError(form, "twogisUrl") && (
                  <p className="mt-2 text-base text-destructive">{fieldError(form, "twogisUrl")}</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-base font-medium text-foreground">Для кого</p>
              <p id="audiences-hint" className="mt-1 text-base text-muted-foreground">
                Можно отметить несколько — по ним клиенты находят вас в каталоге.
              </p>
              <ChipSelect
                id="audiences"
                className="mt-2"
                options={audienceOptions}
                value={audiences}
                onChange={setAudiences}
                describedBy="audiences-hint"
                label="Для кого"
              />
            </div>

            <ImagePicker
              label="Логотип"
              inputRef={logoInput}
              onPick={(file) => setLogo(file)}
              preview={logo ? [logo.name] : []}
              onClear={() => setLogo(null)}
            />
            <ImagePicker
              label={`Фотографии (до ${MAX_PHOTOS})`}
              multiple
              inputRef={photoInput}
              onPick={(file) => setPhotos((current) => [...current, file].slice(0, MAX_PHOTOS))}
              preview={photos.map((p) => p.name)}
              onClear={() => setPhotos([])}
            />
          </Card>

          <div>
            <Label htmlFor="comment">Комментарий агентству (необязательно)</Label>
            <Textarea
              id="comment"
              name="comment"
              rows={2}
              className="mt-2"
              placeholder="Что важно знать при подключении"
              value={form.values.comment}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              invalid={Boolean(fieldError(form, "comment"))}
            />
            {fieldError(form, "comment") && (
              <p className="mt-2 text-base text-destructive">{fieldError(form, "comment")}</p>
            )}
          </div>

          {form.status && <p className="text-base text-destructive">{String(form.status)}</p>}

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={form.isSubmitting}>
              {form.isSubmitting ? progress || "Отправляем…" : "Открыть заведение"}
            </Button>
            <p className="text-sm text-muted-foreground">Код из WhatsApp не нужен — вы уже в кабинете.</p>
          </div>
        </Form>
      )}
    </Formik>
  );
}

type FieldKey = Extract<keyof OpenStoreFormValues, string>;
type FormBag = {
  values: OpenStoreFormValues;
  handleChange: (e: unknown) => void;
  handleBlur: (e: unknown) => void;
};

function TextField({
  name,
  label,
  form,
  placeholder,
  hint,
}: {
  name: FieldKey;
  label: string;
  form: FormBag;
  placeholder?: string;
  hint?: string;
}) {
  const error = fieldError(form as never, name);
  return (
    <div data-field={name}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        className="mt-2"
        placeholder={placeholder}
        value={form.values[name] ?? ""}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        invalid={Boolean(error)}
      />
      {hint && !error && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
      {error && <p className="mt-2 text-base text-destructive">{error}</p>}
    </div>
  );
}

function ImagePicker({
  label,
  multiple,
  inputRef,
  onPick,
  preview,
  onClear,
}: {
  label: string;
  multiple?: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (file: File) => void;
  preview: string[];
  onClear: () => void;
}) {
  return (
    <div>
      <p className="text-base font-medium text-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <Icon icon={ImageAdd01Icon} size={18} />
          Добавить
        </Button>
        {preview.length > 0 && (
          <>
            <span className="max-w-[260px] truncate text-sm text-muted-foreground">{preview.join(", ")}</span>
            <button type="button" onClick={onClear} className="text-flame-ink" aria-label="Убрать">
              <Icon icon={Delete02Icon} size={18} />
            </button>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          hidden
          onChange={(e) => {
            const files = e.target.files ? Array.from(e.target.files) : [];
            files.forEach(onPick);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
