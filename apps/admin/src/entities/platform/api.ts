import { platformApi, type CreateProgramInput, type CreateTierInput, type PlatformSettingsInput } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Программы, шаблоны, сертификаты и настройки — всё платформенное, только агентству. */
export const platformKeys = {
  programs: ["programs"] as const,
  tiers: (programId: string) => ["programs", programId, "tiers"] as const,
  templates: ["templates"] as const,
  certificates: ["certificates"] as const,
  settings: ["platform-settings"] as const,
  audit: ["audit-logs"] as const,
};

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
    mutationFn: (input: CreateTierInput) => platformApi(api).createTier(programId, input),
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

export function useTemplates() {
  const api = useApi();
  return useQuery({ queryKey: platformKeys.templates, queryFn: () => platformApi(api).templates() });
}

/** Выпуск по неопубликованному шаблону бэкенд отклоняет — публикация обязательна. */
export function usePublishTemplate() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => platformApi(api).publishTemplate(templateId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.templates }),
  });
}

export function useCertificates() {
  const api = useApi();
  return useQuery({ queryKey: platformKeys.certificates, queryFn: () => platformApi(api).certificates() });
}

export function useSetDefaultCertificate() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (certificateId: string) => platformApi(api).setDefaultCertificate(certificateId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.certificates }),
  });
}

/** Проверка, что ключ и сертификат сходятся между собой. */
export function useCertificateHealth() {
  const api = useApi();
  return useMutation({ mutationFn: (certificateId: string) => platformApi(api).certificateHealth(certificateId) });
}

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
