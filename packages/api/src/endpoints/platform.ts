import { z } from "zod";
import type { ApiClient } from "../http";
import { cardSchema } from "../schemas/card";
import {
  createCustomerInputSchema,
  customerPageSchema,
  customerSchema,
  issueCardInputSchema,
  type CreateCustomerInput,
  type IssueCardInput,
} from "../schemas/customer";
import { uploadedAssetSchema } from "../schemas/merchant";
import {
  appleRelevanceInputSchema,
  auditLogSchema,
  bonusItemInputSchema,
  bonusItemPageSchema,
  bulkIssueInputSchema,
  certificateHealthSchema,
  certificateSchema,
  createCertificateInputSchema,
  createProgramInputSchema,
  csrInputSchema,
  csrPemSchema,
  csrResultSchema,
  googleMessageInputSchema,
  issueCardByPhoneInputSchema,
  platformSettingsInputSchema,
  platformSettingsSchema,
  programMemberSchema,
  programSchema,
  tierBody,
  tierSchema,
  updateCertificateInputSchema,
  updateProgramInputSchema,
  type AppleRelevanceInput,
  type BonusItemInput,
  type BulkIssueInput,
  type CreateCertificateInput,
  type CreateProgramInput,
  type CsrInput,
  type GoogleMessageInput,
  type IssueCardByPhoneInput,
  type PlatformSettingsInput,
  type TierInput,
  type UpdateCertificateInput,
  type UpdateProgramInput,
} from "../schemas/platform";
import {
  blankDesign,
  brandFontSchema,
  brandTextInputSchema,
  cloneTemplateInputSchema,
  createCustomTemplateInputSchema,
  libraryTemplateSchema,
  passDesignSchema,
  renameTemplateInputSchema,
  templateSchema,
  type BrandTextInput,
  type CardType,
  type CloneTemplateInput,
  type CreateCustomTemplateInput,
  type ImageSlot,
  type PassDesign,
} from "../schemas/template";

export type CustomerQuery = { page?: number; pageSize?: number; search?: string; archived?: boolean };

export type BonusItemQuery = { status?: "active" | "redeemed"; page?: number; pageSize?: number; search?: string };

const anything = z.unknown();
const serialPath = (serial: string) => encodeURIComponent(serial);

/**
 * Клиенты, карты, шаблоны и программы принадлежат платформе, а не заведению:
 * в адресах нет merchantId, а доступ есть только у агентства — остальным 403.
 */
export const platformApi = (api: ApiClient) => ({
  // ── Клиенты и карты ────────────────────────────────────────────────────────
  customers: (query: CustomerQuery = {}) => api.request(customerPageSchema, "/admin/v1/customers/table", { query }),

  createCustomer: (input: CreateCustomerInput) =>
    api.request(customerSchema, "/admin/v1/customers", {
      method: "POST",
      body: createCustomerInputSchema.parse(input),
    }),

  /** Архивация необратима: карты клиента отзываются тем же запросом. */
  archiveCustomer: (customerId: string) =>
    api.request(customerSchema, `/admin/v1/customers/${customerId}/archive`, { method: "POST", body: {} }),

  customerCards: (customerId: string) => api.request(z.array(cardSchema), `/admin/v1/customers/${customerId}/cards`),

  issueCard: (input: IssueCardInput) =>
    api.request(cardSchema, "/admin/v1/cards", { method: "POST", body: issueCardInputSchema.parse(input) }),

  /**
   * Выдать карту человеку. templateId и programId можно не слать — тогда выдаётся
   * карта платформы по умолчанию. Клиент заводится по телефону, если его ещё нет.
   */
  issueCardByPhone: (input: IssueCardByPhoneInput) =>
    api.request(cardSchema, "/admin/v1/cards", { method: "POST", body: issueCardByPhoneInputSchema.parse(input) }),

  /** Карта платформы по умолчанию существующему клиенту. Прежняя карта отзывается, баланс переезжает. */
  issueDefaultCard: (customerId: string) =>
    api.request(cardSchema, "/admin/v1/cards", { method: "POST", body: { customerId } }),

  /** Выдать карты сразу нескольким клиентам по одной карте и программе. */
  issueCardsBulk: (input: BulkIssueInput) => {
    const { customerIds, templateId, programId } = bulkIssueInputSchema.parse(input);
    return api.request(anything, "/admin/v1/cards/bulk", {
      method: "POST",
      body: { cards: customerIds.map((customerId) => ({ customerId, templateId, programId })) },
    });
  },

  revokeCard: (serial: string) =>
    api.request(cardSchema, `/admin/v1/cards/${serialPath(serial)}/revoke`, { method: "POST", body: {} }),

  /** Поставить уровень руками. */
  setCardTier: (serial: string, tierId: string) =>
    api.request(cardSchema, `/admin/v1/cards/${serialPath(serial)}/tier`, { method: "PATCH", body: { tierId } }),

  // ── Шаблоны карт ───────────────────────────────────────────────────────────
  templates: () => api.request(z.array(templateSchema), "/admin/v1/templates"),

  template: (templateId: string) => api.request(templateSchema, `/admin/v1/templates/${templateId}`),

  library: () => api.request(z.array(libraryTemplateSchema), "/admin/v1/template-library"),

  /** Клонирует заготовку из библиотеки — дальше карту правят в редакторе. */
  cloneTemplate: (input: CloneTemplateInput) =>
    api.request(templateSchema, "/admin/v1/templates", { method: "POST", body: cloneTemplateInputSchema.parse(input) }),

  /** Карта с нуля: сервер требует весь design сразу, поэтому шлём минимальный. */
  createCustomTemplate: (input: CreateCustomTemplateInput) => {
    const parsed = createCustomTemplateInputSchema.parse(input);
    return api.request(templateSchema, "/admin/v1/templates/custom", {
      method: "POST",
      body: { ...parsed, design: blankDesign(parsed.name) },
    });
  },

  /**
   * Весь дизайн целиком. Правка сразу уходит на все выданные по шаблону карты:
   * сервер поднимает им версию и шлёт push. Отката нет.
   */
  saveDesign: (templateId: string, design: PassDesign) =>
    api.request(templateSchema, `/admin/v1/templates/${templateId}`, {
      method: "PUT",
      body: passDesignSchema.parse(design),
    }),

  renameTemplate: (templateId: string, name: string) =>
    api.request(templateSchema, `/admin/v1/templates/${templateId}/name`, {
      method: "PUT",
      body: renameTemplateInputSchema.parse({ name }),
    }),

  /** Тип карты и тип программы должны сочетаться — иначе сервер ответит 400. */
  setTemplateCardType: (templateId: string, cardType: CardType) =>
    api.request(templateSchema, `/admin/v1/templates/${templateId}/card-type`, { method: "PUT", body: { cardType } }),

  /** Программу задают один раз: когда она уже есть, сервер откажет. */
  setTemplateProgram: (templateId: string, programId: string) =>
    api.request(templateSchema, `/admin/v1/templates/${templateId}/program`, { method: "PUT", body: { programId } }),

  /** null — подписывать сертификатом по умолчанию. */
  setTemplateCertificates: (
    templateId: string,
    input: { appleCertificateId: string | null; googleCertificateId: string | null },
  ) => api.request(templateSchema, `/admin/v1/templates/${templateId}/certificates`, { method: "PUT", body: input }),

  /** Показывать ли карту примером в брифе на лендинге. */
  setTemplateShowcase: (templateId: string, isShowcase: boolean) =>
    api.request(templateSchema, `/admin/v1/templates/${templateId}/showcase`, { method: "PUT", body: { isShowcase } }),

  publishTemplate: (templateId: string) =>
    api.request(templateSchema, `/admin/v1/templates/${templateId}/publish`, { method: "POST", body: {} }),

  /** Карта платформы одна: флаг снимается с прежней. Черновик основным не делается. */
  setDefaultTemplate: (templateId: string) =>
    api.request(templateSchema, `/admin/v1/templates/${templateId}/default`, { method: "PUT", body: {} }),

  /** Сервер откажет, пока по шаблону есть неотозванные карты. */
  deleteTemplate: (templateId: string) =>
    api.request(anything, `/admin/v1/templates/${templateId}`, { method: "DELETE" }),

  /** Отозвать все карты, выданные по шаблону, — обычно перед его удалением. */
  revokeTemplateCards: (templateId: string) =>
    api.request(anything, `/admin/v1/cards/by-template/${templateId}/revoke`, { method: "POST", body: {} }),

  /** Картинка карты: PNG, JPG, SVG или PDF до 25 МБ, на выходе всегда PNG. */
  uploadTemplateAsset: (slot: ImageSlot, file: File, backgroundColor?: string) => {
    const body = new FormData();
    body.append("file", file);
    if (backgroundColor) body.append("backgroundColor", backgroundColor);
    return api.request(uploadedAssetSchema, "/admin/v1/template-assets", { method: "POST", body, query: { slot } });
  },

  brandFonts: () => api.request(z.array(brandFontSchema), "/admin/v1/template-assets/fonts"),

  /** Надпись нужным шрифтом, нарисованная картинкой — её кладут в images.logoUrl. */
  renderBrandText: (input: BrandTextInput) =>
    api.request(uploadedAssetSchema, "/admin/v1/template-assets/render-brand-text", {
      method: "POST",
      body: brandTextInputSchema.parse(input),
    }),

  // ── Программы ──────────────────────────────────────────────────────────────
  programs: () => api.request(z.array(programSchema), "/admin/v1/loyalty-programs"),

  program: (programId: string) => api.request(programSchema, `/admin/v1/loyalty-programs/${programId}`),

  /** Программа Loal — тип onec: своей математики нет, баллы выдаёт подписка. */
  createProgram: (input: CreateProgramInput) => {
    const { name, pointsPerPeriod } = createProgramInputSchema.parse(input);
    return api.request(programSchema, "/admin/v1/loyalty-programs", {
      method: "POST",
      body: { name, programType: "onec", config: { pointsPerPeriod } },
    });
  },

  updateProgram: (programId: string, input: UpdateProgramInput) => {
    const { name, pointsPerPeriod, active } = updateProgramInputSchema.parse(input);
    return api.request(programSchema, `/admin/v1/loyalty-programs/${programId}`, {
      method: "PATCH",
      body: { name, active, config: { pointsPerPeriod } },
    });
  },

  deleteProgram: (programId: string) =>
    api.request(anything, `/admin/v1/loyalty-programs/${programId}`, { method: "DELETE" }),

  /** Бонусный товар шлётся целиком: сервер заменяет все пять полей разом. */
  updateBonusItem: (programId: string, input: BonusItemInput) => {
    const parsed = bonusItemInputSchema.parse(input);
    return api.request(programSchema, `/admin/v1/loyalty-programs/${programId}/bonus-item`, {
      method: "PATCH",
      body: {
        bonusItemEnabled: parsed.bonusItemEnabled,
        bonusItemName: parsed.bonusItemName || null,
        bonusItemMode: parsed.bonusItemMode,
        bonusItemOptions: parsed.bonusItemOptions
          .split("\n")
          .map((option) => option.trim())
          .filter(Boolean),
        bonusItemPartnerAccess: parsed.bonusItemPartnerAccess,
      },
    });
  },

  updateMechanicAccess: (programId: string, mechanicPartnerAccess: Record<string, boolean>) =>
    api.request(programSchema, `/admin/v1/loyalty-programs/${programId}/mechanic-access`, {
      method: "PATCH",
      body: { mechanicPartnerAccess },
    }),

  /** Кто держит карту программы. */
  programMembers: (programId: string) =>
    api.request(z.array(programMemberSchema), `/admin/v1/loyalty-programs/${programId}/members`),

  /** Прописывает условия появления на экране блокировки и пушит обновление всем картам. */
  setAppleRelevance: (programId: string, input: AppleRelevanceInput) =>
    api.request(anything, `/admin/v1/loyalty-programs/${programId}/notifications/apple-relevance`, {
      method: "POST",
      body: appleRelevanceInputSchema.parse(input),
    }),

  /** Текстовое сообщение — только тем, у кого карта в Google Wallet. */
  sendGoogleMessage: (programId: string, input: GoogleMessageInput) =>
    api.request(anything, `/admin/v1/loyalty-programs/${programId}/notifications/google-message`, {
      method: "POST",
      body: googleMessageInputSchema.parse(input),
    }),

  tiers: (programId: string) => api.request(z.array(tierSchema), `/admin/v1/loyalty-programs/${programId}/tiers`),

  createTier: (programId: string, input: TierInput) =>
    api.request(tierSchema, `/admin/v1/loyalty-programs/${programId}/tiers`, { method: "POST", body: tierBody(input) }),

  updateTier: (programId: string, tierId: string, input: TierInput) =>
    api.request(tierSchema, `/admin/v1/loyalty-programs/${programId}/tiers/${tierId}`, {
      method: "PATCH",
      body: tierBody(input),
    }),

  deleteTier: (programId: string, tierId: string) =>
    api.request(anything, `/admin/v1/loyalty-programs/${programId}/tiers/${tierId}`, { method: "DELETE" }),

  // ── Сертификаты ────────────────────────────────────────────────────────────
  certificates: () => api.request(z.array(certificateSchema), "/admin/v1/certificates"),

  /** Запись вручную; ключ потом загружается файлом. */
  createCertificate: (input: CreateCertificateInput) =>
    api.request(certificateSchema, "/admin/v1/certificates", {
      method: "POST",
      body: createCertificateInputSchema.parse(input),
    }),

  updateCertificate: (certificateId: string, input: UpdateCertificateInput) =>
    api.request(certificateSchema, `/admin/v1/certificates/${certificateId}`, {
      method: "PATCH",
      body: updateCertificateInputSchema.parse(input),
    }),

  deleteCertificate: (certificateId: string) =>
    api.request(anything, `/admin/v1/certificates/${certificateId}`, { method: "DELETE" }),

  /** Выпуск без Mac: сервер делает ключ и отдаёт запрос для Apple Developer. */
  requestCsr: (input: CsrInput) =>
    api.request(csrResultSchema, "/admin/v1/certificates/csr", { method: "POST", body: csrInputSchema.parse(input) }),

  /** Скачать тот же запрос ещё раз: новый дал бы новый ключ, и выданный pass.cer к нему не подошёл бы. */
  certificateCsr: (certificateId: string) => api.request(csrPemSchema, `/admin/v1/certificates/${certificateId}/csr`),

  /** Вторая половина выпуска: pass.cer, который вернул Apple. Чужой файл сервер отклонит. */
  completeCertificate: (certificateId: string, cer: File) => {
    const body = new FormData();
    body.append("cer", cer);
    return api.request(certificateSchema, `/admin/v1/certificates/${certificateId}/complete`, { method: "POST", body });
  },

  /** Готовый ключ: .p12 с паролем для Apple или JSON сервисного аккаунта для Google. */
  uploadCertificate: (certificateId: string, input: { p12?: File; password?: string; serviceAccount?: File }) => {
    const body = new FormData();
    if (input.p12) body.append("p12", input.p12);
    // docs/API.md называет поле password, certificates.controller.ts читает p12Password —
    // шлём оба, пока они не договорились
    if (input.password) {
      body.append("p12Password", input.password);
      body.append("password", input.password);
    }
    if (input.serviceAccount) body.append("serviceAccount", input.serviceAccount);
    return api.request(anything, `/admin/v1/certificates/${certificateId}/upload`, { method: "POST", body });
  },

  /** Проверяет, что ключ и сертификат сходятся между собой. */
  certificateHealth: (certificateId: string) =>
    api.request(certificateHealthSchema, `/admin/v1/certificates/${certificateId}/health`),

  setDefaultCertificate: (certificateId: string) =>
    api.request(certificateSchema, `/admin/v1/certificates/${certificateId}/set-default`, { method: "POST", body: {} }),

  // ── Платформа ──────────────────────────────────────────────────────────────
  platformSettings: () => api.request(platformSettingsSchema, "/admin/v1/platform-settings"),

  savePlatformSettings: (input: PlatformSettingsInput) =>
    api.request(platformSettingsSchema, "/admin/v1/platform-settings", {
      method: "PATCH",
      body: platformSettingsInputSchema.parse(input),
    }),

  auditLogs: () => api.request(z.array(auditLogSchema), "/admin/v1/audit-logs"),

  /** Наследие прежнего продукта: подарки на карте. */
  bonusItems: (query: BonusItemQuery = {}) => api.request(bonusItemPageSchema, "/admin/v1/bonus-items", { query }),
});
