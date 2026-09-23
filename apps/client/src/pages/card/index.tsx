import { ApiError } from "@loal/api";
import { AppleIcon, ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { Button, Card, ErrorState, Icon, Loading } from "@loal/ui/shadcn";
import { Link, useParams } from "react-router";
import { appleWalletUrl, usePassInfo } from "../../entities/card/api";
import { CardView } from "../../widgets/card-view";
import { PaySubscriptionForm } from "../../features/subscription/pay-form";

/** Страница карты по ссылке: /c/<серийный номер>. Вход не нужен — ссылка и есть доступ. */
export function CardPage() {
  const { serial = "" } = useParams();
  const pass = usePassInfo(serial);

  if (pass.isPending) return <Loading label="Открываем карту…" />;

  if (pass.isError) {
    const notFound = pass.error instanceof ApiError && pass.error.status === 404;
    return notFound ? (
      <div className="mx-auto max-w-[420px] text-center">
        <h1 className="display text-[2rem]">Карта не найдена</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Проверьте ссылку: возможно, номер набран с ошибкой или карту отозвали.
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
      <Button asChild size="lg" className="w-full">
        <a href={appleWalletUrl(serial)}>
          <Icon icon={AppleIcon} />
          Добавить в Apple Wallet
        </a>
      </Button>
      <p className="text-center text-base text-muted-foreground">
        Карта обновляется сама: баланс в Wallet меняется после каждой покупки у партнёра.
      </p>

      <Card>
        <h2 className="text-xl font-bold">Продлить подписку</h2>
        <p className="mt-2 text-base text-muted-foreground">
          Каждый оплаченный месяц на карте снова 100 000 сом бонусами. Остаток прошлого месяца сгорает.
        </p>
        <div className="mt-5">
          <PaySubscriptionForm serial={serial} />
        </div>
      </Card>
    </div>
  );
}
