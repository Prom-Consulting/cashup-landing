import { CERTIFICATE_TYPE_LABELS } from "@loal/api";
import { Badge, Card, EmptyState, ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { useCertificateHealthQuery, useCertificates } from "../../entities/platform/api";
import { CertificateActions } from "../../features/certificate/certificate-actions";
import { IssueCertificateDialog } from "../../features/certificate/issue-certificate-dialog";
import { formatDate } from "../../shared/lib/format";

/** Сертификаты подписи карт. Платформенные: Loal подписывает всё своим Pass Type ID. */
/**
 * Если у карты нет рабочего сертификата Apple, сервер не падает, а молча подписывает её
 * тестовой заглушкой — и iPhone отвечает «Safari cannot download this file». Поэтому
 * основной сертификат проверяем сами при каждом открытии страницы.
 */
function SigningHealth({ certificateId, hasAny }: { certificateId: string | null; hasAny: boolean }) {
  const health = useCertificateHealthQuery(certificateId);
  const broken = !certificateId || health.data?.ok === false || health.isError;
  if (certificateId && health.isPending) return null;
  if (!broken) {
    return (
      <p role="status" className="rounded-2xl bg-surface px-5 py-4 text-base">
        <b>Карты подписываются основным сертификатом Apple.</b> Ключ и сертификат сходятся — iPhone примет карту.
      </p>
    );
  }
  return (
    <div role="alert" className="rounded-2xl border-2 border-destructive/50 bg-destructive/5 px-5 py-4 text-base">
      <p className="font-bold text-destructive">Карты сейчас не установятся на iPhone.</p>
      <p className="mt-1">
        {!certificateId
          ? hasAny
            ? "Ни один сертификат Apple не отмечен основным. "
            : "Сертификата Apple нет. "
          : `Основной сертификат не работает: ${health.data?.error ?? (health.error as Error | null)?.message ?? "ключ не читается"}. `}
        Сервер подписывает карты тестовой заглушкой, и Safari отвечает «cannot download this file».
      </p>
      <p className="mt-1 text-muted-foreground">
        Нажмите «Проверить» у каждого сертификата Apple и сделайте основным тот, где ключ и сертификат сходятся. Если у
        шаблона карты сертификат выбран явно — проверьте и его: «Карты» → карта → «Настройки» → «Подпись».
      </p>
    </div>
  );
}

export function CertificatesPage() {
  const certificates = useCertificates();
  const apple = (certificates.data ?? []).filter((item) => item.type === "apple_pass");
  const defaultApple = apple.find((item) => item.isDefault && item.status !== "pending_csr") ?? null;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Сертификаты"
        description="Ими подписываются карты в Apple и Google Wallet. Пока Apple не вернул pass.cer, запись подписывать не может."
        action={<IssueCertificateDialog />}
      />

      {certificates.isSuccess && <SigningHealth certificateId={defaultApple?.id ?? null} hasAny={apple.length > 0} />}
      {certificates.isPending && <Loading rows={2} />}
      {certificates.isError && <ErrorState error={certificates.error} onRetry={() => certificates.refetch()} />}
      {certificates.isSuccess && certificates.data.length === 0 && (
        <EmptyState
          title="Сертификатов нет"
          description="Выпустите сертификат Apple прямо отсюда — Mac для этого не нужен."
        />
      )}

      <div className="flex flex-col gap-3">
        {(certificates.data ?? []).map((certificate) => {
          const expired = certificate.expiresAt ? new Date(certificate.expiresAt) < new Date() : false;
          return (
            <Card key={certificate.id} className="flex flex-col gap-4">
              <div>
                <p className="flex flex-wrap items-center gap-2 text-xl font-bold">
                  {certificate.name ?? "Без названия"}
                  {certificate.isDefault && <Badge tone="good">по умолчанию</Badge>}
                  {certificate.status === "pending_csr" && <Badge tone="warn">ждёт pass.cer от Apple</Badge>}
                  {expired && <Badge tone="warn">истёк</Badge>}
                </p>
                <p className="mt-1 text-base text-muted-foreground">
                  {CERTIFICATE_TYPE_LABELS[certificate.type]}
                  {certificate.passTypeIdentifier ? ` · ${certificate.passTypeIdentifier}` : ""}
                  {certificate.teamId ? ` · команда ${certificate.teamId}` : ""}
                  {certificate.googleIssuerId ? ` · issuer ${certificate.googleIssuerId}` : ""}
                  {certificate.expiresAt ? ` · до ${formatDate(certificate.expiresAt)}` : ""}
                </p>
              </div>
              <CertificateActions certificate={certificate} />
            </Card>
          );
        })}
      </div>
    </section>
  );
}
