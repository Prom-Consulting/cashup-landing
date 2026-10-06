import {
  ApiError,
  merchantCabinetApi,
  merchantsApi,
  slugify,
  type BuyMonthsInput,
  type CreateMerchantForm,
  type DeductionQuery,
  type Merchant,
  type OctopayFate,
  type RejectInput,
  type RestoreResult,
  type UpdateMerchantInput,
} from "@loal/api";
import { refetchWhilePending, refreshPublicCatalog, useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SITE_URL } from "../../shared/config/env";

/** Заведения платформы. Клиенты и карты сюда не входят — они платформенные. */
export const merchantKeys = {
  all: ["merchants"] as const,
  detail: (id: string) => ["merchants", id] as const,
  members: (id: string) => ["merchants", id, "members"] as const,
  branches: (id: string) => ["merchants", id, "branches"] as const,
  invites: (id: string) => ["merchants", id, "invites"] as const,
  subscription: (id: string) => ["merchants", id, "subscription"] as const,
  deductions: (id: string, query: DeductionQuery) => ["merchants", id, "deductions", query] as const,
  invoices: (id: string) => ["merchants", id, "invoices"] as const,
};

/** includeDeleted — вместе с архивом удалённых магазинов. */
export function useMerchants(includeDeleted = false) {
  const api = useApi();
  return useQuery({
    queryKey: [...merchantKeys.all, { includeDeleted }],
    queryFn: () => merchantsApi(api).list({ includeDeleted }),
  });
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
          // Занят адрес — пробуем следующий; иной 409 (или код не тот) — настоящая ошибка
          const slugTaken =
            error instanceof ApiError && (error.code === "MERCHANT_SLUG_TAKEN" || (error.isConflict && !error.code));
          if (!slugTaken || attempt >= 8) throw error;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: merchantKeys.all });
      refreshPublicCatalog(SITE_URL);
    },
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
      refreshPublicCatalog(SITE_URL);
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
      refreshPublicCatalog(SITE_URL);
    },
  });
}

export function useMerchantMembers(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.members(merchantId),
    queryFn: () => merchantsApi(api).members(merchantId),
    // Кого завели заранее и кто ещё не вошёл — изредка перечитываем, чтобы заметить вход
    refetchInterval: refetchWhilePending,
  });
}

/** Точки заведения — чтобы сразу привязать нового человека к филиалу. */
export function useMerchantBranches(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.branches(merchantId),
    queryFn: () => merchantCabinetApi(api).branches(merchantId),
  });
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
    mutationFn: ({ merchantId, octopay = "keep" }: { merchantId: string; octopay?: OctopayFate }) =>
      merchantsApi(api).remove(merchantId, octopay),
    // Карточка остаётся открытой на чтение — перечитываем и её, и список
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

// ── Заявки, отклонение, возврат из архива, OctōPAY, смена номера ─────────────

/** Список вместе с заявками без заведения (kind: "application"). */
export function useMerchantsWithApplications(includeDeleted: boolean) {
  const api = useApi();
  return useQuery({
    queryKey: [...merchantKeys.all, "with-applications", { includeDeleted }],
    queryFn: () => merchantsApi(api).listWithApplications({ includeDeleted }),
  });
}

/** Отклонить заведение «ждёт проверки» или заявку без заведения. */
export function useRejectMerchant() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, kind, input }: { id: string; kind: "merchant" | "application"; input: RejectInput }) =>
      kind === "merchant" ? merchantsApi(api).reject(id, input) : merchantsApi(api).rejectRegistration(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: merchantKeys.all });
      refreshPublicCatalog(SITE_URL);
    },
  });
}

export const restoreResultKey = (merchantId: string) => [...merchantKeys.detail(merchantId), "restore-result"] as const;

/** Итог последнего возврата этого заведения (до перезагрузки страницы). */
export function useRestoreResult(merchantId: string) {
  const queryClient = useQueryClient();
  const result = useQuery({
    queryKey: restoreResultKey(merchantId),
    queryFn: () => null as RestoreResult | null,
    enabled: false,
    initialData: null,
  });
  return { result: result.data, dismiss: () => queryClient.setQueryData(restoreResultKey(merchantId), null) };
}

export function useRestorePreview(merchantId: string, enabled: boolean) {
  const api = useApi();
  return useQuery({
    queryKey: [...merchantKeys.detail(merchantId), "restore-preview"],
    queryFn: () => merchantsApi(api).restorePreview(merchantId),
    enabled: Boolean(merchantId) && enabled,
    retry: false,
  });
}

export function useRestorePhoneCode(merchantId: string) {
  const api = useApi();
  return useMutation({
    mutationFn: (input: { phone: string; memberId?: string }) => merchantsApi(api).restorePhoneCode(merchantId, input),
  });
}

export function useRestoreMerchant(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (replacements: { memberId?: string; phone: string; code: string }[]) =>
      merchantsApi(api).restore(merchantId, replacements),
    onSuccess: (result) => {
      // Итог показываем уже в рабочей карточке: архивная после возврата сразу сменяется ею
      queryClient.setQueryData(restoreResultKey(merchantId), result);
      void queryClient.invalidateQueries({ queryKey: merchantKeys.all });
      refreshPublicCatalog(SITE_URL);
    },
  });
}

export function useTransferOctopay(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fromMerchantId: string) => merchantsApi(api).transferOctopay(merchantId, fromMerchantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.all }),
  });
}

export function useMemberPhoneCode(merchantId: string) {
  const api = useApi();
  return useMutation({
    mutationFn: ({ memberId, phone }: { memberId: string; phone: string }) =>
      merchantsApi(api).memberPhoneCode(merchantId, memberId, phone),
  });
}

export function useReplaceMemberPhone(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, phone, code }: { memberId: string; phone: string; code: string }) =>
      merchantsApi(api).replaceMemberPhone(merchantId, memberId, { phone, code }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: merchantKeys.members(merchantId) });
      void queryClient.invalidateQueries({ queryKey: merchantKeys.detail(merchantId) });
    },
  });
}
