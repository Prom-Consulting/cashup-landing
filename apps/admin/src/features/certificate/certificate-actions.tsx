import { updateCertificateInputSchema, type Certificate, type UpdateCertificateInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogTrigger,
  FileButton,
  FormField,
  FormStatus,
  Input,
} from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import {
  useCertificateHealth,
  useCompleteCertificate,
  useDeleteCertificate,
  useDownloadCsr,
  useSetDefaultCertificate,
  useUpdateCertificate,
  useUploadCertificate,
} from "../../entities/platform/api";
import { csrFilename, downloadText } from "./download";

const dateInput = (value: string | null | undefined) => (value ? value.slice(0, 10) : "");

function EditDialog({ certificate }: { certificate: Certificate }) {
  const [open, setOpen] = useState(false);
  const update = useUpdateCertificate(certificate.id);
  const initialValues: UpdateCertificateInput = {
    name: certificate.name ?? "",
    teamId: certificate.teamId ?? "",
    passTypeIdentifier: certificate.passTypeIdentifier ?? "",
    googleIssuerId: certificate.googleIssuerId ?? "",
    expiresAt: dateInput(certificate.expiresAt),
  };
  const apple = certificate.type === "apple_pass";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Изменить
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Сертификат"
        description="Меняются только описания. Сам ключ заменяется новой загрузкой файла."
      >
        <Formik
          initialValues={initialValues}
          validate={zodValidate(updateCertificateInputSchema)}
          onSubmit={async (values, helpers) => {
            helpers.setStatus(undefined);
            try {
              await update.mutateAsync(values);
              setOpen(false);
            } catch (error) {
              applyServerIssues(error, helpers, "Не удалось сохранить");
            } finally {
              helpers.setSubmitting(false);
            }
          }}
        >
          {(form) => {
            const text = (name: keyof UpdateCertificateInput, label: string, type = "text") => (
              <FormField label={label} error={fieldError(form, name)}>
                {(parts) => (
                  <Input
                    {...parts}
                    type={type}
                    name={name}
                    value={String(form.values[name] ?? "")}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </FormField>
            );
            return (
              <Form noValidate className="flex flex-col gap-4">
                <FocusFirstError form={form} />
                {text("name", "Название")}
                {apple ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {text("teamId", "Team ID")}
                    {text("passTypeIdentifier", "Pass Type ID")}
                  </div>
                ) : (
                  text("googleIssuerId", "Issuer ID")
                )}
                {text("expiresAt", "Действует до", "date")}
                <FormStatus message={formError(form)} />
                <Button type="submit" disabled={!form.dirty || form.isSubmitting}>
                  Сохранить
                </Button>
              </Form>
            );
          }}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}

/** Готовый ключ: .p12 с паролем у Apple, JSON сервисного аккаунта у Google. */
function UploadKeyDialog({ certificate }: { certificate: Certificate }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const upload = useUploadCertificate(certificate.id);
  const apple = certificate.type === "apple_pass";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setFile(null);
          setPassword("");
          upload.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Загрузить ключ
        </Button>
      </DialogTrigger>
      <DialogContent
        title={apple ? "Ключ .p12" : "Сервисный аккаунт Google"}
        description={
          apple
            ? "Экспорт из «Связки ключей»: сертификат вместе с закрытым ключом, с паролем. На сервере он хранится зашифрованным."
            : "JSON-файл ключа сервисного аккаунта из Google Cloud. На сервере он хранится зашифрованным."
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <FileButton
              variant="outline"
              accept={apple ? ".p12,application/x-pkcs12" : ".json,application/json"}
              onFile={setFile}
            >
              Выбрать файл
            </FileButton>
            <span className="text-base text-muted-foreground">{file?.name ?? "Файл не выбран"}</span>
          </div>
          {apple && (
            <FormField label="Пароль от .p12">
              {(parts) => (
                <Input
                  {...parts}
                  type="password"
                  autoComplete="off"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              )}
            </FormField>
          )}
          <FormStatus message={upload.isError ? upload.error.message : undefined} />
          <Button
            disabled={!file || upload.isPending}
            onClick={async () => {
              if (!file) return;
              await upload.mutateAsync(apple ? { p12: file, password } : { serviceAccount: file });
              setOpen(false);
            }}
          >
            {upload.isPending ? "Загружаем…" : "Загрузить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Действия над одним сертификатом: завершить выпуск, загрузить ключ, проверить, править, удалить. */
export function CertificateActions({ certificate }: { certificate: Certificate }) {
  const complete = useCompleteCertificate(certificate.id);
  const csr = useDownloadCsr();
  const health = useCertificateHealth();
  const setDefault = useSetDefaultCertificate();
  const remove = useDeleteCertificate();
  const pending = certificate.status === "pending_csr";

  const healthText = health.data
    ? health.data.ok
      ? "Ключ и сертификат сходятся — карты подпишутся."
      : (health.data.error ?? "Проверка не прошла")
    : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {pending && (
          <>
            <FileButton
              variant="primary"
              size="sm"
              accept=".cer,application/pkix-cert"
              disabled={complete.isPending}
              onFile={(file) => complete.mutate(file)}
            >
              {complete.isPending ? "Проверяем…" : "Загрузить pass.cer"}
            </FileButton>
            <Button
              variant="ghost"
              size="sm"
              disabled={csr.isPending}
              onClick={async () => {
                const result = await csr.mutateAsync(certificate.id);
                downloadText(csrFilename(certificate.name ?? "loal"), result.csrPem);
              }}
            >
              Скачать запрос ещё раз
            </Button>
          </>
        )}
        {!pending && <UploadKeyDialog certificate={certificate} />}
        {!pending && (
          <Button variant="ghost" size="sm" disabled={health.isPending} onClick={() => health.mutate(certificate.id)}>
            Проверить
          </Button>
        )}
        {!pending && !certificate.isDefault && (
          <Button
            variant="outline"
            size="sm"
            disabled={setDefault.isPending}
            onClick={() => setDefault.mutate(certificate.id)}
          >
            Сделать основным
          </Button>
        )}
        <EditDialog certificate={certificate} />
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="sm" disabled={Boolean(certificate.isDefault)}>
              Удалить
            </Button>
          }
          title="Удалить сертификат?"
          description="Карты, которые подписывались им явно, перейдут на сертификат по умолчанию. Ключ удаляется с сервера насовсем."
          confirmLabel="Удалить"
          onConfirm={() => remove.mutateAsync(certificate.id)}
        />
      </div>
      <FormStatus
        tone={health.data?.ok ? "success" : "error"}
        message={healthText ?? (health.isError ? health.error.message : undefined)}
      />
      <FormStatus message={[complete, csr, setDefault].find((mutation) => mutation.isError)?.error?.message} />
    </div>
  );
}
