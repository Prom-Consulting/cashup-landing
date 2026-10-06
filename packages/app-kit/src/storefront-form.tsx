import {
  ApiError,
  STOREFRONT_IMAGE_ACCEPT,
  STOREFRONT_IMAGE_FORMATS,
  PARTNER_CATEGORIES,
  coordsFrom2gis,
  merchantProfileFormSchema,
  type MerchantProfile,
  type MerchantProfileForm,
} from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Delete02Icon, ImageAdd01Icon } from "@hugeicons/core-free-icons";
import { Button, Icon, Input, Label, NativeSelect, Textarea } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useRef, useState } from "react";
import { merchantCabinetApi } from "@loal/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./session";

const profileKey = (merchantId: string) => ["merchants", merchantId, "profile"] as const;

/** Витрина заведения. Читать может любой его сотрудник, менять — владелец, партнёр и агентство. */
export function useMerchantProfile(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: profileKey(merchantId),
    queryFn: () => merchantCabinetApi(api).profile(merchantId),
    enabled: Boolean(merchantId),
  });
}

/** PUT заменяет профиль целиком — отправляем все шесть полей. */
function useSaveProfile(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: MerchantProfile) => merchantCabinetApi(api).saveProfile(merchantId, profile),
    onSuccess: (saved) => queryClient.setQueryData(profileKey(merchantId), saved),
  });
}

function useUploadAsset(merchantId: string) {
  const api = useApi();
  return useMutation({
    mutationFn: ({ slot, file }: { slot: "merchantLogo" | "merchantPhoto"; file: File }) =>
      merchantCabinetApi(api).uploadAsset(merchantId, slot, file),
  });
}

const MAX_PHOTOS = 10;

/** Тот же список, что на лендинге. Старую свою категорию заведения не теряем — она остаётся в списке. */
function categoryOptions(current: string | null) {
  const options = PARTNER_CATEGORIES.map((category) => ({ value: category.label, label: category.label }));
  return current && !options.some((option) => option.value === current)
    ? [{ value: current, label: current }, ...options]
    : options;
}

/**
 * Точка на карте каталога — из ссылки 2ГИС. Ссылку убрали — убираем и точку; в ссылке
 * координат нет — не шлём их вовсе, и сервер оставит прежние.
 */
function geoOf(twogisUrl: string): { lat: number | null; lng: number | null } | Record<string, never> {
  if (twogisUrl.trim() === "") return { lat: null, lng: null };
  return coordsFrom2gis(twogisUrl) ?? {};
}

/** Пустая строка в поле — это «очистить», а бэкенд ждёт для этого null. */
const orNull = (value: string) => (value.trim() === "" ? null : value.trim());

/**
 * Витрина заведения: то, что клиент видит в каталоге. Картинки грузятся отдельно
 * и до сохранения, а сам профиль уходит целиком — бэкенд заменяет его одним PUT.
 */
/**
 * Каталог на лендинге кэшируется. После сохранения витрины просим его перечитать данные —
 * новое фото или точка на карте видны сразу. Не получилось — не беда: он обновится сам за минуту.
 */
export function refreshPublicCatalog(siteUrl: string) {
  void fetch(`${siteUrl.replace(/\/$/, "")}/api/revalidate-partners`, { method: "POST", mode: "no-cors" }).catch(
    () => undefined,
  );
}

export function StorefrontForm({
  merchantId,
  profile,
  onSaved,
}: {
  merchantId: string;
  profile: MerchantProfile;
  onSaved?: () => void;
}) {
  const save = useSaveProfile(merchantId);
  const upload = useUploadAsset(merchantId);
  const [logoUrl, setLogoUrl] = useState(profile.logoUrl);
  const [photos, setPhotos] = useState(profile.photos);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  const initialValues: MerchantProfileForm = {
    category: profile.category ?? "",
    description: profile.description ?? "",
    instagramUrl: profile.instagramUrl ?? "",
    twogisUrl: profile.twogisUrl ?? "",
    address: profile.address ?? "",
  };

  const pick = async (slot: "merchantLogo" | "merchantPhoto", file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    try {
      const asset = await upload.mutateAsync({ slot, file });
      if (slot === "merchantLogo") setLogoUrl(asset.url);
      else setPhotos((current) => [...current, asset.url].slice(0, MAX_PHOTOS));
    } catch (error) {
      setUploadError(
        error instanceof ApiError ? error.message : `Не удалось загрузить картинку. Подойдут ${STOREFRONT_IMAGE_FORMATS} до 25 МБ.`,
      );
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(merchantProfileFormSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          await save.mutateAsync({
            category: orNull(values.category),
            description: orNull(values.description),
            logoUrl,
            photos,
            instagramUrl: orNull(values.instagramUrl),
            twogisUrl: orNull(values.twogisUrl),
            address: orNull(values.address),
            ...geoOf(values.twogisUrl),
          });
          helpers.setStatus("Витрина сохранена");
          onSaved?.();
        } catch (error) {
          applyServerIssues(error, helpers);
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-6" noValidate>
          <FocusFirstError form={form} />
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="category">Категория</Label>
              <NativeSelect
                id="category"
                name="category"
                className="mt-2"
                placeholder="Не выбрана"
                value={form.values.category}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                invalid={Boolean(fieldError(form, "category"))}
                options={categoryOptions(profile.category)}
              />
              {fieldError(form, "category") && (
                <p className="mt-2 text-base text-destructive">{fieldError(form, "category")}</p>
              )}
            </div>

            <div>
              <Label htmlFor="instagramUrl">Instagram</Label>
              <Input
                id="instagramUrl"
                name="instagramUrl"
                placeholder="https://instagram.com/…"
                className="mt-2"
                value={form.values.instagramUrl}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                invalid={Boolean(fieldError(form, "instagramUrl"))}
              />
              {fieldError(form, "instagramUrl") && (
                <p className="mt-2 text-base text-destructive">{fieldError(form, "instagramUrl")}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Свежая обжарка и выпечка каждый день"
                className="mt-2"
                value={form.values.description}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                invalid={Boolean(fieldError(form, "description"))}
              />
              {fieldError(form, "description") && (
                <p className="mt-2 text-base text-destructive">{fieldError(form, "description")}</p>
              )}
            </div>

            <div>
              <Label htmlFor="address">Адрес</Label>
              <Input
                id="address"
                name="address"
                placeholder="Бишкек, ул. Киевская, 95"
                autoComplete="street-address"
                className="mt-2"
                value={form.values.address}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                invalid={Boolean(fieldError(form, "address"))}
              />
              {fieldError(form, "address") && (
                <p className="mt-2 text-base text-destructive">{fieldError(form, "address")}</p>
              )}
            </div>

            <div>
              <Label htmlFor="twogisUrl">Карточка в 2ГИС</Label>
              <Input
                id="twogisUrl"
                name="twogisUrl"
                placeholder="https://2gis.kg/bishkek/firm/…"
                className="mt-2"
                value={form.values.twogisUrl}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                invalid={Boolean(fieldError(form, "twogisUrl"))}
              />
              {fieldError(form, "twogisUrl") ? (
                <p className="mt-2 text-base text-destructive">{fieldError(form, "twogisUrl")}</p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  {form.values.twogisUrl.trim() && !coordsFrom2gis(form.values.twogisUrl)
                    ? "В этой ссылке нет координат — точки на карте не будет. В 2ГИС нажмите «Поделиться» и скопируйте ссылку оттуда."
                    : "По ней заведение появится точкой на карте каталога."}
                </p>
              )}
            </div>
          </div>

          <div>
            <span className="text-base font-medium">Логотип</span>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-20 w-20 rounded-2xl border-2 border-border object-contain p-1" />
              ) : (
                <span className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-dashed border-border text-sm text-muted-foreground">
                  нет
                </span>
              )}
              <input
                ref={logoInput}
                type="file"
                accept={STOREFRONT_IMAGE_ACCEPT}
                hidden
                onChange={(event) => pick("merchantLogo", event.target.files?.[0])}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => logoInput.current?.click()}>
                <Icon icon={ImageAdd01Icon} />
                {logoUrl ? "Заменить" : "Загрузить"}
              </Button>
              {logoUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setLogoUrl(null)}>
                  Убрать
                </Button>
              )}
            </div>
          </div>

          <div>
            <span className="text-base font-medium">Фотографии</span>
            <p className="mt-1 text-base text-muted-foreground">До {MAX_PHOTOS} штук, порядок сохраняется.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {photos.map((photo) => (
                <div key={photo} className="relative">
                  <img src={photo} alt="" className="h-24 w-32 rounded-2xl border-2 border-border object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((current) => current.filter((item) => item !== photo))}
                    className="absolute -top-2 -right-2 grid h-8 w-8 place-items-center rounded-full bg-surface shadow-md"
                    aria-label="Убрать фотографию"
                  >
                    <Icon icon={Delete02Icon} size={16} />
                  </button>
                </div>
              ))}
              <input
                ref={photoInput}
                type="file"
                accept={STOREFRONT_IMAGE_ACCEPT}
                hidden
                onChange={(event) => pick("merchantPhoto", event.target.files?.[0])}
              />
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => photoInput.current?.click()}
                  className="grid h-24 w-32 place-items-center rounded-2xl border-2 border-dashed border-border text-base text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                >
                  {upload.isPending ? "Грузим…" : "Добавить"}
                </button>
              )}
            </div>
            {uploadError && (
              <p role="alert" className="mt-2 text-base text-destructive">
                {uploadError}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" disabled={form.isSubmitting}>
              {form.isSubmitting ? "Сохраняем…" : "Сохранить витрину"}
            </Button>
            {formError(form) && (
              <p role="status" className="text-base text-muted-foreground">
                {formError(form)}
              </p>
            )}
          </div>
        </Form>
      )}
    </Formik>
  );
}
