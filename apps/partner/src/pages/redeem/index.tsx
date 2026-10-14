import { CashbackForm, RedeemForm, useCoverageLimit } from "@loal/app-kit";
import { ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { useSearchParams } from "react-router";
import { useBranches, useTariff } from "../../entities/merchant/api";
import { useCurrentMerchant } from "../../entities/session/model";

type Mode = "redeem" | "cashback";

const COPY: Record<Mode, { title: string; description: string }> = {
  redeem: {
    title: "Списать бонусы",
    description: "Отсканируйте карту и добавьте покупку — бонусы закроют часть цены, остальное клиент платит как обычно.",
  },
  cashback: {
    title: "Дать кэшбэк",
    description:
      "Клиент заплатил деньгами — отсканируйте его карту и введите сумму. Кэшбэк придёт бонусами на карту, тратить их можно у партнёров Loal.",
  },
};

const tab = (active: boolean) =>
  `rounded-full px-5 py-2.5 text-base font-bold transition-colors ${active ? "bg-graphite text-white" : "text-muted-foreground hover:text-foreground"}`;

/**
 * Касса в браузере. Что на ней можно, решает тариф: «Ещё больше клиентов» — списание,
 * «Больше клиентов» — кэшбэк, «Очень много клиентов» — то и другое с переключателем.
 */
export function RedeemPage() {
  const { merchantId, memberships, isBranchAdmin, branchIds } = useCurrentMerchant();
  const { abilities, isPending } = useTariff(merchantId ?? "");
  const limit = useCoverageLimit(abilities.redeem ? (merchantId ?? "") : "");
  const branches = useBranches(merchantId ?? "");
  const [params, setParams] = useSearchParams();
  // Администратор нескольких филиалов выбирает, на какой записать операцию; владельцу филиал не нужен
  const workBranches = isBranchAdmin
    ? (branches.data ?? []).filter((branch) => !branch.archivedAt && branchIds.includes(branch.id))
    : undefined;
  const asked: Mode = params.get("mode") === "cashback" ? "cashback" : "redeem";
  const mode: Mode = !abilities.redeem ? "cashback" : !abilities.cashback ? "redeem" : asked;
  // С одним местом работы сервер сам знает заведение и лишнее поле отклоняет
  const placeId = memberships.length > 1 ? (merchantId ?? undefined) : undefined;

  if (isPending || !merchantId) return <Loading rows={4} />;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={COPY[mode].title} description={COPY[mode].description} />

      {abilities.redeem && abilities.cashback && (
        <div role="tablist" aria-label="Что делаем" className="flex w-fit gap-1 rounded-full bg-surface p-1 shadow-[0_0.5rem_1.5rem_rgb(22_21_21/0.06)]">
          {(["redeem", "cashback"] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={mode === item}
              className={tab(mode === item)}
              onClick={() => setParams(item === "cashback" ? { mode: "cashback" } : {}, { replace: true })}
            >
              {COPY[item].title}
            </button>
          ))}
        </div>
      )}

      {mode === "cashback" ? (
        <CashbackForm key="cashback" merchantId={placeId} branches={workBranches} />
      ) : (
        <>
          {limit.isPending && <Loading rows={3} />}
          {limit.isError && <ErrorState error={limit.error} onRetry={() => limit.refetch()} />}
          {limit.isSuccess && (
            <RedeemForm key="redeem" ceiling={limit.data.maxCoveragePercent} merchantId={placeId} branches={workBranches} />
          )}
        </>
      )}
    </section>
  );
}
