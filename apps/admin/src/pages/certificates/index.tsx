import { CERTIFICATE_TYPE_LABELS } from "@loal/api";
import { Badge, Card, EmptyState, ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { useCertificates } from "../../entities/platform/api";
import { CertificateActions } from "../../features/certificate/certificate-actions";
import { IssueCertificateDialog } from "../../features/certificate/issue-certificate-dialog";
import { formatDate } from "../../shared/lib/format";

/** Сертификаты подписи карт. Платформенные: Loal подписывает всё своим Pass Type ID. */
export function CertificatesPage() {
  const certificates = useCertificates();

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Сертификаты"
        description="Ими подписываются карты в Apple и Google Wallet. Пока Apple не вернул pass.cer, запись подписывать не может."
        action={<IssueCertificateDialog />}
      />

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
