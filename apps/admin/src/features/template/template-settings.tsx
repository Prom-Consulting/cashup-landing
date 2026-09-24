import {
  CARD_TYPE_LABELS,
  COMPATIBLE_PROGRAM_TYPES,
  CERTIFICATE_TYPE_LABELS,
  renameTemplateInputSchema,
  type CardType,
  type Certificate,
  type Program,
  type Template,
} from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  FormField,
  FormStatus,
  Input,
  NativeSelect,
  Switch,
} from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useNavigate } from "react-router";
import {
  useDeleteTemplate,
  usePublishTemplate,
  useRenameTemplate,
  useRevokeTemplateCards,
  useSetDefaultTemplate,
  useSetTemplateCardType,
  useSetTemplateCertificates,
  useSetTemplateProgram,
  useSetTemplateShowcase,
} from "../../entities/platform/api";

function Row({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function mutationError(...mutations: { isError: boolean; error: Error | null }[]) {
  return mutations.find((mutation) => mutation.isError)?.error?.message;
}

/** Всё о карте, кроме её вида: название, тип, программа, подпись, витрина, жизненный цикл. */
export function TemplateSettings({
  template,
  programs,
  certificates,
}: {
  template: Template;
  programs: Program[];
  certificates: Certificate[];
}) {
  const navigate = useNavigate();
  const rename = useRenameTemplate(template.id);
  const cardType = useSetTemplateCardType(template.id);
  const program = useSetTemplateProgram(template.id);
  const certs = useSetTemplateCertificates(template.id);
  const showcase = useSetTemplateShowcase(template.id);
  const publish = usePublishTemplate();
  const makeDefault = useSetDefaultTemplate();
  const revoke = useRevokeTemplateCards();
  const remove = useDeleteTemplate();

  const currentProgram = programs.find((item) => item.id === template.programId);
  const published = template.status === "published";
  const apple = certificates.filter((item) => item.type === "apple_pass");
  const google = certificates.filter((item) => item.type === "google_service_account");
  const certificateOptions = (list: Certificate[]) =>
    list.map((item) => ({
      value: item.id,
      label: `${item.name ?? item.passTypeIdentifier ?? item.id}${item.isDefault ? " — по умолчанию" : ""}${item.status === "pending_csr" ? " (ждёт pass.cer)" : ""}`,
      disabled: item.status === "pending_csr",
    }));

  return (
    <Card className="flex flex-col gap-5">
      <Row title="Название" description="Для себя: клиент его не видит.">
        <Formik
          initialValues={{ name: template.name }}
          enableReinitialize
          validate={zodValidate(renameTemplateInputSchema)}
          onSubmit={async (values, helpers) => {
            helpers.setStatus(undefined);
            try {
              await rename.mutateAsync(values.name);
            } catch (error) {
              applyServerIssues(error, helpers);
            } finally {
              helpers.setSubmitting(false);
            }
          }}
        >
          {(form) => (
            <Form noValidate className="flex flex-wrap items-start gap-3">
              <FocusFirstError form={form} />
              <FormField label="Название" className="min-w-[220px] flex-1" error={fieldError(form, "name")}>
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
              <Button type="submit" variant="outline" className="mt-8" disabled={!form.dirty || form.isSubmitting}>
                Переименовать
              </Button>
              <div className="basis-full">
                <FormStatus message={formError(form)} />
              </div>
            </Form>
          )}
        </Formik>
      </Row>

      <Row title="Вид карты" description="Вид и тип программы должны сочетаться — несовместимые варианты скрыты.">
        <NativeSelect
          aria-label="Вид карты"
          value={template.cardType}
          disabled={cardType.isPending}
          onChange={(event) => cardType.mutate(event.target.value as CardType)}
          options={Object.entries(CARD_TYPE_LABELS).map(([value, label]) => ({
            value,
            label,
            disabled:
              Boolean(currentProgram) &&
              !COMPATIBLE_PROGRAM_TYPES[value as CardType].includes(currentProgram!.programType),
          }))}
        />
      </Row>

      <Row
        title="Программа"
        description={
          currentProgram
            ? "Задаётся один раз и больше не меняется."
            : "Не задана — выберите: без неё карту не выпустить."
        }
      >
        {currentProgram ? (
          <p className="text-lg">{currentProgram.name}</p>
        ) : (
          <NativeSelect
            aria-label="Программа"
            value=""
            placeholder="Выберите программу"
            disabled={program.isPending}
            onChange={(event) => event.target.value && program.mutate(event.target.value)}
            options={programs
              .filter((item) => COMPATIBLE_PROGRAM_TYPES[template.cardType].includes(item.programType))
              .map((item) => ({ value: item.id, label: item.name }))}
          />
        )}
      </Row>

      <Row title="Подпись" description="Не выбрано — карта подписывается сертификатом по умолчанию.">
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["appleCertificateId", apple, "apple_pass"],
              ["googleCertificateId", google, "google_service_account"],
            ] as const
          ).map(([key, list, type]) => (
            <FormField key={key} label={CERTIFICATE_TYPE_LABELS[type]}>
              {(parts) => (
                <NativeSelect
                  {...parts}
                  value={template[key] ?? ""}
                  disabled={certs.isPending}
                  placeholder="По умолчанию"
                  onChange={(event) =>
                    certs.mutate({
                      appleCertificateId: template.appleCertificateId ?? null,
                      googleCertificateId: template.googleCertificateId ?? null,
                      [key]: event.target.value || null,
                    })
                  }
                  options={certificateOptions(list)}
                />
              )}
            </FormField>
          ))}
        </div>
      </Row>

      <Row title="Витрина">
        <Switch
          checked={Boolean(template.isShowcase)}
          disabled={showcase.isPending}
          onCheckedChange={(checked) => showcase.mutate(checked)}
          label="Показывать примером"
          description="Карта попадает в публичный список примеров /v1/public/card-examples."
        />
      </Row>

      <Row
        title="Выпуск"
        description={
          published
            ? "Опубликована: по ней можно выпускать карты."
            : "Черновик: карту видно только здесь, выпустить по ней нельзя."
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={published ? "good" : "quiet"}>{published ? "опубликована" : "черновик"}</Badge>
          {template.isDefault && <Badge tone="warn">карта платформы</Badge>}
          {!published && (
            <ConfirmDialog
              trigger={<Button variant="outline">Опубликовать</Button>}
              title="Опубликовать карту?"
              tone="primary"
              description="После публикации по ней можно выпускать карты людям. Вернуть в черновик нельзя."
              confirmLabel="Опубликовать"
              onConfirm={() => publish.mutateAsync(template.id)}
            />
          )}
          {published && !template.isDefault && (
            <ConfirmDialog
              trigger={<Button variant="outline">Сделать картой платформы</Button>}
              title="Сделать картой платформы?"
              tone="primary"
              description="Её будут получать все новые клиенты, за которых не сказали иначе. Флаг снимется с прежней карты; выданные карты останутся как есть."
              confirmLabel="Сделать основной"
              onConfirm={() => makeDefault.mutateAsync(template.id)}
            />
          )}
        </div>
      </Row>

      <Row title="Опасная зона" description="Удалить карту можно, только когда по ней не осталось неотозванных карт.">
        <div className="flex flex-wrap gap-3">
          <ConfirmDialog
            trigger={<Button variant="outline">Отозвать все выданные</Button>}
            title="Отозвать все карты по этому шаблону?"
            description="Карты у держателей станут недействительными. Баланс остаётся за человеком: при следующей выдаче он переедет на новую карту."
            confirmLabel="Отозвать все"
            onConfirm={() => revoke.mutateAsync(template.id)}
          />
          <ConfirmDialog
            trigger={
              <Button variant="danger" disabled={Boolean(template.isDefault)}>
                Удалить карту
              </Button>
            }
            title="Удалить карту?"
            description="Шаблон исчезнет насовсем. Если по нему остались действующие карты, сервер откажет — сначала отзовите их."
            confirmLabel="Удалить"
            onConfirm={async () => {
              await remove.mutateAsync(template.id);
              navigate("/templates");
            }}
          />
        </div>
        {template.isDefault && (
          <p className="text-sm text-muted-foreground">
            Карту платформы удалить нельзя — сначала сделайте основной другую.
          </p>
        )}
      </Row>

      <FormStatus message={mutationError(cardType, program, certs, showcase, publish, makeDefault, revoke)} />
    </Card>
  );
}
