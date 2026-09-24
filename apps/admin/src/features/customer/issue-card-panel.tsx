import { useIssueCard } from "@loal/app-kit";
import { Button, FormField, FormStatus, NativeSelect } from "@loal/ui/shadcn";
import { useState } from "react";
import { Link } from "react-router";
import { useIssueDefaultCard } from "../../entities/card/api";
import { useTemplates } from "../../entities/platform/api";

/**
 * Выдача карты клиенту. Карта платформы по умолчанию подставляется сама, но её может
 * не быть — тогда сервер отвечает 400. Поэтому выбор карты виден сразу, а не после
 * отказа: основная предвыбрана, если её нет — выдаём выбранную опубликованную.
 */
export function IssueCardPanel({
  customerId,
  reissue,
  onDone,
}: {
  customerId: string;
  reissue: boolean;
  onDone: () => void;
}) {
  const templates = useTemplates();
  const issueDefault = useIssueDefaultCard();
  const issue = useIssueCard();
  const published = (templates.data ?? []).filter((template) => template.status === "published");
  const platformCard = published.find((template) => template.isDefault);
  const [chosen, setChosen] = useState<string>("");
  const templateId = chosen || platformCard?.id || published[0]?.id || "";
  const template = published.find((item) => item.id === templateId);
  const pending = issue.isPending || issueDefault.isPending;
  const error = issue.error ?? issueDefault.error;

  if (templates.isPending) return <p className="text-base text-muted-foreground">Загружаем карты…</p>;

  if (published.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl bg-muted p-4">
        <p className="text-base">
          Выдавать пока нечего: нет ни одной опубликованной карты. Создайте карту и опубликуйте её — черновик людям не
          выдаётся.
        </p>
        <div>
          <Button asChild variant="outline" size="sm">
            <Link to="/templates">Перейти к картам</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-muted p-4">
      {!platformCard && (
        <p className="text-sm">
          Карта платформы не выбрана, поэтому выдаём выбранную ниже. Чтобы новые клиенты получали её сами, отметьте
          основную в разделе{" "}
          <Link to="/templates" className="font-semibold underline underline-offset-4">
            «Карты»
          </Link>{" "}
          → карта → «Настройки» → «Сделать картой платформы».
        </p>
      )}
      <FormField label="Какую карту выдать">
        {(parts) => (
          <NativeSelect
            {...parts}
            value={templateId}
            onChange={(event) => setChosen(event.target.value)}
            options={published.map((item) => ({
              value: item.id,
              label: `${item.name}${item.isDefault ? " — карта платформы" : ""}`,
            }))}
          />
        )}
      </FormField>
      {reissue && (
        <p className="text-sm text-muted-foreground">
          У человека одна действующая карта: текущая будет отозвана, весь баланс переедет на новую. Подписку это не
          трогает.
        </p>
      )}
      {template && !template.programId && (
        <FormStatus message="У этой карты не задана программа — задайте её в настройках карты, иначе выдать нельзя." />
      )}
      <FormStatus message={error?.message} />
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={pending || !template || !template.programId}
          onClick={async () => {
            if (!template?.programId) return;
            if (template.isDefault) await issueDefault.mutateAsync(customerId);
            else await issue.mutateAsync({ customerId, templateId: template.id, programId: template.programId });
            onDone();
          }}
        >
          {pending ? "Выдаём…" : reissue ? "Перевыпустить" : "Выдать карту"}
        </Button>
        <Button variant="ghost" onClick={onDone} disabled={pending}>
          Отмена
        </Button>
      </div>
    </div>
  );
}
