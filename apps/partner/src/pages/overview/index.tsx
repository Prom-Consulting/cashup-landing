import { Badge, Card, ErrorState, Loading, PageHeader } from "@loal/ui/page";
import { useCurrentPartner } from "../../entities/session/model";
import { usePartner } from "../../entities/partner/api";
import { formatDate } from "../../shared/lib/format";

/**
 * Главный экран партнёра: что он умеет делать со сканером и ссылка на свой QR,
 * по которому гости заводят карту.
 */
export function OverviewPage() {
  const { memberId, isEmployee } = useCurrentPartner();
  const partner = usePartner(memberId ?? "");

  if (partner.isPending) return <Loading />;
  if (partner.isError) return <ErrorState error={partner.error} onRetry={() => partner.refetch()} />;

  const canEarn = partner.data.permissions?.scan_earn === true;
  const canRedeem = partner.data.permissions?.scan_redeem === true;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Мой QR"
        description="Покажите этот код гостю — он заведёт карту Loal и сразу сможет платить бонусами у вас."
        action={
          <Badge tone={canEarn ? "good" : "neutral"}>
            {canEarn ? "Начисление бонусов" : canRedeem ? "Списание бонусов" : "Операция не назначена"}
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <h2 className="text-xl font-bold">Ссылка на регистрацию гостя</h2>
          {partner.data.enrollQrUrl ? (
            <>
              <p className="mt-3 break-all text-lg">
                <a
                  href={partner.data.enrollQrUrl}
                  className="text-flame-ink underline underline-offset-4"
                  target="_blank"
                  rel="noreferrer"
                >
                  {partner.data.enrollQrUrl}
                </a>
              </p>
              <p className="mt-3 text-base text-slate">
                Распечатайте QR и положите у кассы: гость сканирует, заполняет имя и телефон, карта появляется в Apple
                Wallet.
              </p>
            </>
          ) : (
            <p className="mt-3 max-w-[60ch] text-lg text-slate">
              QR ещё не выпущен. Его создаёт платформа — напишите нам, и ссылка появится здесь.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Условия</h2>
          <dl className="mt-4 flex flex-col gap-3">
            <div>
              <dt className="text-base text-slate">Бонус за гостя</dt>
              <dd className="text-lg">
                {partner.data.partnerBonusAmount ? `${partner.data.partnerBonusAmount} сом` : "не назначен"}
              </dd>
            </div>
            <div>
              <dt className="text-base text-slate">Не чаще, чем</dt>
              <dd className="text-lg">
                {partner.data.partnerBonusMaxPerCustomer
                  ? `${partner.data.partnerBonusMaxPerCustomer} раз на гостя`
                  : "без ограничения"}
              </dd>
            </div>
            <div>
              <dt className="text-base text-slate">Доступ оплачен до</dt>
              <dd className="text-lg">{formatDate(partner.data.partnerPaidUntil)}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {isEmployee && (
        <p className="text-base text-slate">
          Вы вошли как сотрудник партнёра: условия и сотрудников меняет владелец.
        </p>
      )}
    </section>
  );
}
