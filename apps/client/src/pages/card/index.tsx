import { ApiError } from "@loal/api";
import { Button } from "@loal/ui/inputs";
import { ErrorState, Loading } from "@loal/ui/page";
import { Link, useParams } from "react-router";
import { appleWalletUrl, usePassInfo } from "../../entities/card/api";
import { CardView } from "../../widgets/card-view";

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
        <p className="mt-3 text-lg text-slate">
          Проверьте ссылку: возможно, номер набран с ошибкой или карту отозвали.
        </p>
        <Link to="/" className="mt-6 inline-block text-lg text-flame-ink underline underline-offset-4">
          Ввести номер заново
        </Link>
      </div>
    ) : (
      <ErrorState error={pass.error} onRetry={() => pass.refetch()} />
    );
  }

  return (
    <div className="mx-auto flex max-w-[420px] flex-col gap-6">
      <CardView pass={pass.data} />
      <a href={appleWalletUrl(serial)} className="contents">
        <Button type="button" className="w-full">
          Добавить в Apple Wallet
        </Button>
      </a>
      <p className="text-center text-base text-slate">
        Карта обновляется сама: баланс в Wallet меняется после каждой покупки у партнёра.
      </p>
    </div>
  );
}
