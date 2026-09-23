import { ApiError, merchantProfileFormSchema, type MerchantProfile, type MerchantProfileForm } from "@loal/api";
import { fieldError, formError, zodValidate } from "@loal/forms";
import { Delete02Icon, ImageAdd01Icon } from "@hugeicons/core-free-icons";
import { Button, Icon, Input, Label, Textarea } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useRef, useState } from "react";
import { useSaveProfile, useUploadAsset } from "../../entities/merchant/api";

const MAX_PHOTOS = 10;

/** Пустая строка в поле — это «очистить», а бэкенд ждёт для этого null. */
const orNull = (value: string) => (value.trim() === "" ? null : value.trim());

/**
 * Витрина заведения: то, что клиент видит в каталоге. Картинки грузятся отдельно
 * и до сохранения, а сам профиль уходит целиком — бэкенд заменяет его одним PUT.
 */
export function ProfileForm({ merchantId, profile }: { merchantId: string; profile: MerchantProfile }) {
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
        error instanceof ApiError ? error.message : "Не удалось загрузить картинку. Подойдут PNG, JPG и SVG до 25 МБ.",
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
          });
          helpers.setStatus("Витрина сохранена");
        } catch (error) {
          helpers.setStatus(error instanceof ApiError ? error.message : "Не удалось сохранить витрину");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-6" noValidate>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="category">Категория</Label>
              <Input
                id="category"
                name="category"
                placeholder="Кофейня"
                className="mt-2"
                value={form.values.category}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                invalid={Boolean(fieldError(form, "category"))}
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
              {fieldError(form, "twogisUrl") && (
                <p className="mt-2 text-base text-destructive">{fieldError(form, "twogisUrl")}</p>
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
                accept="image/png,image/jpeg,image/svg+xml"
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
                accept="image/png,image/jpeg,image/svg+xml"
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
