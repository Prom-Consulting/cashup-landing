import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Delete02Icon,
  Image02Icon,
  Location01Icon,
  TextFontIcon,
} from "@hugeicons/core-free-icons";
import {
  BARCODE_FORMAT_LABELS,
  EXPIRING_CARD_TYPES,
  FIELD_GROUPS,
  IMAGE_SLOTS,
  LIVE_FIELD_KEYS,
  brandTextInputSchema,
  cleanDesign,
  hexToRgb,
  liveField,
  passDesignInputSchema,
  rgbToHex,
  type BrandTextInput,
  type CardType,
  type FieldGroupKey,
  type PassDesign,
  type PassField,
} from "@loal/api";
import { applyServerIssues, zodValidate } from "@loal/forms";
import {
  Button,
  Card,
  ConfirmDialog,
  FileButton,
  FormField,
  FormStatus,
  Icon,
  Input,
  NativeSelect,
  Switch,
  Textarea,
} from "@loal/ui/shadcn";
import { Form, Formik, getIn, type FormikProps } from "formik";
import { useState, type ReactNode } from "react";
import { useBrandFonts, useRenderBrandText, useUploadTemplateAsset } from "../../entities/platform/api";
import { DesignErrorSummary, FocusDesignError, describePath, flattenErrors } from "./design-errors";

type DesignFormik = FormikProps<PassDesign>;

/** Ошибка вложенного поля — после того как человек его тронул или попробовал сохранить. */
function errorAt(form: DesignFormik, path: string): string | undefined {
  const error = getIn(form.errors, path);
  const touched = getIn(form.touched, path) || form.submitCount > 0;
  return touched && typeof error === "string" ? error : undefined;
}

function Section({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {description && <p className="mt-1 max-w-[62ch] text-base text-muted-foreground">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

function TextInput({
  form,
  path,
  label,
  hint,
  multiline,
}: {
  form: DesignFormik;
  path: string;
  label: string;
  hint?: string;
  multiline?: boolean;
}) {
  const value = (getIn(form.values, path) as string | undefined) ?? "";
  return (
    <FormField label={label} hint={hint} error={errorAt(form, path)}>
      {(parts) =>
        multiline ? (
          <Textarea {...parts} name={path} value={value} onChange={form.handleChange} onBlur={form.handleBlur} />
        ) : (
          <Input {...parts} name={path} value={value} onChange={form.handleChange} onBlur={form.handleBlur} />
        )
      }
    </FormField>
  );
}

/** Цвет: палитра браузера плюс поле для точного значения. Сервер хранит rgb(r,g,b). */
function ColorInput({
  form,
  path,
  label,
}: {
  form: DesignFormik;
  path: "backgroundColor" | "foregroundColor" | "labelColor";
  label: string;
}) {
  const hex = rgbToHex(form.values[path]);
  return (
    <FormField label={label} error={errorAt(form, path)}>
      {(parts) => (
        <div className="flex items-center gap-3">
          <input
            type="color"
            aria-label={`${label}: палитра`}
            value={hex}
            onChange={(event) => form.setFieldValue(path, hexToRgb(event.target.value))}
            className="h-12 w-14 shrink-0 cursor-pointer rounded-2xl border-2 border-border bg-surface p-1"
          />
          <Input
            {...parts}
            name={path}
            className="font-mono text-base"
            value={form.values[path]}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
          />
        </div>
      )}
    </FormField>
  );
}

function ImageSlotRow({
  form,
  slot,
  target,
  label,
  hint,
}: {
  form: DesignFormik;
  slot: (typeof IMAGE_SLOTS)[number]["slot"];
  target: string;
  label: string;
  hint: string;
}) {
  const upload = useUploadTemplateAsset();
  const url = getIn(form.values, target) as string | undefined;
  return (
    <li className="flex flex-wrap items-center gap-4 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <div className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted">
        {url ? (
          <img src={url} alt="" className="h-full w-full object-contain" />
        ) : (
          <Icon icon={Image02Icon} size={22} className="text-muted-foreground" />
        )}
      </div>
      <div className="min-w-[180px] flex-1">
        <p className="text-lg font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{hint}</p>
        {upload.isError && <p className="mt-1 text-sm text-destructive">{upload.error.message}</p>}
      </div>
      <div className="flex gap-2">
        <FileButton
          variant="outline"
          size="sm"
          accept="image/png,image/jpeg,image/svg+xml,application/pdf"
          disabled={upload.isPending}
          onFile={async (file) => {
            const saved = await upload.mutateAsync({
              slot,
              file,
              backgroundColor: rgbToHex(form.values.backgroundColor),
            });
            form.setFieldValue(target, saved.url);
          }}
        >
          {upload.isPending ? "Загружаем…" : url ? "Заменить" : "Загрузить"}
        </FileButton>
        {url && (
          <Button variant="ghost" size="sm" onClick={() => form.setFieldValue(target, undefined)}>
            Убрать
          </Button>
        )}
      </div>
    </li>
  );
}

/** Надпись своим шрифтом: Wallet не даёт поставить шрифт, поэтому сервер рисует её картинкой. */
function BrandTextMaker({ form }: { form: DesignFormik }) {
  const fonts = useBrandFonts();
  const render = useRenderBrandText();
  const [values, setValues] = useState<BrandTextInput>({
    text: form.values.logoText ?? "",
    fontId: "",
    color: rgbToHex(form.values.foregroundColor),
  });
  const [error, setError] = useState<string | undefined>();
  const fontId = values.fontId || fonts.data?.[0]?.id || "";
  const font = fonts.data?.find((item) => item.id === fontId);

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-muted p-4">
      <p className="flex items-center gap-2 text-lg font-medium">
        <Icon icon={TextFontIcon} />
        Логотип надписью
      </p>
      <p className="text-sm text-muted-foreground">
        Ни Apple, ни Google не дают поставить свой шрифт в текстовое поле. Надпись нарисуем картинкой и поставим на
        место логотипа.
      </p>
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <FormField label="Надпись">
          {(parts) => (
            <Input
              {...parts}
              value={values.text}
              onChange={(event) => setValues({ ...values, text: event.target.value })}
            />
          )}
        </FormField>
        <FormField label="Шрифт">
          {(parts) => (
            <NativeSelect
              {...parts}
              value={fontId}
              onChange={(event) => setValues({ ...values, fontId: event.target.value })}
              options={(fonts.data ?? []).map((item) => ({ value: item.id, label: item.label }))}
            />
          )}
        </FormField>
        <FormField label="Цвет">
          {() => (
            <input
              type="color"
              aria-label="Цвет надписи"
              value={values.color}
              onChange={(event) => setValues({ ...values, color: event.target.value })}
              className="h-12 w-14 cursor-pointer rounded-2xl border-2 border-border bg-surface p-1"
            />
          )}
        </FormField>
      </div>
      {font && values.text && (
        <p
          aria-hidden="true"
          className="rounded-xl px-4 py-3 text-2xl"
          style={{
            fontFamily: `"${font.cssFamily}", serif`,
            fontWeight: font.weight,
            background: form.values.backgroundColor,
            color: values.color,
          }}
        >
          {values.text}
        </p>
      )}
      <FormStatus message={error ?? (render.isError ? render.error.message : undefined)} />
      <div>
        <Button
          variant="outline"
          size="sm"
          disabled={render.isPending}
          onClick={async () => {
            const parsed = brandTextInputSchema.safeParse({ ...values, fontId });
            if (!parsed.success) {
              setError(parsed.error.issues[0]?.message);
              return;
            }
            setError(undefined);
            const saved = await render.mutateAsync(parsed.data);
            form.setFieldValue("images.logoUrl", saved.url);
          }}
        >
          {render.isPending ? "Рисуем…" : "Поставить логотипом"}
        </Button>
      </div>
    </div>
  );
}

const ALIGNMENT_OPTIONS = [
  { value: "", label: "Как решит Wallet" },
  { value: "PKTextAlignmentLeft", label: "Слева" },
  { value: "PKTextAlignmentCenter", label: "По центру" },
  { value: "PKTextAlignmentRight", label: "Справа" },
];

const CUSTOM = "__custom";

/** Свободный ключ для своего текста: не совпадает ни с живыми, ни с соседними полями. */
function freeKey(fields: PassField[], index: number) {
  const taken = new Set(fields.map((item, i) => (i === index ? "" : item.key)));
  let n = index + 1;
  while (taken.has(`text${n}`)) n += 1;
  return `text${n}`;
}

function FieldGroup({ form, group, label }: { form: DesignFormik; group: FieldGroupKey; label: string }) {
  const fields = form.values[group];
  // Ключи со всей карты: одно живое значение не должно встречаться дважды
  const usedKeys = new Set(FIELD_GROUPS.flatMap((item) => form.values[item.key].map((entry) => entry.key)));
  const set = (next: PassField[]) => form.setFieldValue(group, next);
  const move = (from: number, to: number) => {
    const next = [...fields];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    set(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-medium">{label}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => set([...fields, { key: freeKey(fields, fields.length), label: "", value: "" }])}
        >
          <Icon icon={Add01Icon} />
          Поле
        </Button>
      </div>
      {fields.length === 0 && <p className="text-sm text-muted-foreground">Пусто.</p>}
      <ol className="flex flex-col gap-3">
        {fields.map((field, index) => {
          const base = `${group}.${index}`;
          const live = liveField(field.key);
          return (
            <li key={index} data-path={base} className="rounded-2xl border-2 border-border p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  label="Что показывает"
                  error={live ? errorAt(form, `${base}.key`) : undefined}
                  hint={
                    live
                      ? "Сервер подставит это значение сам при каждой выдаче."
                      : "Текст не меняется: условия, адрес, подпись."
                  }
                >
                  {(parts) => (
                    <NativeSelect
                      {...parts}
                      value={live ? field.key : CUSTOM}
                      onChange={(event) => {
                        const next = event.target.value;
                        if (next === CUSTOM) {
                          form.setFieldValue(`${base}.key`, freeKey(fields, index));
                          form.setFieldValue(`${base}.changeMessage`, undefined);
                        } else {
                          form.setFieldValue(`${base}.key`, next);
                          // value у живого поля — только заглушка для превью, сервер её заменит
                          form.setFieldValue(`${base}.value`, liveField(next)?.sample ?? "");
                          if (!field.label) form.setFieldValue(`${base}.label`, liveField(next)?.label ?? "");
                        }
                      }}
                      options={[
                        ...LIVE_FIELD_KEYS.map((item) => ({
                          value: item.key,
                          label: item.label,
                          // Одно живое значение — одно поле: Wallet различает поля по ключу
                          disabled: item.key !== field.key && usedKeys.has(item.key),
                        })),
                        { value: CUSTOM, label: "Свой текст" },
                      ]}
                    />
                  )}
                </FormField>
                <TextInput form={form} path={`${base}.label`} label="Подпись" />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {live ? (
                  <FormField label="Значение" hint={`В превью: «${live.sample}». Настоящее подставит сервер.`}>
                    {(parts) => <Input {...parts} value={live.sample} disabled readOnly />}
                  </FormField>
                ) : (
                  <TextInput form={form} path={`${base}.value`} label="Текст" multiline={group === "backFields"} />
                )}
                {!live && (
                  <TextInput
                    form={form}
                    path={`${base}.key`}
                    label="Ключ"
                    hint="Латиницей, не меняйте после публикации."
                  />
                )}
                {live && (
                  <TextInput
                    form={form}
                    path={`${base}.changeMessage`}
                    label="Уведомление при изменении"
                    hint="%@ — новое значение, например «Баланс: %@»"
                  />
                )}
                <FormField label="Выравнивание">
                  {(parts) => (
                    <NativeSelect
                      {...parts}
                      value={field.textAlignment ?? ""}
                      onChange={(event) => form.setFieldValue(`${base}.textAlignment`, event.target.value || undefined)}
                      options={ALIGNMENT_OPTIONS}
                    />
                  )}
                </FormField>
              </div>
              <div className="mt-3 flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Выше"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <Icon icon={ArrowUp01Icon} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Ниже"
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <Icon icon={ArrowDown01Icon} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Убрать поле"
                  onClick={() => set(fields.filter((_, i) => i !== index))}
                >
                  <Icon icon={Delete02Icon} />
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function toLocalInput(value: string | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function DateTimeInput({
  form,
  path,
  label,
  hint,
}: {
  form: DesignFormik;
  path: "expirationDate" | "relevantDate";
  label: string;
  hint: string;
}) {
  return (
    <FormField label={label} hint={hint}>
      {(parts) => (
        <Input
          {...parts}
          type="datetime-local"
          value={toLocalInput(form.values[path])}
          onChange={(event) =>
            form.setFieldValue(path, event.target.value ? new Date(event.target.value).toISOString() : undefined)
          }
        />
      )}
    </FormField>
  );
}

const numberOrEmpty = (value: string) => (value === "" ? "" : Number(value.replace(",", ".")));

function Locations({ form }: { form: DesignFormik }) {
  const locations = form.values.locations ?? [];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-medium">
          <Icon icon={Location01Icon} />
          Точки рядом ({locations.length} из 10)
        </h3>
        <Button
          variant="ghost"
          size="sm"
          disabled={locations.length >= 10}
          onClick={() =>
            form.setFieldValue("locations", [...locations, { latitude: 42.8746, longitude: 74.5698, relevantText: "" }])
          }
        >
          <Icon icon={Add01Icon} />
          Точка
        </Button>
      </div>
      {typeof getIn(form.errors, "locations") === "string" && <FormStatus message={getIn(form.errors, "locations")} />}
      <ol className="flex flex-col gap-3">
        {locations.map((location, index) => (
          <li
            key={index}
            data-path={`locations.${index}`}
            className="grid gap-3 rounded-2xl border-2 border-border p-4 sm:grid-cols-[1fr_1fr_1.5fr_auto] sm:items-end"
          >
            {(["latitude", "longitude"] as const).map((axis) => (
              <FormField
                key={axis}
                label={axis === "latitude" ? "Широта" : "Долгота"}
                error={errorAt(form, `locations.${index}.${axis}`)}
              >
                {(parts) => (
                  <Input
                    {...parts}
                    inputMode="decimal"
                    className="tabular-nums"
                    value={String(location[axis] ?? "")}
                    onChange={(event) =>
                      form.setFieldValue(`locations.${index}.${axis}`, numberOrEmpty(event.target.value))
                    }
                  />
                )}
              </FormField>
            ))}
            <TextInput form={form} path={`locations.${index}.relevantText`} label="Текст на экране блокировки" />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Убрать точку"
              onClick={() =>
                form.setFieldValue(
                  "locations",
                  locations.filter((_, i) => i !== index),
                )
              }
            >
              <Icon icon={Delete02Icon} />
            </Button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PunchIcons({ form }: { form: DesignFormik }) {
  const upload = useUploadTemplateAsset();
  const punch = form.values.punchIcons ?? { target: 6, iconUrl: "" };
  return (
    <div data-path="punchIcons" className="grid gap-4 rounded-2xl sm:grid-cols-[200px_1fr] sm:items-end">
      <FormField label="Штампов до награды" error={errorAt(form, "punchIcons.target")}>
        {(parts) => (
          <Input
            {...parts}
            inputMode="numeric"
            value={String(punch.target ?? "")}
            onChange={(event) =>
              form.setFieldValue("punchIcons", { ...punch, target: numberOrEmpty(event.target.value) })
            }
          />
        )}
      </FormField>
      <div className="flex flex-wrap items-center gap-3">
        {punch.iconUrl && <img src={punch.iconUrl} alt="" className="h-12 w-12 rounded-full object-cover" />}
        <FileButton
          variant="outline"
          size="sm"
          accept="image/png,image/jpeg,image/svg+xml"
          disabled={upload.isPending}
          onFile={async (file) => {
            const saved = await upload.mutateAsync({ slot: "punchIcon", file });
            form.setFieldValue("punchIcons", { ...punch, iconUrl: saved.url });
          }}
        >
          {upload.isPending ? "Загружаем…" : "Картинка штампа"}
        </FileButton>
        {errorAt(form, "punchIcons.iconUrl") && (
          <p className="text-sm text-destructive">{errorAt(form, "punchIcons.iconUrl")}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Редактор дизайна карты. Превью рисует страница — форма отдаёт ей текущие значения,
 * чтобы карта менялась по мере ввода, а не после сохранения.
 */
export function DesignForm({
  design,
  cardType,
  published,
  holders,
  onSave,
  preview,
}: {
  design: PassDesign;
  cardType: CardType;
  published: boolean;
  /** Сколько карт получит обновление — чтобы подтверждение говорило цифрой. */
  holders: number | null;
  onSave: (design: PassDesign) => Promise<unknown>;
  preview: (design: PassDesign) => ReactNode;
}) {
  const [saved, setSaved] = useState(false);

  return (
    <Formik<PassDesign>
      initialValues={design}
      enableReinitialize
      validate={zodValidate(passDesignInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        setSaved(false);
        try {
          await onSave(cleanDesign(values));
          setSaved(true);
        } catch (error) {
          // Проверка схемы перед отправкой — показываем, что именно не так, а не общее «не удалось»
          const issue = (error as { name?: string; issues?: { path: PropertyKey[]; message: string }[] }).issues?.[0];
          if ((error as Error)?.name === "ZodError" && issue) {
            helpers.setStatus(`${describePath(issue.path.map(String).join("."))}: ${issue.message}`);
          } else {
            applyServerIssues(error, helpers, "Не удалось сохранить карту");
          }
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => {
        const saveButton = (
          <Button type={published ? "button" : "submit"} disabled={form.isSubmitting || !form.dirty}>
            {form.isSubmitting ? "Сохраняем…" : published ? "Сохранить и разослать" : "Сохранить"}
          </Button>
        );
        return (
          <Form noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <FocusDesignError form={form} />

            <div className="flex flex-col gap-6">
              <Section
                title="Основное"
                description="Название организации видят в уведомлениях и на экране блокировки, описание — читалки экрана."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput form={form} path="organizationName" label="Организация" />
                  <TextInput form={form} path="logoText" label="Текст рядом с логотипом" />
                </div>
                <TextInput form={form} path="description" label="Описание карты" />
                <Switch
                  checked={form.values.roundLogo}
                  onCheckedChange={(checked) => form.setFieldValue("roundLogo", checked)}
                  label="Круглый логотип"
                  description="Только в нашем превью и на странице карты: настоящий Wallet так не умеет."
                />
              </Section>

              <Section title="Цвета">
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  <ColorInput form={form} path="backgroundColor" label="Фон" />
                  <ColorInput form={form} path="foregroundColor" label="Текст" />
                  <ColorInput form={form} path="labelColor" label="Подписи" />
                </div>
              </Section>

              <Section
                title="Картинки"
                description="PNG, JPG, SVG или PDF до 25 МБ. Сервер сам подгонит размер под место на карте."
              >
                <ul className="flex flex-col gap-4">
                  {IMAGE_SLOTS.map((item) => (
                    <ImageSlotRow key={item.slot} form={form} {...item} />
                  ))}
                </ul>
                <BrandTextMaker form={form} />
              </Section>

              <Section
                title="Поля карты"
                description="Поле бывает живым — баланс, имя, номер карты, уровень: их сервер подставляет сам при каждой выдаче. Остальное — обычный текст, он показывается как написан."
              >
                {FIELD_GROUPS.map((group) => (
                  <FieldGroup key={group.key} form={form} group={group.key} label={group.label} />
                ))}
              </Section>

              <Section title="Штрихкод">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Формат">
                    {(parts) => (
                      <NativeSelect
                        {...parts}
                        name="barcodeFormat"
                        value={form.values.barcodeFormat}
                        onChange={form.handleChange}
                        options={Object.entries(BARCODE_FORMAT_LABELS).map(([value, label]) => ({ value, label }))}
                      />
                    )}
                  </FormField>
                  <TextInput form={form} path="barcodeAltText" label="Подпись под кодом" />
                </div>
              </Section>

              {cardType === "punchCard" && (
                <Section
                  title="Штампы"
                  description="Одна картинка на все клетки: поставленный штамп яркий, остальные — полупрозрачные."
                >
                  <PunchIcons form={form} />
                </Section>
              )}

              <Section
                title="Экран блокировки"
                description="Apple не даёт слать держателям произвольный текст. Показаться на экране блокировки можно только рядом с точкой или в нужное время."
              >
                <Locations form={form} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <DateTimeInput
                    form={form}
                    path="relevantDate"
                    label="Показать в момент"
                    hint="Работает на iOS до 18.1; дальше — только точки."
                  />
                  <DateTimeInput
                    form={form}
                    path="expirationDate"
                    label="Карта гаснет после"
                    hint="После этой даты Wallet покажет её недействительной."
                  />
                </div>
                {EXPIRING_CARD_TYPES.includes(cardType) && (
                  <FormField
                    label="Напомнить за, часов"
                    error={errorAt(form, "hoursBeforeExpiration")}
                    hint="Считается от даты, когда карта гаснет."
                  >
                    {(parts) => (
                      <Input
                        {...parts}
                        inputMode="numeric"
                        className="max-w-[200px]"
                        value={String(form.values.hoursBeforeExpiration ?? "")}
                        onChange={(event) =>
                          form.setFieldValue("hoursBeforeExpiration", numberOrEmpty(event.target.value))
                        }
                      />
                    )}
                  </FormField>
                )}
              </Section>
            </div>

            <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
              {preview(form.values)}

              <div className="flex flex-col gap-3 rounded-card bg-surface p-5">
                {published && (
                  <p className="text-sm text-muted-foreground">
                    Правка уйдёт на все выданные карты сразу — у держателей Wallet перерисует её сам.
                  </p>
                )}
                {form.submitCount > 0 && <DesignErrorSummary errors={flattenErrors(form.errors)} />}
                <FormStatus message={typeof form.status === "string" ? form.status : undefined} />
                {saved && !form.dirty && <FormStatus tone="success" message="Сохранено" />}
                {published ? (
                  <ConfirmDialog
                    trigger={saveButton}
                    title="Разослать изменения?"
                    tone="primary"
                    description={
                      holders
                        ? `Карта обновится у ${holders.toLocaleString("ru-RU")} ${holders % 10 === 1 && holders % 100 !== 11 ? "держателя" : "держателей"} программы сразу после сохранения. Отменить рассылку нельзя — только сохранить новую правку поверх.`
                        : "Карта обновится у всех держателей сразу после сохранения. Отменить рассылку нельзя — только сохранить новую правку поверх."
                    }
                    confirmLabel="Сохранить и разослать"
                    onConfirm={async () => {
                      const errors = await form.validateForm();
                      // submitForm отметит все поля тронутыми — ошибки подсветятся, а фокус уйдёт на первую
                      await form.submitForm();
                      if (Object.keys(errors).length > 0)
                        throw new Error("В карте есть ошибки — они подсвечены в форме.");
                    }}
                  />
                ) : (
                  saveButton
                )}
                {form.dirty && (
                  <Button variant="ghost" onClick={() => form.resetForm()} disabled={form.isSubmitting}>
                    Отменить правки
                  </Button>
                )}
              </div>
            </aside>
          </Form>
        );
      }}
    </Formik>
  );
}
