import { CoverageLimitForm, useMerchantProfile } from "@loal/app-kit";
import { Card, ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { useCashierSession } from "../../entities/cashier/api";

/** Витрина магазина — кассиру только посмотреть: меняет её владелец в кабинете партнёра. */
export function StorefrontPage() {
  const { merchantId } = useCashierSession();
  const profile = useMerchantProfile(merchantId);

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
          <p className="text-lg">
            {profile.data.category ?? "Категория не указана"} — {profile.data.description ?? "описания пока нет"}
          </p>
          {profile.data.address && <p className="mt-2 text-base text-muted-foreground">{profile.data.address}</p>}
          <p className="mt-3 text-base text-muted-foreground">
            Менять витрину может владелец заведения. Попросите его дополнить описание.
          </p>
        </Card>
      )}
      {merchantId && (
        <Card>
          <h2 className="text-xl font-bold">Сколько закрывают бонусы</h2>
          <p className="mt-1 mb-5 max-w-[62ch] text-base text-muted-foreground">
            Потолок процента на одну позицию. Клиент видит его в каталоге как «до N%», касса не даёт его превысить.
          </p>
          <CoverageLimitForm merchantId={merchantId} canEdit={false} />
        </Card>
      )}
    </section>
  );
}
