import {
  createProgramInputSchema,
  createTierInputSchema,
  type CreateProgramInput,
  type CreateTierInput,
} from "@loal/api";
import { fieldError, formError, zodValidate } from "@loal/forms";
import { Badge, Button, Card, EmptyState, ErrorState, Input, Label, Loading, PageHeader } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import {
  useCreateProgram,
  useCreateTier,
  useDeleteTier,
  usePrograms,
  usePublishTemplate,
  useTemplates,
  useTiers,
} from "../../entities/platform/api";

const money = new Intl.NumberFormat("ru-RU");
const newProgram: CreateProgramInput = { name: "", pointsPerPeriod: 100000 };
const newTier: CreateTierInput = { name: "", threshold: 0, sortOrder: 0, earnPercent: "" };

/** Программы платформы, их уровни и шаблоны карт. */
export function ProgramsPage() {
  const programs = usePrograms();
  const templates = useTemplates();
  const publish = usePublishTemplate();
  const createProgram = useCreateProgram();
  const [openProgram, setOpenProgram] = useState<string | null>(null);
  const tiers = useTiers(openProgram);
  const createTier = useCreateTier(openProgram ?? "");
  const deleteTier = useDeleteTier(openProgram ?? "");

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Программы и карты"
        description="Программа решает, сколько бонусов даёт подписка за месяц. Шаблон — как выглядит карта."
      />

      <Card>
        <h2 className="text-xl font-bold">Новая программа</h2>
        <Formik
          initialValues={newProgram}
          validate={zodValidate(createProgramInputSchema)}
          onSubmit={async (values, helpers) => {
            helpers.setStatus(undefined);
            try {
              await createProgram.mutateAsync(values);
              helpers.resetForm();
            } catch (error) {
              helpers.setStatus(error instanceof Error ? error.message : "Не удалось создать программу");
            } finally {
              helpers.setSubmitting(false);
            }
          }}
        >
          {(form) => (
            <Form className="mt-5 flex flex-wrap items-end gap-4" noValidate>
              <div className="min-w-[220px] flex-1">
                <Label htmlFor="name">Название</Label>
                <Input
                  id="name"
                  name="name"
                  className="mt-2"
                  value={form.values.name}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  invalid={Boolean(fieldError(form, "name"))}
                />
                {fieldError(form, "name") && (
                  <p className="mt-2 text-base text-destructive">{fieldError(form, "name")}</p>
                )}
              </div>
              <div className="w-[220px]">
                <Label htmlFor="pointsPerPeriod">Бонусов за месяц</Label>
                <Input
                  id="pointsPerPeriod"
                  name="pointsPerPeriod"
                  inputMode="numeric"
                  className="mt-2 tabular-nums"
                  value={String(form.values.pointsPerPeriod)}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  invalid={Boolean(fieldError(form, "pointsPerPeriod"))}
                />
              </div>
              <Button type="submit" variant="outline" disabled={form.isSubmitting}>
                Создать
              </Button>
              {formError(form) && <p className="basis-full text-base text-destructive">{formError(form)}</p>}
            </Form>
          )}
        </Formik>
      </Card>

      {programs.isPending && <Loading rows={2} />}
      {programs.isError && <ErrorState error={programs.error} onRetry={() => programs.refetch()} />}
      {programs.isSuccess && programs.data.length === 0 && <EmptyState title="Программ пока нет" />}

      <div className="flex flex-col gap-4">
        {(programs.data ?? []).map((program) => {
          const points = (program.config as { pointsPerPeriod?: number } | null)?.pointsPerPeriod;
          const open = openProgram === program.id;
          return (
            <Card key={program.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xl font-bold">{program.name}</p>
                  <p className="mt-1 text-base text-muted-foreground">
                    {points ? `${money.format(points)} бонусов за месяц` : "бонусы за период не заданы"}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setOpenProgram(open ? null : program.id)}>
                  {open ? "Скрыть уровни" : "Уровни"}
                </Button>
              </div>

              {open && (
                <div className="mt-5 border-t border-border pt-5">
                  {tiers.isPending && <Loading rows={2} />}
                  {tiers.isSuccess && tiers.data.length === 0 && (
                    <p className="text-base text-muted-foreground">
                      Уровней нет. Порог считается по накопленной сумме покупок, а не по остатку на карте.
                    </p>
                  )}
                  <ul className="flex flex-col gap-2">
                    {(tiers.data ?? []).map((tier) => (
                      <li key={tier.id} className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-lg">
                          {tier.name}
                          <span className="text-muted-foreground">
                            {" "}
                            · от {money.format(tier.threshold ?? 0)}
                            {tier.earnPercent ? ` · начисление ${tier.earnPercent}%` : ""}
                          </span>
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => deleteTier.mutate(tier.id)}>
                          Убрать
                        </Button>
                      </li>
                    ))}
                  </ul>

                  <Formik
                    initialValues={newTier}
                    validate={zodValidate(createTierInputSchema)}
                    onSubmit={async (values, helpers) => {
                      helpers.setStatus(undefined);
                      try {
                        await createTier.mutateAsync(values);
                        helpers.resetForm();
                      } catch (error) {
                        helpers.setStatus(error instanceof Error ? error.message : "Не удалось добавить уровень");
                      } finally {
                        helpers.setSubmitting(false);
                      }
                    }}
                  >
                    {(form) => (
                      <Form className="mt-5 flex flex-wrap items-end gap-3" noValidate>
                        <div className="w-[200px]">
                          <Label htmlFor="tier-name">Уровень</Label>
                          <Input
                            id="tier-name"
                            name="name"
                            className="mt-2"
                            value={form.values.name}
                            onChange={form.handleChange}
                            onBlur={form.handleBlur}
                            invalid={Boolean(fieldError(form, "name"))}
                          />
                        </div>
                        <div className="w-[200px]">
                          <Label htmlFor="threshold">Порог покупок</Label>
                          <Input
                            id="threshold"
                            name="threshold"
                            inputMode="numeric"
                            className="mt-2 tabular-nums"
                            value={String(form.values.threshold)}
                            onChange={form.handleChange}
                            onBlur={form.handleBlur}
                          />
                        </div>
                        <Button type="submit" variant="outline" disabled={form.isSubmitting}>
                          Добавить уровень
                        </Button>
                        {formError(form) && <p className="basis-full text-base text-destructive">{formError(form)}</p>}
                      </Form>
                    )}
                  </Formik>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card>
        <h2 className="text-xl font-bold">Шаблоны карт</h2>
        <p className="mt-2 max-w-[70ch] text-base text-muted-foreground">
          По неопубликованному шаблону карту выпустить нельзя: черновик — это «ещё не решено».
        </p>
        {templates.isPending && <Loading rows={2} />}
        {templates.isError && <ErrorState error={templates.error} onRetry={() => templates.refetch()} />}
        <ul className="mt-4 flex flex-col gap-3">
          {(templates.data ?? []).map((template) => (
            <li
              key={template.id}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"
            >
              <span className="text-lg">
                {template.name}
                {template.version ? <span className="text-muted-foreground"> · версия {template.version}</span> : null}
              </span>
              <span className="flex items-center gap-3">
                <Badge tone={template.status === "published" ? "good" : "quiet"}>
                  {template.status === "published" ? "опубликован" : "черновик"}
                </Badge>
                {template.status !== "published" && (
                  <Button variant="outline" size="sm" onClick={() => publish.mutate(template.id)}>
                    Опубликовать
                  </Button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
