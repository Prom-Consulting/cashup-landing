import { Delete02Icon, ImageAdd01Icon } from "@hugeicons/core-free-icons";
import { STOREFRONT_IMAGE_ACCEPT, ApiError, PARTNER_CATEGORIES, createMerchantFormSchema, slugify, type CreateMerchantForm } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { PhoneInput } from "@loal/ui/inputs";
import { Button, FileButton, FormField, FormStatus, Icon, Input, Label, Textarea, cn } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useEffect, useState } from "react";
import { useCreateMerchant } from "../../entities/merchant/api";

const initialValues: CreateMerchantForm = {
  name: "",
  category: "",
  contactPhone: "",
  contactEmail: "",
  description: "",
};
const MAX_PHOTOS = 10;
const IMAGE_TYPES = STOREFRONT_IMAGE_ACCEPT;

/** Превью выбранного файла до загрузки: адрес живёт, пока картинка на экране. */
function usePreview(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) return setUrl(null);
    // Адрес создаём в эффекте: StrictMode монтирует дважды, и адрес из useMemo был бы уже отозван
    const created = URL.createObjectURL(file);
    setUrl(created);
    return () => URL.revokeObjectURL(created);
  }, [file]);
  return url;
}

function Thumb({ file, round, onRemove }: { file: File; round?: boolean; onRemove: () => void }) {
  const url = usePreview(file);
  return (
    <li className="relative">
      {url && (
        <img
          src={url}
          alt={file.name}
          className={cn("h-24 w-24 border-2 border-border object-cover", round ? "rounded-full" : "rounded-2xl")}
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Убрать ${file.name}`}
        className="absolute -top-2 -right-2 grid h-8 w-8 place-items-center rounded-full bg-foreground text-background"
      >
        <Icon icon={Delete02Icon} />
      </button>
    </li>
  );
}

/**
 * Новое заведение: как в заявке на лендинге — название, категория, контакты, — плюс логотип
 * и фото для каталога. Адрес в ссылках вводить не нужно: он собирается из названия.
 */
export function CreateMerchantForm({ onCreated }: { onCreated?: (merchantId: string) => void }) {
  const createMerchant = useCreateMerchant();
  const [logo, setLogo] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [partial, setPartial] = useState<{ id: string; message: string } | null>(null);

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(createMerchantFormSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          const { merchant, storefrontError } = await createMerchant.mutateAsync({ values, logo, photos });
          if (storefrontError) return setPartial({ id: merchant.id, message: storefrontError });
          helpers.resetForm();
          setLogo(null);
          setPhotos([]);
          onCreated?.(merchant.id);
        } catch (error) {
          // Номер заблокированного, удалённого или служебного аккаунта владельцем не станет
          if (error instanceof ApiError && error.code === "MERCHANT_OWNER_UNAVAILABLE")
            return helpers.setFieldError(
              "contactPhone",
              "Этот номер нельзя сделать владельцем: аккаунт заблокирован, удалён или служебный. Укажите другой.",
            );
          applyServerIssues(error, helpers, "Не удалось создать заведение");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form className="flex flex-col gap-6" noValidate>
          <FocusFirstError form={form} />
          <h2 className="text-xl font-bold">Новое заведение</h2>

          <FormField
            label="Название"
            hint={form.values.name.trim() ? `Адрес в ссылках: ${slugify(form.values.name) || "merchant"}` : undefined}
            error={fieldError(form, "name")}
          >
            {(parts) => (
              <Input
                {...parts}
                name="name"
                placeholder="Кофе Хаус"
                value={form.values.name}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </FormField>

          <fieldset>
            <legend className="text-base font-medium">Категория</legend>
            <div role="radiogroup" className="mt-3 flex flex-wrap gap-2" data-field="category">
              {PARTNER_CATEGORIES.map((category) => {
                const checked = form.values.category === category.label;
                return (
                  <button
                    key={category.id}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    name={checked || !form.values.category ? "category" : undefined}
                    onClick={() => {
                      void form.setFieldValue("category", category.label);
                      void form.setFieldTouched("category", true, false);
                    }}
                    className={cn(
                      "h-11 rounded-full border-2 px-5 text-base transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      checked
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-surface hover:border-foreground",
                    )}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
            {fieldError(form, "category") && (
              <p className="mt-2 text-base text-destructive">{fieldError(form, "category")}</p>
            )}
          </fieldset>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              label="Телефон владельца"
              hint="Владелец войдёт в кабинет партнёра по этому номеру — код придёт в WhatsApp. Уже есть аккаунт Loal — права добавятся к нему."
              error={fieldError(form, "contactPhone")}
            >
              {(parts) => (
                <PhoneInput
                  {...parts}
                  value={form.values.contactPhone}
                  onValueChange={(value) => form.setFieldValue("contactPhone", value)}
                  onBlur={() => form.setFieldTouched("contactPhone", true)}
                />
              )}
            </FormField>
            <FormField label="Почта" hint="Необязательно" error={fieldError(form, "contactEmail")}>
              {(parts) => (
                <Input
                  {...parts}
                  type="email"
                  name="contactEmail"
                  value={form.values.contactEmail}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              )}
            </FormField>
          </div>

          <FormField
            label="Описание для каталога"
            hint="Необязательно. Одна-две фразы о месте"
            error={fieldError(form, "description")}
          >
            {(parts) => (
              <Textarea
                {...parts}
                name="description"
                rows={3}
                value={form.values.description}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </FormField>

          <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
            <div>
              <Label>Логотип</Label>
              <ul className="mt-3 flex gap-3">
                {logo ? (
                  <Thumb file={logo} round onRemove={() => setLogo(null)} />
                ) : (
                  <li>
                    <FileButton variant="outline" accept={IMAGE_TYPES} onFile={setLogo}>
                      <Icon icon={ImageAdd01Icon} />
                      Выбрать
                    </FileButton>
                  </li>
                )}
              </ul>
            </div>
            <div>
              <Label>Фото заведения</Label>
              <p className="text-sm text-muted-foreground">Первое станет обложкой в каталоге. До {MAX_PHOTOS} штук.</p>
              <ul className="mt-3 flex flex-wrap gap-3">
                {photos.map((photo, index) => (
                  <Thumb
                    key={`${photo.name}-${index}`}
                    file={photo}
                    onRemove={() => setPhotos((current) => current.filter((_, i) => i !== index))}
                  />
                ))}
                {photos.length < MAX_PHOTOS && (
                  <li>
                    <FileButton
                      variant="outline"
                      accept={IMAGE_TYPES}
                      onFile={(file) => setPhotos((current) => [...current, file].slice(0, MAX_PHOTOS))}
                    >
                      <Icon icon={ImageAdd01Icon} />
                      Добавить фото
                    </FileButton>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <FormStatus message={formError(form)} />
          {partial && (
            <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted p-4">
              <p className="text-base">
                Заведение создано, но витрина не сохранилась: {partial.message}. Фото и категорию можно добавить в его
                карточке.
              </p>
              <Button type="button" size="sm" onClick={() => onCreated?.(partial.id)}>
                Открыть заведение
              </Button>
            </div>
          )}

          <Button type="submit" disabled={form.isSubmitting || Boolean(partial)} className="self-start">
            {form.isSubmitting
              ? logo || photos.length
                ? "Создаём и загружаем фото…"
                : "Создаём…"
              : "Создать заведение"}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
