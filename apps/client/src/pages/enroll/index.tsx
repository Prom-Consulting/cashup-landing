import { ErrorState, Loading } from "@loal/ui/shadcn";
import { useParams, useSearchParams } from "react-router";
import { useEnrollInfo } from "../../entities/enroll/api";
import { EnrollForm } from "../../features/enroll/enroll-form";

/**
 * Самостоятельная выдача по QR: /enroll — карта платформы, /enroll/:templateId/:programId —
 * названная явно. ?via=… — партнёр, чей QR отсканировали.
 */
export function EnrollPage() {
  const { templateId, programId } = useParams();
  const [params] = useSearchParams();
  const info = useEnrollInfo(templateId);
  const target = templateId && programId ? { templateId, programId } : undefined;

  return (
    <section className="flex flex-col gap-6 pt-2">
      <div>
        <h1 className="display text-[2.25rem] leading-tight">Карта Loal</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Заполните три поля — карта сразу появится, её можно добавить в Apple или Google Wallet. Баллы на неё приносит
          подписка: 100 000 сом бонусами каждый оплаченный месяц.
        </p>
      </div>
      {info.isPending && <Loading rows={3} />}
      {info.isError && <ErrorState error={info.error} onRetry={() => info.refetch()} />}
      {info.isSuccess && <EnrollForm info={info.data} target={target} via={params.get("via") ?? undefined} />}
    </section>
  );
}
