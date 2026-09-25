import { ApiError } from "@loal/api";
import { ArrowLeft02Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { Button, Dialog, DialogContent, DialogTrigger, ErrorState, Icon, Loading } from "@loal/ui/shadcn";
import { Link, useParams } from "react-router";
import { appleWalletUrl, usePassInfo } from "../../entities/card/api";
import { PaySubscriptionForm } from "../../features/subscription/pay-form";
import { CardView } from "../../widgets/card-view";
import { WalletButtons } from "../../widgets/wallet-buttons";

/** Страница карты по ссылке: /c/<серийный номер>. Вход не нужен — ссылка и есть доступ. */
export function CardPage() {
  const { serial = "" } = useParams();
  const pass = usePassInfo(serial);

  if (pass.isPending) return <Loading label="Открываем карту…" rows={2} />;

  if (pass.isError) {
    const notFound = pass.error instanceof ApiError && pass.error.status === 404;
    return notFound ? (
      <div className="mx-auto max-w-[420px]">
        <h1 className="display text-[2rem]">Такой карты нет</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Проверьте номер: возможно, в нём опечатка или карту отозвали. Если карту выдали в заведении, попросите там
          ссылку заново.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/">
            <Icon icon={ArrowLeft02Icon} />
            Ввести номер заново
          </Link>
        </Button>
      </div>
    ) : (
      <ErrorState error={pass.error} onRetry={() => pass.refetch()} />
    );
  }

  return (
    <div className="mx-auto flex max-w-[420px] flex-col gap-6">
      <CardView pass={pass.data} />

      <div className="flex flex-col gap-3">
        <WalletButtons serial={serial} appleUrl={appleWalletUrl(serial)} />

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="lg">
              <Icon icon={RefreshIcon} />
              Продлить подписку
            </Button>
          </DialogTrigger>
          <DialogContent
            title="Продлить подписку"
            description="Каждый оплаченный месяц — снова 15 000 бонусов. Остаток прошлого месяца не переносится."
          >
            <PaySubscriptionForm serial={serial} />
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-base leading-snug text-muted-foreground">
        Баланс в Wallet обновляется сам после каждой покупки у партнёра — открывать эту страницу заново не нужно.
      </p>
    </div>
  );
}
