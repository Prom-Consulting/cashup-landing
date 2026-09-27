import {
  ApiError,
  merchantCabinetApi,
  merchantsApi,
  slugify,
  type BuyMonthsInput,
  type CreateMerchantForm,
  type DeductionQuery,
  type Merchant,
  type UpdateMerchantInput,
} from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Заведения платформы. Клиенты и карты сюда не входят — они платформенные. */
export const merchantKeys = {
  all: ["merchants"] as const,
  detail: (id: string) => ["merchants", id] as const,
  members: (id: string) => ["merchants", id, "members"] as const,
  invites: (id: string) => ["merchants", id, "invites"] as const,
  subscription: (id: string) => ["merchants", id, "subscription"] as const,
  deductions: (id: string, query: DeductionQuery) => ["merchants", id, "deductions", query] as const,
  invoices: (id: string) => ["merchants", id, "invoices"] as const,
};

export function useMerchants() {
  const api = useApi();
  return useQuery({ queryKey: merchantKeys.all, queryFn: () => merchantsApi(api).list() });
}

export function useMerchant(merchantId: string) {
  const api = useApi();
  return useQuery({ queryKey: merchantKeys.detail(merchantId), queryFn: () => merchantsApi(api).get(merchantId) });
}

export type NewMerchant = { values: CreateMerchantForm; logo: File | null; photos: File[] };

/**
 * Новое заведение одним действием: запись, картинки и витрина. Адрес собирается из
 * названия; занят — пробуем с номером. Если заведение создалось, а витрина нет, ошибку
 * не бросаем: заведение уже есть, фото можно дозагрузить в его карточке.
 */
export function useCreateMerchant() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ values, logo, photos }: NewMerchant) => {
      const base = slugify(values.name) || "merchant";
      let merchant: Merchant | null = null;
      for (let attempt = 1; !merchant; attempt += 1) {
        const slug =
          attempt === 1 ? base : attempt <= 5 ? `${base}-${attempt}` : `${base}-${crypto.randomUUID().slice(0, 6)}`;
        try {
          merchant = await merchantsApi(api).create({
            slug,
            name: values.name,
            contactEmail: values.contactEmail,
            contactPhone: values.contactPhone,
          });
        } catch (error) {
          if (!(error instanceof ApiError && error.isConflict) || attempt >= 8) throw error;
        }
      }

      let storefrontError: string | null = null;
      try {
        const cabinet = merchantCabinetApi(api);
        const logoUrl = logo ? (await cabinet.uploadAsset(merchant.id, "merchantLogo", logo)).url : null;
        const photoUrls: string[] = [];
        for (const photo of photos)
          photoUrls.push((await cabinet.uploadAsset(merchant.id, "merchantPhoto", photo)).url);
        await cabinet.saveProfile(merchant.id, {
          category: values.category.trim() || null,
          description: values.description.trim() || null,
          logoUrl,
          photos: photoUrls,
          instagramUrl: null,
          twogisUrl: null,
        });
      } catch (error) {
        storefrontError = error instanceof Error ? error.message : "Витрина не сохранилась";
      }
      return { merchant, storefrontError };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.all }),
  });
}

export function useActivateMerchant(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => merchantsApi(api).activate(merchantId),
    onSuccess: (merchant) => {
      queryClient.setQueryData(merchantKeys.detail(merchantId), merchant);
      queryClient.invalidateQueries({ queryKey: merchantKeys.all });
    },
  });
}

export function useSuspendMerchant(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => merchantsApi(api).suspend(merchantId),
    onSuccess: (merchant) => {
      queryClient.setQueryData(merchantKeys.detail(merchantId), merchant);
      queryClient.invalidateQueries({ queryKey: merchantKeys.all });
    },
  });
}

export function useMerchantMembers(merchantId: string) {
  const api = useApi();
  return useQuery({ queryKey: merchantKeys.members(merchantId), queryFn: () => merchantsApi(api).members(merchantId) });
}

export function useMerchantInvites(merchantId: string) {
  const api = useApi();
  return useQuery({ queryKey: merchantKeys.invites(merchantId), queryFn: () => merchantsApi(api).invites(merchantId) });
}

export function useCreateInvite(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => merchantsApi(api).createInvite(merchantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.invites(merchantId) }),
  });
}

/** Подписка заведения: пока isActive false, оно не принимает бонусы. */
export function useMerchantSubscription(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.subscription(merchantId),
    queryFn: () => merchantCabinetApi(api).subscription(merchantId),
    enabled: Boolean(merchantId),
  });
}

/** Выдача доступа без оплаты — то, чем платформа включает заведение вручную. */
export function useGrantSubscription(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BuyMonthsInput) => merchantCabinetApi(api).grantSubscription(merchantId, input),
    onSuccess: (data) => queryClient.setQueryData(merchantKeys.subscription(merchantId), data),
  });
}

export function useMerchantDeductions(merchantId: string, query: DeductionQuery) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.deductions(merchantId, query),
    queryFn: () => merchantCabinetApi(api).deductions(merchantId, query),
    enabled: Boolean(merchantId),
    placeholderData: (previous) => previous,
  });
}

export function useUpdateMerchant(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMerchantInput) => merchantsApi(api).update(merchantId, input),
    onSuccess: (merchant) => {
      queryClient.setQueryData(merchantKeys.detail(merchantId), merchant);
      return queryClient.invalidateQueries({ queryKey: merchantKeys.all, exact: true });
    },
  });
}

/** Клиенты, карты и баланс остаются — они принадлежат платформе, а не заведению. */
export function useDeleteMerchant() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (merchantId: string) => merchantsApi(api).remove(merchantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.all }),
  });
}

export function useAcceptMember(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => merchantCabinetApi(api).acceptMember(merchantId, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.members(merchantId) }),
  });
}

export function useRemoveMember(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => merchantCabinetApi(api).removeMember(merchantId, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.members(merchantId) }),
  });
}

export function useMerchantInvoices(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.invoices(merchantId),
    queryFn: () => merchantCabinetApi(api).invoices(merchantId),
    enabled: Boolean(merchantId),
  });
}
