import { partnerPublicPath } from "@loal/api";
import { Button, Card, Loading } from "@loal/ui/shadcn";
import { useState } from "react";
import { usePublicPartners } from "../../entities/merchant/api";
import { SITE_URL } from "../../shared/config/env";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          // Буфер обмена недоступен — текст можно выделить вручную
        }
      }}
    >
      {copied ? "Скопировано" : label}
    </Button>
  );
}

/**
 * Ссылка на страницу заведения на loal.kg и значок «Принимаем бонусы Loal». Заведение ставит
 * их в Instagram, на сайт и в 2ГИС: клиенты видят, что здесь платят бонусами, а ссылки
 * с чужих сайтов поднимают и заведение, и Loal в поиске.
 */
export function LoalPageCard({ merchantId }: { merchantId: string }) {
  const catalog = usePublicPartners();
  const site = SITE_URL.replace(/\/$/, "");
  const self = catalog.data?.find((partner) => partner.id === merchantId);
  const url = self ? `${site}${partnerPublicPath(self)}` : null;
  const badge = url
    ? `<a href="${url}" title="Принимаем бонусы Loal"><img src="${site}/badge/loal-bonus.svg" alt="Принимаем бонусы Loal" width="208" height="56"></a>`
    : "";

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold">Ваша страница на loal.kg</h2>
        <p className="mt-1 max-w-[62ch] text-base text-muted-foreground">
          Поставьте ссылку в шапку Instagram, на сайт и в карточку 2ГИС — клиенты увидят, что у вас платят бонусами, а
          поисковики чаще будут показывать ваше заведение.
        </p>
      </div>

      {catalog.isPending && <Loading rows={1} />}
      {catalog.isSuccess && !url && (
        <p className="rounded-2xl bg-muted px-4 py-3 text-base">
          Страница появится, когда заведение будет видно в каталоге Loal: проверьте, что витрина заполнена и подписка
          активна.
        </p>
      )}
      {catalog.isError && (
        <p className="text-base text-muted-foreground">Не удалось проверить каталог — обновите страницу позже.</p>
      )}

      {url && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 truncate text-lg font-bold text-flame-ink underline-offset-4 hover:underline"
            >
              {url.replace(/^https?:\/\//, "")}
            </a>
            <CopyButton text={url} label="Скопировать ссылку" />
          </div>

          <div className="flex flex-col gap-3 rounded-[20px] bg-muted p-4 sm:p-5">
            <p className="text-base font-bold">Значок для сайта</p>
            <a href={url} target="_blank" rel="noreferrer" className="w-fit">
              <img src={`${site}/badge/loal-bonus.svg`} alt="Принимаем бонусы Loal" width={208} height={56} />
            </a>
            <p className="text-sm text-muted-foreground">Вставьте этот код на свой сайт — значок будет вести на вашу страницу.</p>
            <textarea
              readOnly
              rows={3}
              value={badge}
              onFocus={(event) => event.currentTarget.select()}
              aria-label="Код значка для сайта"
              className="w-full resize-none rounded-2xl border-2 border-border bg-surface p-3 font-mono text-xs"
            />
            <CopyButton text={badge} label="Скопировать код" />
          </div>
        </>
      )}
    </Card>
  );
}
