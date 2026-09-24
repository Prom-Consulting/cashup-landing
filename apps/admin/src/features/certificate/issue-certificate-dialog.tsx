import { Add01Icon, Download04Icon } from "@hugeicons/core-free-icons";
import {
  CERTIFICATE_TYPE_LABELS,
  createCertificateInputSchema,
  csrInputSchema,
  type CreateCertificateInput,
  type CsrInput,
} from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTrigger,
  FormField,
  FormStatus,
  Icon,
  Input,
  NativeSelect,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useCreateCertificate, useRequestCsr } from "../../entities/platform/api";
import { csrFilename, downloadText } from "./download";

/** Выпуск без Mac: сервер делает ключ, наружу уходит только запрос для Apple. */
function CsrStep({ onDone }: { onDone: () => void }) {
  const request = useRequestCsr();
  const [issued, setIssued] = useState<{ name: string; csrPem: string } | null>(null);
  const initialValues: CsrInput = { name: "", email: "" };

  if (issued) {
    return (
      <div className="flex flex-col gap-4">
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-base">
          <li>Скачайте запрос — файл .certSigningRequest.</li>
          <li>
            В Apple Developer → Identifiers выберите Pass Type ID, нажмите «Create Certificate» и загрузите этот файл.
          </li>
          <li>Скачайте выданный pass.cer и загрузите его здесь, в строке сертификата — «Загрузить pass.cer».</li>
        </ol>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => downloadText(csrFilename(issued.name), issued.csrPem)}>
            <Icon icon={Download04Icon} />
            Скачать запрос
          </Button>
          <Button variant="ghost" onClick={onDone}>
            Готово
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(csrInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          const result = await request.mutateAsync(values);
          setIssued({ name: values.name, csrPem: result.csrPem });
          downloadText(csrFilename(values.name), result.csrPem);
        } catch (error) {
          applyServerIssues(error, helpers, "Не удалось создать запрос");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form noValidate className="flex flex-col gap-4">
          <FocusFirstError form={form} />
          <p className="text-base text-muted-foreground">
            Ключ останется на сервере. Team ID и Pass Type ID подтянутся из сертификата, который вернёт Apple. Первый
            доведённый до конца сертификат сам станет основным.
          </p>
          <FormField label="Название" hint="Для себя, например «Loal Wallet 2026»." error={fieldError(form, "name")}>
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
          <FormField label="Почта аккаунта Apple Developer" error={fieldError(form, "email")}>
            {(parts) => (
              <Input
                {...parts}
                type="email"
                name="email"
                value={form.values.email}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </FormField>
          <FormStatus message={formError(form)} />
          <Button type="submit" disabled={form.isSubmitting}>
            {form.isSubmitting ? "Создаём ключ…" : "Создать запрос"}
          </Button>
        </Form>
      )}
    </Formik>
  );
}

/** Запись вручную — для готового .p12 или сервисного аккаунта Google. Ключ грузится следующим шагом. */
function ManualStep({ onDone }: { onDone: () => void }) {
  const create = useCreateCertificate();
  const initialValues: CreateCertificateInput = {
    type: "apple_pass",
    name: "",
    teamId: "",
    passTypeIdentifier: "",
    googleIssuerId: "",
    expiresAt: "",
  };

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(createCertificateInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          await create.mutateAsync(values);
          onDone();
        } catch (error) {
          applyServerIssues(error, helpers, "Не удалось завести сертификат");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => {
        const text = (name: keyof CreateCertificateInput, label: string, hint?: string) => (
          <FormField label={label} hint={hint} error={fieldError(form, name)}>
            {(parts) => (
              <Input
                {...parts}
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
            <FormField label="Для чего">
              {(parts) => (
                <NativeSelect
                  {...parts}
                  name="type"
                  value={form.values.type}
                  onChange={form.handleChange}
                  options={Object.entries(CERTIFICATE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                />
              )}
            </FormField>
            {text("name", "Название")}
            {form.values.type === "apple_pass" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {text("teamId", "Team ID")}
                {text("passTypeIdentifier", "Pass Type ID", "pass.kg.loal.card")}
              </div>
            ) : (
              text("googleIssuerId", "Issuer ID", "Из консоли Google Wallet")
            )}
            <FormField label="Действует до" error={fieldError(form, "expiresAt")}>
              {(parts) => (
                <Input
                  {...parts}
                  type="date"
                  name="expiresAt"
                  className="max-w-[220px]"
                  value={String(form.values.expiresAt ?? "")}
                  onChange={form.handleChange}
                />
              )}
            </FormField>
            <FormStatus message={formError(form)} />
            <Button type="submit" disabled={form.isSubmitting}>
              Завести
            </Button>
          </Form>
        );
      }}
    </Formik>
  );
}

export function IssueCertificateDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Icon icon={Add01Icon} />
          Новый сертификат
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Новый сертификат"
        description="Без Mac — через запрос с сервера. С готовым ключом — вручную."
      >
        <Tabs defaultValue="csr">
          <TabsList>
            <TabsTrigger value="csr">Выпустить для Apple</TabsTrigger>
            <TabsTrigger value="manual">Завести вручную</TabsTrigger>
          </TabsList>
          <TabsContent value="csr" className="mt-5">
            <CsrStep onDone={() => setOpen(false)} />
          </TabsContent>
          <TabsContent value="manual" className="mt-5">
            <ManualStep onDone={() => setOpen(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
