import { z } from "zod";
import { barcodeFormatSchema, passFieldSchema } from "./card";

/**
 * Шаблон и есть карта: цвета, надписи, картинки и штрихкод. Правка шаблона
 * доходит до уже выданных карт — сервер поднимает им версию и шлёт push.
 */

export const cardTypeSchema = z.enum(["storeCard", "coupon", "punchCard", "eventTicket", "boardingPass"]);
export type CardType = z.infer<typeof cardTypeSchema>;

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  storeCard: "Баллы и уровни",
  punchCard: "Штампы",
  coupon: "Купон",
  eventTicket: "Билет",
  boardingPass: "Посадочный",
};

/**
 * Какие программы подходят какой карте. Сервер проверяет это сам и на создании,
 * и при смене типа — здесь правило нужно, чтобы не предлагать заведомо неверное.
 */
export const COMPATIBLE_PROGRAM_TYPES: Record<CardType, string[]> = {
  storeCard: [
    "points",
    "tiers",
    "membership",
    "fixed_discount",
    "points_punchcard",
    "points_fixed_discount",
    "fixed_discount_punchcard",
    "onec",
  ],
  punchCard: ["punchcard", "points_punchcard", "fixed_discount_punchcard"],
  coupon: ["fixed_discount", "points_fixed_discount", "fixed_discount_punchcard"],
  eventTicket: ["tiers", "fixed_discount"],
  boardingPass: ["fixed_discount"],
};

export const BARCODE_FORMAT_LABELS: Record<z.infer<typeof barcodeFormatSchema>, string> = {
  PKBarcodeFormatQR: "QR-код",
  PKBarcodeFormatPDF417: "PDF417",
  PKBarcodeFormatAztec: "Aztec",
  PKBarcodeFormatCode128: "Code 128",
};

/**
 * Живые поля: сервер узнаёт их по key и при каждой выдаче подменяет value данными
 * карты. Никакого шаблонного синтаксиса вроде {{…}} нет — у остальных полей value
 * показывается как написано. sample — чем заполнить превью.
 */
export const LIVE_FIELD_KEYS = [
  { key: "balance", label: "Баланс баллов", sample: "100 000" },
  { key: "cardNumber", label: "Номер карты", sample: "LOAL-7F3A" },
  { key: "memberName", label: "Имя клиента", sample: "Айгуль Садыкова" },
  { key: "phone", label: "Телефон клиента", sample: "+996 700 44 55 66" },
  { key: "memberSince", label: "Дата выдачи карты", sample: "24.09.2026" },
  { key: "punch", label: "Штампы", sample: "3 / 6" },
  { key: "tier", label: "Уровень", sample: "Золото" },
  { key: "tierReward", label: "Уровень и выгода", sample: "Золото · 7% баллами" },
  { key: "discount", label: "Скидка программы", sample: "10%" },
  { key: "bonusItem", label: "Бонусный товар", sample: "Кофе × 2" },
] as const;
export type LiveFieldKey = (typeof LIVE_FIELD_KEYS)[number]["key"];

export function liveField(key: string) {
  return LIVE_FIELD_KEYS.find((item) => item.key === key);
}

/** Поле-дата, которому формат даты допустим: у остальных Apple отвергнет карту целиком. */
function isDateValue(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}(T|$)/.test(value) && !Number.isNaN(Date.parse(value));
}

export const FIELD_GROUPS = [
  { key: "headerFields", label: "Верх, рядом с логотипом" },
  { key: "primaryFields", label: "Крупно по центру" },
  { key: "secondaryFields", label: "Под главным" },
  { key: "auxiliaryFields", label: "Дополнительные" },
  { key: "backFields", label: "Оборот карты" },
] as const;
export type FieldGroupKey = (typeof FIELD_GROUPS)[number]["key"];

/** Координаты, рядом с которыми карта всплывает на экране блокировки. */
export const passLocationSchema = z.looseObject({
  latitude: z.number(),
  longitude: z.number(),
  relevantText: z.string().optional(),
});
export type PassLocation = z.infer<typeof passLocationSchema>;

/**
 * Объект design целиком. PUT шаблона принимает именно его — без обёртки, поэтому
 * отправлять надо весь объект, а не изменённые поля.
 */
export const passDesignSchema = z.looseObject({
  organizationName: z.string(),
  description: z.string(),
  logoText: z.string().optional(),
  /** Цвета — строкой rgb(r,g,b). */
  backgroundColor: z.string(),
  foregroundColor: z.string(),
  labelColor: z.string(),
  barcodeFormat: barcodeFormatSchema,
  barcodeAltText: z.string().optional(),
  headerFields: z.array(passFieldSchema).default([]),
  primaryFields: z.array(passFieldSchema).default([]),
  secondaryFields: z.array(passFieldSchema).default([]),
  auxiliaryFields: z.array(passFieldSchema).default([]),
  backFields: z.array(passFieldSchema).default([]),
  images: z
    .looseObject({
      iconUrl: z.string().optional(),
      logoUrl: z.string().optional(),
      stripUrl: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      backgroundUrl: z.string().optional(),
      footerUrl: z.string().optional(),
    })
    .default({}),
  googleImages: z.looseObject({ logoUrl: z.string().optional(), heroImageUrl: z.string().optional() }).default({}),
  /** Круглый логотип — только в нашем превью: у Apple так не бывает. */
  roundLogo: z.boolean().default(false),
  expirationDate: z.string().optional(),
  hoursBeforeExpiration: z.number().optional(),
  relevantDate: z.string().optional(),
  locations: z.array(passLocationSchema).max(10).optional(),
  punchIcons: z.looseObject({ target: z.number(), iconUrl: z.string() }).optional(),
  transitType: z.string().optional(),
});
export type PassDesign = z.infer<typeof passDesignSchema>;

export const templateStatusSchema = z.enum(["draft", "published"]);

export const templateSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  libraryTemplateId: z.string().nullish(),
  cardType: cardTypeSchema,
  design: passDesignSchema,
  status: templateStatusSchema,
  version: z.number().nullish(),
  appleCertificateId: z.string().nullish(),
  googleCertificateId: z.string().nullish(),
  /** Показывается как пример в брифе на лендинге. */
  isShowcase: z.boolean().nullish(),
  /** Карта платформы: её получает клиент, за которого не сказали иначе. Ровно одна. */
  isDefault: z.boolean().nullish(),
  /** Задаётся один раз — потом сменить нельзя. */
  programId: z.string().nullish(),
});
export type Template = z.infer<typeof templateSchema>;

/** Готовая заготовка из библиотеки: с неё начинают, чтобы не собирать карту с нуля. */
export const libraryTemplateSchema = z.looseObject({
  id: z.string(),
  slug: z.string().nullish(),
  name: z.string(),
  industry: z.string().nullish(),
  cardType: cardTypeSchema,
  programTypeHint: z.string().nullish(),
  design: passDesignSchema,
  previewImageUrl: z.string().nullish(),
});
export type LibraryTemplate = z.infer<typeof libraryTemplateSchema>;

/** Шрифт для надписи картинкой: свой шрифт в текстовое поле Wallet не поставить. */
export const brandFontSchema = z.looseObject({
  id: z.string(),
  label: z.string(),
  cssFamily: z.string(),
  weight: z.number(),
});
export type BrandFont = z.infer<typeof brandFontSchema>;

export const IMAGE_SLOTS = [
  { slot: "logo", target: "images.logoUrl", label: "Логотип", hint: "В шапке карты, вписывается без обрезки" },
  { slot: "icon", target: "images.iconUrl", label: "Значок", hint: "В уведомлениях, 58×58, обрезается в квадрат" },
  { slot: "strip", target: "images.stripUrl", label: "Баннер", hint: "Во всю ширину под шапкой" },
  { slot: "thumbnail", target: "images.thumbnailUrl", label: "Миниатюра", hint: "Квадрат у главного поля" },
  { slot: "background", target: "images.backgroundUrl", label: "Фон", hint: "Обрезается под размер карты" },
  {
    slot: "footer",
    target: "images.footerUrl",
    label: "Полоса под штрихкодом",
    hint: "Apple показывает только на посадочном",
  },
  {
    slot: "googleLogo",
    target: "googleImages.logoUrl",
    label: "Логотип Google Wallet",
    hint: "660×660, обрезается в квадрат",
  },
  { slot: "googleHero", target: "googleImages.heroImageUrl", label: "Баннер Google Wallet", hint: "1032×336" },
] as const;
export type ImageSlot = (typeof IMAGE_SLOTS)[number]["slot"] | "punchIcon";

const templateName = z.string().trim().min(1, "Введите название").max(120, "Слишком длинное название");

/** Карта из заготовки: название и программа, остальное берётся из заготовки. */
export const cloneTemplateInputSchema = z.object({
  libraryTemplateId: z.string().min(1, "Выберите заготовку"),
  name: templateName,
  programId: z.string().min(1, "Выберите программу"),
});
export type CloneTemplateInput = z.infer<typeof cloneTemplateInputSchema>;

/** Карта с нуля: тип задаётся сразу, дизайн — минимальный, дальше редактор. */
export const createCustomTemplateInputSchema = z.object({
  name: templateName,
  cardType: cardTypeSchema,
  programId: z.string().min(1, "Выберите программу"),
});
export type CreateCustomTemplateInput = z.infer<typeof createCustomTemplateInputSchema>;

export const renameTemplateInputSchema = z.object({ name: templateName });

export const brandTextInputSchema = z.object({
  text: z.string().trim().min(1, "Введите надпись").max(60, "Не длиннее 60 символов"),
  fontId: z.string().min(1, "Выберите шрифт"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Цвет в виде #rrggbb"),
});
export type BrandTextInput = z.infer<typeof brandTextInputSchema>;

/** Поле карты в редакторе: ключ латиницей — по нему Wallet узнаёт поле при обновлении. */
/**
 * Поле карты в редакторе. Проверяем только то, что проверяют сервер и Apple: ключ есть,
 * значение — строка или число. Пустое значение допустимо — у живого поля его всё равно
 * подменит сервер, а у заготовок из библиотеки такие поля встречаются.
 */
export const passFieldInputSchema = z.looseObject({
  key: z.string().trim().min(1, "Нужен ключ поля"),
  label: z.string().optional(),
  value: z.union([z.string(), z.number()], { error: "Нужно значение" }),
  textAlignment: passFieldSchema.shape.textAlignment,
  changeMessage: z.string().optional(),
});

const rgbColor = z
  .string()
  .regex(/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/, "Цвет в виде rgb(r, g, b) — например rgb(255, 93, 52)");

const GROUP_KEYS = ["headerFields", "primaryFields", "secondaryFields", "auxiliaryFields", "backFields"] as const;

/** Проверка дизайна перед сохранением — те же правила, что у сервера и Apple, но по-русски. */
export const passDesignInputSchema = z
  .looseObject({
    organizationName: z.string().trim().min(1, "Нужно название организации"),
    description: z.string().trim().min(1, "Нужно описание карты"),
    logoText: z.string().optional(),
    backgroundColor: rgbColor,
    foregroundColor: rgbColor,
    labelColor: rgbColor,
    barcodeFormat: barcodeFormatSchema,
    barcodeAltText: z.string().optional(),
    headerFields: z.array(passFieldInputSchema),
    primaryFields: z.array(passFieldInputSchema),
    secondaryFields: z.array(passFieldInputSchema),
    auxiliaryFields: z.array(passFieldInputSchema),
    backFields: z.array(passFieldInputSchema),
    hoursBeforeExpiration: z
      .union([z.literal(""), z.number({ error: "Введите число" }).int("Целое число часов").positive("Больше нуля")])
      .optional(),
    punchIcons: z
      .looseObject({
        target: z.number({ error: "Введите число" }).int("Целое число").min(1, "Хотя бы один штамп"),
        iconUrl: z.string().min(1, "Загрузите картинку штампа"),
      })
      .optional(),
    locations: z
      .array(
        z.object({
          latitude: z.number({ error: "Введите число" }).min(-90, "Широта от −90 до 90").max(90, "Широта от −90 до 90"),
          longitude: z
            .number({ error: "Введите число" })
            .min(-180, "Долгота от −180 до 180")
            .max(180, "Долгота от −180 до 180"),
          relevantText: z.string().optional(),
        }),
      )
      .max(10, "Не больше 10 точек")
      .optional(),
  })
  // Apple отвергает карту, где два поля с одним ключом, — ловим это до сервера
  .superRefine((design, ctx) => {
    const seen = new Map<string, string>();
    for (const group of GROUP_KEYS) {
      (design[group] ?? []).forEach((field, index) => {
        const key = String(field.key ?? "").trim();
        if (!key) return;
        if (seen.has(key)) {
          ctx.addIssue({ code: "custom", path: [group, index, "key"], message: `Ключ «${key}» уже есть на карте` });
        } else {
          seen.set(key, group);
        }
      });
    }
  });

/** rgb(r,g,b) ↔ #rrggbb: палитра браузера говорит на hex, сервер — на rgb(). */
export function rgbToHex(value: string | undefined): string {
  const match = value?.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (!match) return "#000000";
  return `#${match
    .slice(1, 4)
    .map((part) => Math.min(255, Number(part)).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((offset) => parseInt(clean.slice(offset, offset + 2), 16) || 0);
  return `rgb(${r},${g},${b})`;
}

/** Минимальный дизайн для карты с нуля: сервер требует все обязательные поля сразу. */
export function blankDesign(name: string): PassDesign {
  return {
    organizationName: "Loal",
    description: name || "Карта лояльности",
    logoText: "Loal",
    backgroundColor: "rgb(255,51,0)",
    foregroundColor: "rgb(255,255,255)",
    labelColor: "rgb(255,236,214)",
    barcodeFormat: "PKBarcodeFormatQR",
    barcodeAltText: "Покажите код на кассе",
    headerFields: [],
    primaryFields: [{ key: "balance", label: "Баланс", value: "0", changeMessage: "Баланс: %@" }],
    secondaryFields: [],
    auxiliaryFields: [],
    backFields: [],
    images: {},
    googleImages: {},
    roundLogo: false,
  };
}

/**
 * Дизайн из формы в тело запроса: пустые необязательные поля убираем совсем —
 * сервер ждёт либо значение правильного вида, либо отсутствие поля.
 */
export function cleanDesign(design: PassDesign): PassDesign {
  const drop = <T extends Record<string, unknown>>(record: T) =>
    Object.fromEntries(Object.entries(record).filter(([, value]) => value !== "" && value != null)) as T;
  const fields = (list: PassDesign["headerFields"]) =>
    list.map((field) => {
      const next: Record<string, unknown> = {
        ...field,
        label: field.label || undefined,
        // Уведомление об изменении имеет смысл только у живого поля
        changeMessage: liveField(field.key) ? field.changeMessage || undefined : undefined,
      };
      // Формат даты у не-даты ломает установку карты в Wallet целиком (docs/API.md)
      if (field.key !== "memberSince" && !isDateValue(field.value)) {
        delete next.dateStyle;
        delete next.timeStyle;
      }
      // value не выбрасываем даже пустым: сервер требует его у каждого поля
      return { ...drop(next), value: field.value ?? "" } as (typeof list)[number];
    });

  const result: PassDesign = {
    ...design,
    headerFields: fields(design.headerFields),
    primaryFields: fields(design.primaryFields),
    secondaryFields: fields(design.secondaryFields),
    auxiliaryFields: fields(design.auxiliaryFields),
    backFields: fields(design.backFields),
    images: drop(design.images ?? {}),
    googleImages: drop(design.googleImages ?? {}),
  };
  for (const key of ["logoText", "barcodeAltText", "expirationDate", "relevantDate", "transitType"] as const) {
    if (!result[key]) delete result[key];
  }
  if ((result.hoursBeforeExpiration as unknown) === "" || result.hoursBeforeExpiration == null) {
    delete result.hoursBeforeExpiration;
  }
  if (!result.locations?.length) delete result.locations;
  if (!result.punchIcons?.iconUrl) delete result.punchIcons;
  return result;
}

/** Типы карт, у которых есть настоящий срок годности — для них имеет смысл напоминание. */
export const EXPIRING_CARD_TYPES: CardType[] = ["coupon", "eventTicket", "boardingPass"];

/** Пример карты для публичной витрины: цвета, тип и лицевые поля — без внутренностей шаблона. */
export const cardExampleSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  industry: z.string().nullish(),
  previewImageUrl: z.string().nullish(),
  cardType: cardTypeSchema,
  colors: z.looseObject({ background: z.string(), foreground: z.string(), label: z.string() }).nullish(),
  logoUrl: z.string().nullish(),
  stripUrl: z.string().nullish(),
  logoText: z.string().nullish(),
  barcodeFormat: barcodeFormatSchema.nullish(),
  headerFields: z.array(passFieldSchema).default([]),
  primaryFields: z.array(passFieldSchema).default([]),
  secondaryFields: z.array(passFieldSchema).default([]),
  auxiliaryFields: z.array(passFieldSchema).default([]),
});
export type CardExample = z.infer<typeof cardExampleSchema>;
