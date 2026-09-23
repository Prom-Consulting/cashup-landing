import { z } from "zod";

/** Одно поле на карте Wallet: подпись и значение уже подставлены сервером. */
export const passFieldSchema = z.looseObject({
  key: z.string(),
  label: z.string().optional(),
  value: z.union([z.string(), z.number()]),
});
export type PassField = z.infer<typeof passFieldSchema>;

export const barcodeFormatSchema = z.enum([
  "PKBarcodeFormatQR",
  "PKBarcodeFormatPDF417",
  "PKBarcodeFormatAztec",
  "PKBarcodeFormatCode128",
]);

/**
 * Что отдаёт публичная ручка карты по серийному номеру. Показывается
 * держателю карты в браузере, без входа: баланс, штрихкод, поля и цвета.
 */
export const publicPassInfoSchema = z.looseObject({
  organizationName: z.string(),
  description: z.string(),
  logoText: z.string().optional(),
  backgroundColor: z.string(),
  foregroundColor: z.string(),
  labelColor: z.string(),
  status: z.string(),
  barcodeValue: z.string(),
  barcodeFormat: barcodeFormatSchema,
  barcodeAltText: z.string().optional(),
  headerFields: z.array(passFieldSchema).default([]),
  primaryFields: z.array(passFieldSchema).default([]),
  secondaryFields: z.array(passFieldSchema).default([]),
  auxiliaryFields: z.array(passFieldSchema).default([]),
  backFields: z.array(passFieldSchema).default([]),
  pointsBalance: z.number(),
  punchCount: z.number(),
});
export type PublicPassInfo = z.infer<typeof publicPassInfoSchema>;

/** Карта как её отдаёт GET /v1/cards/{serial}. */
export const cardSchema = z.looseObject({
  serialNumber: z.string(),
  storeId: z.string(),
  customerId: z.string().nullish(),
  status: z.enum(["active", "suspended", "revoked"]),
  pointsBalance: z.number(),
  punchCount: z.number().nullish(),
  barcodeValue: z.string().nullish(),
  platform: z.string().nullish(),
  createdAt: z.string().nullish(),
});
export type Card = z.infer<typeof cardSchema>;

export const googleSaveLinkSchema = z.looseObject({ url: z.string() });
