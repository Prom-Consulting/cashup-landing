import { Add01Icon } from "@hugeicons/core-free-icons";
import { ApiError } from "@loal/api";
import { useCoverageLimit } from "@loal/app-kit";
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogTrigger,
  EmptyState,
  ErrorState,
  Icon,
  Loading,
  PageHeader,
} from "@loal/ui/shadcn";
import { useState } from "react";
import { Link } from "react-router";
import { useBranches, useCheckoutPoints, useTariff } from "../../entities/merchant/api";
import { useCurrentMerchant } from "../../entities/session/model";
import { CreatePointForm } from "../../features/checkout-points/create-point-form";
import { PointCard } from "../../features/checkout-points/point-card";

const HOW = [
  "Покупатель прикладывает телефон к NFC-метке или сканирует QR на кассе.",
  "Подтверждает номер кодом из WhatsApp, вводит сумму и выбирает, сколько оплатить баллами.",
  "Остаток платит банком через OctōPAY. Оплата появится в «Счёт клиенту» сама.",
];

/**
 * NFC/QR-кассы: покупатель платит сам, без кассира (docs/octopay.md). Работает на тарифе
 * OctōPAY + Loal — деньги идут на основной KGS-счёт, выбранный для Loal в OctōPAY.
 */
export function CheckoutPointsPage() {
  const { merchantId } = useCurrentMerchant();
  const id = merchantId ?? "";
  const { tariff, isPending: tariffPending } = useTariff(id);
  const points = useCheckoutPoints(id);
  const branches = useBranches(id);
  const limit = useCoverageLimit(id);
  const [creating, setCreating] = useState(false);

  const openBranches = (branches.data ?? []).filter((branch) => !branch.archivedAt);
  const allBranches = branches.data ?? [];
  const active = (points.data ?? []).filter((point) => point.isActive);
  const disabled = (points.data ?? []).filter((point) => !point.isActive);
  const branchName = (branchId?: string | null) => allBranches.find((branch) => branch.id === branchId)?.name;

  if (tariffPending) return <Loading rows={3} />;
  if (tariff !== "octopay")
    return (
      <section className="flex max-w-[640px] flex-col gap-6">
        <PageHeader title="NFC-кассы" />
        <Card className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Доступно на тарифе OctōPAY + Loal</h2>
          <p className="text-lg leading-snug text-muted-foreground">
            Покупатель сам оплачивает покупку по NFC-метке или QR: подтверждает телефон, выбирает, сколько отдать баллами,
            и платит остаток банком. Подключите магазин к OctōPAY на главной — раздел заработает.
          </p>
          <div>
            <Button asChild>
              <Link to="/">Подключить OctōPAY</Link>
            </Button>
          </div>
        </Card>
      </section>
    );

  const canCreate = openBranches.length > 0 && limit.isSuccess;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="NFC-кассы"
        description="Метка или QR на кассе — покупатель платит сам, а вы видите оплату в «Счёт клиенту»."
        action={
          canCreate && (
            <Dialog open={creating} onOpenChange={setCreating}>
              <DialogTrigger asChild>
                <Button>
                  <Icon icon={Add01Icon} />
                  Новая касса
                </Button>
              </DialogTrigger>
              <DialogContent
                title="Новая касса"
                description="Название, филиал и проценты нельзя поменять потом — для другой настройки создают новую кассу."
              >
                <CreatePointForm
                  merchantId={id}
                  branches={openBranches}
                  ceiling={limit.data?.maxCoveragePercent ?? null}
                  onCreated={() => setCreating(false)}
                />
              </DialogContent>
            </Dialog>
          )
        }
      />

      <Card>
        <h2 className="text-xl font-bold">Как это работает</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {HOW.map((text, index) => (
            <li key={text} className="flex gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {index + 1}
              </span>
              <span className="text-base leading-snug">{text}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">Кассы</h2>
        {(points.isPending || branches.isPending) && <Loading rows={2} />}
        {points.isError && (
          <ErrorState
            error={
              points.error instanceof ApiError && points.error.status === 404
                ? new Error("NFC-кассы ещё не включены на сервере. Загляните чуть позже.")
                : points.error
            }
            onRetry={() => points.refetch()}
          />
        )}
        {branches.isSuccess && openBranches.length === 0 && (
          <p className="mt-3 text-base text-muted-foreground">
            Сначала создайте филиал в разделе{" "}
            <Link to="/team" className="text-foreground underline underline-offset-4">
              «Команда»
            </Link>
            : касса всегда принадлежит филиалу.
          </p>
        )}
        {points.isSuccess && active.length === 0 && openBranches.length > 0 && (
          <EmptyState
            title="Касс пока нет"
            description="Создайте первую — получите ссылку для NFC-метки и QR для печати."
          />
        )}
        {active.length > 0 && (
          <ul className="mt-4 flex flex-col gap-3">
            {active.map((point) => (
              <PointCard key={point.id} merchantId={id} point={point} branchName={branchName(point.branchId)} />
            ))}
          </ul>
        )}
        {disabled.length > 0 && (
          <details className="mt-5">
            <summary className="cursor-pointer text-base text-muted-foreground">Отключённые · {disabled.length}</summary>
            <ul className="mt-3 flex flex-col gap-3">
              {disabled.map((point) => (
                <PointCard key={point.id} merchantId={id} point={point} branchName={branchName(point.branchId)} />
              ))}
            </ul>
          </details>
        )}
      </Card>
    </section>
  );
}
