import { Badge, Button, Card, EmptyState, ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { useState } from "react";
import { useCertificateHealth, useCertificates, useSetDefaultCertificate } from "../../entities/platform/api";
import { formatDate } from "../../shared/lib/format";

/** Сертификаты подписи карт. Платформенные: Loal подписывает всё своим Pass Type ID. */
export function CertificatesPage() {
  const certificates = useCertificates();
  const setDefault = useSetDefaultCertificate();
  const health = useCertificateHealth();
  const [checked, setChecked] = useState<{ id: string; text: string } | null>(null);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Сертификаты"
        description="Ими подписываются карты в Apple Wallet. Пока Apple не вернул pass.cer, запись подписывать не может."
      />

      {certificates.isPending && <Loading rows={2} />}
      {certificates.isError && <ErrorState error={certificates.error} onRetry={() => certificates.refetch()} />}
      {certificates.isSuccess && certificates.data.length === 0 && (
        <EmptyState title="Сертификатов нет" description="Их заводит разработчик вместе с Apple Developer." />
      )}

      <div className="flex flex-col gap-3">
        {(certificates.data ?? []).map((certificate) => (
          <Card key={certificate.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xl font-bold">
                  {certificate.name ?? "Без названия"}
                  {certificate.isDefault && (
                    <Badge tone="good" className="ml-3">
                      по умолчанию
                    </Badge>
                  )}
                </p>
                <p className="mt-1 text-base text-muted-foreground">
                  {certificate.passTypeIdentifier ?? "—"}
                  {certificate.teamId ? ` · команда ${certificate.teamId}` : ""}
                  {certificate.expiresAt ? ` · действует до ${formatDate(certificate.expiresAt)}` : ""}
                </p>
                {certificate.status && (
                  <p className="mt-2">
                    <Badge tone={certificate.status === "active" ? "good" : "warn"}>{certificate.status}</Badge>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={health.isPending}
                  onClick={async () => {
                    try {
                      const result = await health.mutateAsync(certificate.id);
                      setChecked({
                        id: certificate.id,
                        text: result.ok ? "Ключ и сертификат сходятся" : (result.message ?? "Проверка не прошла"),
                      });
                    } catch (error) {
                      setChecked({
                        id: certificate.id,
                        text: error instanceof Error ? error.message : "Проверка не прошла",
                      });
                    }
                  }}
                >
                  Проверить
                </Button>
                {!certificate.isDefault && (
                  <Button variant="outline" size="sm" onClick={() => setDefault.mutate(certificate.id)}>
                    Сделать основным
                  </Button>
                )}
              </div>
            </div>

            {checked?.id === certificate.id && (
              <p role="status" className="mt-3 text-base text-muted-foreground">
                {checked.text}
              </p>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
