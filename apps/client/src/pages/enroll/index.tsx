import { ErrorState, Loading } from "@loal/ui/shadcn";
import { Navigate, useLocation, useSearchParams } from "react-router";
import { useEnrollInfo } from "../../entities/enroll/api";
import { EnrollForm } from "../../features/enroll/enroll-form";

/**
 * Самостоятельная выдача по QR — карта платформы. ?via=… — партнёр, чей QR отсканировали.
 */
export function EnrollPage() {
  const [params] = useSearchParams();
  const info = useEnrollInfo();

  return (
    <section className="flex flex-col gap-6 pt-2">
      <div>
        <h1 className="display text-[2.25rem] leading-tight">Карта Loal</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Заполните три поля — карта сразу появится, её можно добавить в Apple или Google Wallet. Баллы на неё приносит
          подписка: 15 000 бонусов на каждый оплаченный цикл.
        </p>
      </div>
      {info.isPending && <Loading rows={3} />}
      {info.isError && <ErrorState error={info.error} onRetry={() => info.refetch()} />}
      {info.isSuccess && <EnrollForm info={info.data} via={params.get("via") ?? undefined} />}
    </section>
  );
}

/** Старые QR с программой в адресе: той выдачи больше нет — ведём на карту платформы, ?via сохраняем. */
export function LegacyEnrollRedirect() {
  const location = useLocation();
  return <Navigate to={{ pathname: "/enroll", search: location.search }} replace />;
}
