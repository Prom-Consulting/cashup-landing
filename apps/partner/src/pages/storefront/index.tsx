import { Card, ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { useCurrentMerchant } from "../../entities/session/model";
import { useProfile } from "../../entities/merchant/api";
import { ProfileForm } from "../../features/storefront/profile-form";

/** Витрина: то, что клиент видит о заведении в каталоге до того, как зайдёт. */
export function StorefrontPage() {
  const { merchantId, canManage } = useCurrentMerchant();
  const profile = useProfile(merchantId ?? "");

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Витрина"
        description="Как заведение выглядит в каталоге Loal: категория, описание, логотип и фотографии."
      />

      {profile.isPending && <Loading />}
      {profile.isError && <ErrorState error={profile.error} onRetry={() => profile.refetch()} />}

      {profile.isSuccess && (
        <Card>
          {canManage ? (
            <ProfileForm merchantId={merchantId!} profile={profile.data} />
          ) : (
            <>
              <p className="text-lg">
                {profile.data.category ?? "Категория не указана"} — {profile.data.description ?? "описания пока нет"}
              </p>
              <p className="mt-3 text-base text-muted-foreground">
                Менять витрину может владелец заведения. Попросите его дополнить описание.
              </p>
            </>
          )}
        </Card>
      )}
    </section>
  );
}
