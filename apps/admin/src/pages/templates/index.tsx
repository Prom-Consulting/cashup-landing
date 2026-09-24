import { CARD_TYPE_LABELS, liveField } from "@loal/api";
import { Badge, EmptyState, ErrorState, Loading, PageHeader } from "@loal/ui/shadcn";
import { Link } from "react-router";
import { usePrograms, useTemplates } from "../../entities/platform/api";
import { CreateTemplateDialog } from "../../features/template/create-template-dialog";

/** Все карты платформы: одна основная, остальные — для особых случаев и черновики. */
export function TemplatesPage() {
  const templates = useTemplates();
  const programs = usePrograms();
  const programName = (id: string | null | undefined) => programs.data?.find((item) => item.id === id)?.name;

  // Основная карта первой, дальше опубликованные, черновики в конце
  const sorted = [...(templates.data ?? [])].sort(
    (a, b) =>
      Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault)) ||
      Number(b.status === "published") - Number(a.status === "published") ||
      a.name.localeCompare(b.name, "ru"),
  );

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Карты"
        description="Как выглядит карта в Wallet. Правка опубликованной карты сразу уходит всем, у кого она уже есть."
        action={<CreateTemplateDialog />}
      />

      {templates.isPending && <Loading rows={3} />}
      {templates.isError && <ErrorState error={templates.error} onRetry={() => templates.refetch()} />}
      {templates.isSuccess && templates.data.length === 0 && (
        <EmptyState title="Карт пока нет" description="Начните с заготовки — её цвета и поля потом можно поменять." />
      )}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((template) => (
          <li key={template.id}>
            <Link
              to={`/templates/${template.id}`}
              className="group flex h-full flex-col gap-4 rounded-card bg-surface p-4 outline-none transition-shadow hover:shadow-[0_1rem_2rem_rgb(9_8_9/0.08)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span
                className="flex aspect-[1.7] flex-col justify-between rounded-2xl p-4"
                style={{ background: template.design.backgroundColor, color: template.design.foregroundColor }}
              >
                <span className="flex items-center gap-2">
                  {template.design.images.logoUrl && (
                    <img src={template.design.images.logoUrl} alt="" className="max-h-7 max-w-[90px] object-contain" />
                  )}
                  <span className="truncate text-base font-semibold">{template.design.logoText}</span>
                </span>
                <span>
                  <span className="block text-xs" style={{ color: template.design.labelColor }}>
                    {template.design.primaryFields[0]?.label ?? template.design.description}
                  </span>
                  <span className="block text-2xl font-light">
                    {template.design.primaryFields[0]
                      ? (liveField(template.design.primaryFields[0].key)?.sample ??
                        String(template.design.primaryFields[0].value))
                      : ""}
                  </span>
                </span>
              </span>
              <span className="flex flex-col gap-2">
                <span className="text-lg font-medium group-hover:underline">{template.name}</span>
                <span className="text-sm text-muted-foreground">
                  {CARD_TYPE_LABELS[template.cardType]}
                  {programName(template.programId) ? ` · ${programName(template.programId)}` : " · программа не задана"}
                  {template.version ? ` · версия ${template.version}` : ""}
                </span>
                <span className="flex flex-wrap gap-2">
                  {template.isDefault && <Badge tone="warn">карта платформы</Badge>}
                  <Badge tone={template.status === "published" ? "good" : "quiet"}>
                    {template.status === "published" ? "опубликована" : "черновик"}
                  </Badge>
                  {template.isShowcase && <Badge tone="quiet">в примерах</Badge>}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
