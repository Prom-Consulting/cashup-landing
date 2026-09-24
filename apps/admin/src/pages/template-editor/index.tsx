import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { CARD_TYPE_LABELS } from "@loal/api";
import {
  Badge,
  ErrorState,
  Icon,
  Loading,
  PageHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@loal/ui/shadcn";
import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  useCertificates,
  useProgramMembers,
  usePrograms,
  useSaveDesign,
  useTemplate,
} from "../../entities/platform/api";
import { DesignForm } from "../../features/template/design-form";
import { TemplateSettings } from "../../features/template/template-settings";
import { PassPreview } from "../../widgets/pass-preview";

/** Редактор одной карты: слева настройки, справа — карта так, как её увидит держатель. */
export function TemplateEditorPage() {
  const { templateId = "" } = useParams();
  const template = useTemplate(templateId);
  const programs = usePrograms();
  const certificates = useCertificates();
  const members = useProgramMembers(template.data?.programId ?? null);
  const save = useSaveDesign(templateId);
  const [side, setSide] = useState<"front" | "back">("front");

  const back = (
    <Link
      to="/templates"
      className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground"
    >
      <Icon icon={ArrowLeft01Icon} />
      Все карты
    </Link>
  );

  if (template.isPending) return <Loading rows={4} />;
  if (template.isError)
    return (
      <section className="flex flex-col gap-6">
        {back}
        <ErrorState error={template.error} onRetry={() => template.refetch()} />
      </section>
    );

  const data = template.data;
  const holders = members.data ? members.data.filter((member) => member.status === "active").length : null;

  return (
    <section className="flex flex-col gap-6">
      {back}
      <PageHeader
        title={data.name}
        description={`${CARD_TYPE_LABELS[data.cardType]}${data.version ? ` · версия ${data.version}` : ""}`}
        action={
          <span className="flex flex-wrap gap-2">
            {data.isDefault && <Badge tone="warn">карта платформы</Badge>}
            <Badge tone={data.status === "published" ? "good" : "quiet"}>
              {data.status === "published" ? "опубликована" : "черновик"}
            </Badge>
          </span>
        }
      />

      <Tabs defaultValue="design">
        <TabsList>
          <TabsTrigger value="design">Вид</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>

        <TabsContent value="design" className="mt-6">
          <DesignForm
            design={data.design}
            cardType={data.cardType}
            published={data.status === "published"}
            holders={holders}
            onSave={(design) => save.mutateAsync(design)}
            preview={(design) => (
              <div className="flex flex-col items-center gap-4 rounded-card bg-muted px-4 py-6">
                <div className="flex gap-1" role="group" aria-label="Сторона карты">
                  {(["front", "back"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={side === value}
                      onClick={() => setSide(value)}
                      className={`rounded-full px-4 py-1.5 text-sm transition-colors ${side === value ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {value === "front" ? "Лицо" : "Оборот"}
                    </button>
                  ))}
                </div>
                <PassPreview design={design} cardType={data.cardType} side={side} />
                <p className="text-center text-xs text-muted-foreground">
                  Приближение: окончательно карту рисует телефон. Живые поля — баланс, имя, уровень — заполнены
                  примером.
                </p>
              </div>
            )}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-6 max-w-[760px]">
          {programs.isError && <ErrorState error={programs.error} onRetry={() => programs.refetch()} />}
          <TemplateSettings template={data} programs={programs.data ?? []} certificates={certificates.data ?? []} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
