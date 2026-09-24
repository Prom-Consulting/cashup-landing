import {
  platformApi,
  type AppleRelevanceInput,
  type BonusItemInput,
  type BonusItemQuery,
  type BrandTextInput,
  type BulkIssueInput,
  type CardType,
  type CloneTemplateInput,
  type CreateCertificateInput,
  type CreateCustomTemplateInput,
  type CreateProgramInput,
  type CsrInput,
  type GoogleMessageInput,
  type ImageSlot,
  type PassDesign,
  type PlatformSettingsInput,
  type Template,
  type TierInput,
  type UpdateCertificateInput,
  type UpdateProgramInput,
} from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Программы, шаблоны, сертификаты и настройки — всё платформенное, только агентству. */
export const platformKeys = {
  programs: ["programs"] as const,
  program: (programId: string) => ["programs", programId] as const,
  tiers: (programId: string) => ["programs", programId, "tiers"] as const,
  members: (programId: string) => ["programs", programId, "members"] as const,
  templates: ["templates"] as const,
  template: (templateId: string) => ["templates", templateId] as const,
  library: ["template-library"] as const,
  fonts: ["template-fonts"] as const,
  certificates: ["certificates"] as const,
  settings: ["platform-settings"] as const,
  audit: ["audit-logs"] as const,
  bonusItems: (query: BonusItemQuery) => ["bonus-items", query] as const,
  customers: ["customers"] as const,
};

// ── Программы ────────────────────────────────────────────────────────────────

export function usePrograms() {
  const api = useApi();
  return useQuery({ queryKey: platformKeys.programs, queryFn: () => platformApi(api).programs() });
}

export function useCreateProgram() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProgramInput) => platformApi(api).createProgram(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.programs }),
  });
}

export function useUpdateProgram(programId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProgramInput) => platformApi(api).updateProgram(programId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.programs }),
  });
}

export function useDeleteProgram() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (programId: string) => platformApi(api).deleteProgram(programId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.programs }),
  });
}

export function useUpdateBonusItem(programId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BonusItemInput) => platformApi(api).updateBonusItem(programId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.programs }),
  });
}

export function useUpdateMechanicAccess(programId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (access: Record<string, boolean>) => platformApi(api).updateMechanicAccess(programId, access),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.programs }),
  });
}

export function useProgramMembers(programId: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: platformKeys.members(programId ?? ""),
    queryFn: () => platformApi(api).programMembers(programId!),
    enabled: Boolean(programId),
  });
}

export function useSetAppleRelevance(programId: string) {
  const api = useApi();
  return useMutation({
    mutationFn: (input: AppleRelevanceInput) => platformApi(api).setAppleRelevance(programId, input),
  });
}

export function useSendGoogleMessage(programId: string) {
  const api = useApi();
  return useMutation({
    mutationFn: (input: GoogleMessageInput) => platformApi(api).sendGoogleMessage(programId, input),
  });
}

export function useTiers(programId: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: platformKeys.tiers(programId ?? ""),
    queryFn: () => platformApi(api).tiers(programId!),
    enabled: Boolean(programId),
  });
}

export function useCreateTier(programId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TierInput) => platformApi(api).createTier(programId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.tiers(programId) }),
  });
}

export function useUpdateTier(programId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tierId, input }: { tierId: string; input: TierInput }) =>
      platformApi(api).updateTier(programId, tierId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.tiers(programId) }),
  });
}

export function useDeleteTier(programId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tierId: string) => platformApi(api).deleteTier(programId, tierId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.tiers(programId) }),
  });
}

// ── Шаблоны карт ─────────────────────────────────────────────────────────────

export function useTemplates() {
  const api = useApi();
  return useQuery({ queryKey: platformKeys.templates, queryFn: () => platformApi(api).templates() });
}

export function useTemplate(templateId: string) {
  const api = useApi();
  return useQuery({
    queryKey: platformKeys.template(templateId),
    queryFn: () => platformApi(api).template(templateId),
    enabled: Boolean(templateId),
  });
}

export function useTemplateLibrary() {
  const api = useApi();
  return useQuery({ queryKey: platformKeys.library, queryFn: () => platformApi(api).library(), staleTime: Infinity });
}

export function useBrandFonts() {
  const api = useApi();
  return useQuery({ queryKey: platformKeys.fonts, queryFn: () => platformApi(api).brandFonts(), staleTime: Infinity });
}

/** Ответ любой правки шаблона — шаблон целиком: кладём его в кэш и обновляем список. */
function useTemplateMutation<Input>(run: (input: Input) => Promise<Template>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (saved) => {
      queryClient.setQueryData(platformKeys.template(saved.id), saved);
      return queryClient.invalidateQueries({ queryKey: platformKeys.templates, exact: true });
    },
  });
}

export function useCloneTemplate() {
  const api = useApi();
  return useTemplateMutation((input: CloneTemplateInput) => platformApi(api).cloneTemplate(input));
}

export function useCreateCustomTemplate() {
  const api = useApi();
  return useTemplateMutation((input: CreateCustomTemplateInput) => platformApi(api).createCustomTemplate(input));
}

export function useSaveDesign(templateId: string) {
  const api = useApi();
  return useTemplateMutation((design: PassDesign) => platformApi(api).saveDesign(templateId, design));
}

export function useRenameTemplate(templateId: string) {
  const api = useApi();
  return useTemplateMutation((name: string) => platformApi(api).renameTemplate(templateId, name));
}

export function useSetTemplateCardType(templateId: string) {
  const api = useApi();
  return useTemplateMutation((cardType: CardType) => platformApi(api).setTemplateCardType(templateId, cardType));
}

export function useSetTemplateProgram(templateId: string) {
  const api = useApi();
  return useTemplateMutation((programId: string) => platformApi(api).setTemplateProgram(templateId, programId));
}

export function useSetTemplateCertificates(templateId: string) {
  const api = useApi();
  return useTemplateMutation((input: { appleCertificateId: string | null; googleCertificateId: string | null }) =>
    platformApi(api).setTemplateCertificates(templateId, input),
  );
}

export function useSetTemplateShowcase(templateId: string) {
  const api = useApi();
  return useTemplateMutation((isShowcase: boolean) => platformApi(api).setTemplateShowcase(templateId, isShowcase));
}

/** Выпуск по неопубликованному шаблону бэкенд отклоняет — публикация обязательна. */
export function usePublishTemplate() {
  const api = useApi();
  return useTemplateMutation((templateId: string) => platformApi(api).publishTemplate(templateId));
}

/** Карта платформы одна: флаг переезжает, поэтому обновляем весь список. */
export function useSetDefaultTemplate() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => platformApi(api).setDefaultTemplate(templateId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.templates }),
  });
}

export function useDeleteTemplate() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => platformApi(api).deleteTemplate(templateId),
    onSuccess: (_, templateId) => {
      queryClient.removeQueries({ queryKey: platformKeys.template(templateId) });
      return queryClient.invalidateQueries({ queryKey: platformKeys.templates, exact: true });
    },
  });
}

export function useRevokeTemplateCards() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => platformApi(api).revokeTemplateCards(templateId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["programs"] }),
  });
}

export function useUploadTemplateAsset() {
  const api = useApi();
  return useMutation({
    mutationFn: ({ slot, file, backgroundColor }: { slot: ImageSlot; file: File; backgroundColor?: string }) =>
      platformApi(api).uploadTemplateAsset(slot, file, backgroundColor),
  });
}

export function useRenderBrandText() {
  const api = useApi();
  return useMutation({ mutationFn: (input: BrandTextInput) => platformApi(api).renderBrandText(input) });
}

// ── Карты клиентов ───────────────────────────────────────────────────────────

export function useIssueCardsBulk() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkIssueInput) => platformApi(api).issueCardsBulk(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.customers }),
  });
}

// ── Сертификаты ──────────────────────────────────────────────────────────────

export function useCertificates() {
  const api = useApi();
  return useQuery({ queryKey: platformKeys.certificates, queryFn: () => platformApi(api).certificates() });
}

function useCertificateMutation<Input, Output>(run: (input: Input) => Promise<Output>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.certificates }),
  });
}

export function useCreateCertificate() {
  const api = useApi();
  return useCertificateMutation((input: CreateCertificateInput) => platformApi(api).createCertificate(input));
}

export function useUpdateCertificate(certificateId: string) {
  const api = useApi();
  return useCertificateMutation((input: UpdateCertificateInput) =>
    platformApi(api).updateCertificate(certificateId, input),
  );
}

export function useDeleteCertificate() {
  const api = useApi();
  return useCertificateMutation((certificateId: string) => platformApi(api).deleteCertificate(certificateId));
}

export function useRequestCsr() {
  const api = useApi();
  return useCertificateMutation((input: CsrInput) => platformApi(api).requestCsr(input));
}

export function useDownloadCsr() {
  const api = useApi();
  return useMutation({ mutationFn: (certificateId: string) => platformApi(api).certificateCsr(certificateId) });
}

export function useCompleteCertificate(certificateId: string) {
  const api = useApi();
  return useCertificateMutation((cer: File) => platformApi(api).completeCertificate(certificateId, cer));
}

export function useUploadCertificate(certificateId: string) {
  const api = useApi();
  return useCertificateMutation((input: { p12?: File; password?: string; serviceAccount?: File }) =>
    platformApi(api).uploadCertificate(certificateId, input),
  );
}

export function useSetDefaultCertificate() {
  const api = useApi();
  return useCertificateMutation((certificateId: string) => platformApi(api).setDefaultCertificate(certificateId));
}

/** Проверка, что ключ и сертификат сходятся между собой. */
export function useCertificateHealth() {
  const api = useApi();
  return useMutation({ mutationFn: (certificateId: string) => platformApi(api).certificateHealth(certificateId) });
}

// ── Платформа ────────────────────────────────────────────────────────────────

export function usePlatformSettings() {
  const api = useApi();
  return useQuery({ queryKey: platformKeys.settings, queryFn: () => platformApi(api).platformSettings() });
}

export function useSavePlatformSettings() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlatformSettingsInput) => platformApi(api).savePlatformSettings(input),
    onSuccess: (saved) => queryClient.setQueryData(platformKeys.settings, saved),
  });
}

export function useAuditLogs() {
  const api = useApi();
  return useQuery({ queryKey: platformKeys.audit, queryFn: () => platformApi(api).auditLogs() });
}

export function useBonusItems(query: BonusItemQuery) {
  const api = useApi();
  return useQuery({
    queryKey: platformKeys.bonusItems(query),
    queryFn: () => platformApi(api).bonusItems(query),
    placeholderData: (previous) => previous,
  });
}
