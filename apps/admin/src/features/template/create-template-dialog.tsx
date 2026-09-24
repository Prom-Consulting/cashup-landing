import { Add01Icon } from "@hugeicons/core-free-icons";
import {
  CARD_TYPE_LABELS,
  COMPATIBLE_PROGRAM_TYPES,
  cloneTemplateInputSchema,
  createCustomTemplateInputSchema,
  type CardType,
  type CloneTemplateInput,
  type CreateCustomTemplateInput,
  type LibraryTemplate,
  type Program,
} from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTrigger,
  ErrorState,
  FormField,
  FormStatus,
  Icon,
  Input,
  Loading,
  NativeSelect,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
} from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  useCloneTemplate,
  useCreateCustomTemplate,
  usePrograms,
  useTemplateLibrary,
} from "../../entities/platform/api";

function programOptions(programs: Program[], cardType?: CardType) {
  return programs
    .filter((program) => !cardType || COMPATIBLE_PROGRAM_TYPES[cardType].includes(program.programType))
    .map((program) => ({ value: program.id, label: program.name }));
}

/** Мини-карта заготовки: её цвета и тип — достаточно, чтобы узнать по виду. */
function LibraryTile({ item, selected, onSelect }: { item: LibraryTemplate; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-2 rounded-2xl border-2 p-2 text-left transition-colors outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring",
        selected ? "border-primary" : "border-transparent hover:border-border",
      )}
    >
      <span
        className="flex aspect-[1.6] w-full flex-col justify-between rounded-xl p-3"
        style={{ background: item.design.backgroundColor, color: item.design.foregroundColor }}
      >
        <span className="truncate text-sm font-semibold">{item.design.logoText || item.design.organizationName}</span>
        <span className="text-xs" style={{ color: item.design.labelColor }}>
          {CARD_TYPE_LABELS[item.cardType]}
        </span>
      </span>
      <span className="px-1">
        <span className="block truncate text-base font-medium">{item.name}</span>
        {item.industry && <span className="block truncate text-sm text-muted-foreground">{item.industry}</span>}
      </span>
    </button>
  );
}

function FromLibrary({ programs, onCreated }: { programs: Program[]; onCreated: (id: string) => void }) {
  const library = useTemplateLibrary();
  const clone = useCloneTemplate();
  const initialValues: CloneTemplateInput = { libraryTemplateId: "", name: "", programId: "" };

  if (library.isPending) return <Loading rows={2} />;
  if (library.isError) return <ErrorState error={library.error} onRetry={() => library.refetch()} />;

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(cloneTemplateInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          const created = await clone.mutateAsync(values);
          onCreated(created.id);
        } catch (error) {
          applyServerIssues(error, helpers, "Не удалось создать карту");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => {
        const chosen = library.data.find((item) => item.id === form.values.libraryTemplateId);
        return (
          <Form noValidate className="flex flex-col gap-5">
            <FocusFirstError form={form} />
            <fieldset>
              <legend className="text-base font-medium">Заготовка</legend>
              <div className="mt-3 grid max-h-[320px] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                {library.data.map((item) => (
                  <LibraryTile
                    key={item.id}
                    item={item}
                    selected={item.id === form.values.libraryTemplateId}
                    onSelect={() => {
                      form.setFieldValue("libraryTemplateId", item.id);
                      if (!form.values.name) form.setFieldValue("name", item.name);
                    }}
                  />
                ))}
              </div>
              {fieldError(form, "libraryTemplateId") || (form.submitCount > 0 && form.errors.libraryTemplateId) ? (
                <p className="mt-2 text-sm font-medium text-destructive">{form.errors.libraryTemplateId}</p>
              ) : null}
            </fieldset>
            <FormField label="Название для себя" hint="Клиент его не видит." error={fieldError(form, "name")}>
              {(parts) => (
                <Input
                  {...parts}
                  name="name"
                  value={form.values.name}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              )}
            </FormField>
            <FormField
              label="Программа"
              hint={chosen ? `Подходят программы для карты «${CARD_TYPE_LABELS[chosen.cardType]}».` : undefined}
              error={fieldError(form, "programId")}
            >
              {(parts) => (
                <NativeSelect
                  {...parts}
                  name="programId"
                  value={form.values.programId}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  placeholder="Выберите программу"
                  options={programOptions(programs, chosen?.cardType)}
                />
              )}
            </FormField>
            <FormStatus message={formError(form)} />
            <Button type="submit" disabled={form.isSubmitting}>
              {form.isSubmitting ? "Создаём…" : "Создать черновик"}
            </Button>
          </Form>
        );
      }}
    </Formik>
  );
}

function FromScratch({ programs, onCreated }: { programs: Program[]; onCreated: (id: string) => void }) {
  const create = useCreateCustomTemplate();
  const initialValues: CreateCustomTemplateInput = { name: "", cardType: "storeCard", programId: "" };

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(createCustomTemplateInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          const created = await create.mutateAsync(values);
          onCreated(created.id);
        } catch (error) {
          applyServerIssues(error, helpers, "Не удалось создать карту");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form noValidate className="flex flex-col gap-5">
          <FocusFirstError form={form} />
          <FormField label="Название для себя" error={fieldError(form, "name")}>
            {(parts) => (
              <Input
                {...parts}
                name="name"
                value={form.values.name}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </FormField>
          <FormField label="Вид карты" error={fieldError(form, "cardType")}>
            {(parts) => (
              <NativeSelect
                {...parts}
                name="cardType"
                value={form.values.cardType}
                onChange={(event) => {
                  form.setFieldValue("cardType", event.target.value);
                  form.setFieldValue("programId", "");
                }}
                options={Object.entries(CARD_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            )}
          </FormField>
          <FormField label="Программа" error={fieldError(form, "programId")}>
            {(parts) => (
              <NativeSelect
                {...parts}
                name="programId"
                value={form.values.programId}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                placeholder="Выберите программу"
                options={programOptions(programs, form.values.cardType)}
              />
            )}
          </FormField>
          <FormStatus message={formError(form)} />
          <Button type="submit" disabled={form.isSubmitting}>
            {form.isSubmitting ? "Создаём…" : "Создать черновик"}
          </Button>
        </Form>
      )}
    </Formik>
  );
}

/** Новая карта — черновиком: людям она не попадёт, пока её не опубликуют. */
export function CreateTemplateDialog() {
  const [open, setOpen] = useState(false);
  const programs = usePrograms();
  const navigate = useNavigate();
  const onCreated = (id: string) => {
    setOpen(false);
    navigate(`/templates/${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Icon icon={Add01Icon} />
          Новая карта
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Новая карта"
        description="Создаётся черновиком: выпустить по нему нельзя, пока не опубликуете."
        className="w-[min(720px,calc(100vw-2rem))]"
      >
        {programs.isPending && <Loading rows={2} />}
        {programs.isError && <ErrorState error={programs.error} onRetry={() => programs.refetch()} />}
        {programs.isSuccess && programs.data.length === 0 && (
          <p className="text-lg">Сначала заведите программу: карта без неё не выпускается.</p>
        )}
        {programs.isSuccess && programs.data.length > 0 && (
          <Tabs defaultValue="library">
            <TabsList>
              <TabsTrigger value="library">Из заготовки</TabsTrigger>
              <TabsTrigger value="scratch">С нуля</TabsTrigger>
            </TabsList>
            <TabsContent value="library" className="mt-5">
              <FromLibrary programs={programs.data} onCreated={onCreated} />
            </TabsContent>
            <TabsContent value="scratch" className="mt-5">
              <FromScratch programs={programs.data} onCreated={onCreated} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
