import {
  MEMBER_ROLE_LABELS,
  SCAN_OPERATION_LABELS,
  addMemberInputSchema,
  addPartnerInputSchema,
  type AddMemberInput,
  type AddPartnerInput,
  type Branch,
} from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import {
  Button,
  FormField,
  FormStatus,
  Input,
  NativeSelect,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useAddMember, useAddPartner } from "../../entities/merchant/api";

const USER_ID_HINT = "Человек сначала регистрируется сам, потом присылает свой идентификатор из профиля.";

function StaffForm({ merchantId, branches }: { merchantId: string; branches: Branch[] }) {
  const add = useAddMember(merchantId);
  const [done, setDone] = useState<string>();
  const initialValues: AddMemberInput = { userId: "", role: "staff", branchId: "" };

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(addMemberInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        setDone(undefined);
        try {
          await add.mutateAsync({ ...values, branchId: values.branchId || undefined });
          helpers.resetForm();
          setDone("Сотрудник подключён");
        } catch (error) {
          applyServerIssues(error, helpers, "Не удалось подключить");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form noValidate className="flex flex-col gap-4">
          <FocusFirstError form={form} />
          <FormField label="Идентификатор пользователя" hint={USER_ID_HINT} error={fieldError(form, "userId")}>
            {(parts) => (
              <Input
                {...parts}
                name="userId"
                value={form.values.userId}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Роль">
              {(parts) => (
                <NativeSelect
                  {...parts}
                  name="role"
                  value={form.values.role}
                  onChange={form.handleChange}
                  options={(["staff", "admin"] as const).map((role) => ({
                    value: role,
                    label: MEMBER_ROLE_LABELS[role],
                  }))}
                />
              )}
            </FormField>
            {branches.length > 0 && (
              <FormField label="Точка">
                {(parts) => (
                  <NativeSelect
                    {...parts}
                    name="branchId"
                    value={form.values.branchId ?? ""}
                    onChange={form.handleChange}
                    placeholder="Без точки"
                    options={branches.map((branch) => ({ value: branch.id, label: branch.name }))}
                  />
                )}
              </FormField>
            )}
          </div>
          <FormStatus message={formError(form)} />
          <FormStatus tone="success" message={done} />
          <div>
            <Button type="submit" variant="outline" disabled={form.isSubmitting}>
              Подключить
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

function PartnerForm({ merchantId, branches }: { merchantId: string; branches: Branch[] }) {
  const add = useAddPartner(merchantId);
  const [done, setDone] = useState<string>();
  const initialValues: AddPartnerInput = { userId: "", scanOperation: "earn", branchId: "" };

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(addPartnerInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        setDone(undefined);
        try {
          await add.mutateAsync({ ...values, branchId: values.branchId || undefined });
          helpers.resetForm();
          setDone("Партнёр подключён");
        } catch (error) {
          applyServerIssues(error, helpers, "Не удалось подключить партнёра");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form noValidate className="flex flex-col gap-4">
          <FocusFirstError form={form} />
          <p className="text-base text-muted-foreground">
            Партнёру выбирают одну операцию — навсегда. Сотрудники, которых он заведёт, унаследуют ровно её.
          </p>
          <FormField label="Идентификатор пользователя" hint={USER_ID_HINT} error={fieldError(form, "userId")}>
            {(parts) => (
              <Input
                {...parts}
                name="userId"
                value={form.values.userId}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
            )}
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Что он делает">
              {(parts) => (
                <NativeSelect
                  {...parts}
                  name="scanOperation"
                  value={form.values.scanOperation}
                  onChange={form.handleChange}
                  options={(["earn", "redeem"] as const).map((operation) => ({
                    value: operation,
                    label: `${SCAN_OPERATION_LABELS[operation]} баллы`,
                  }))}
                />
              )}
            </FormField>
            {branches.length > 0 && (
              <FormField label="Точка">
                {(parts) => (
                  <NativeSelect
                    {...parts}
                    name="branchId"
                    value={form.values.branchId ?? ""}
                    onChange={form.handleChange}
                    placeholder="Без точки"
                    options={branches.map((branch) => ({ value: branch.id, label: branch.name }))}
                  />
                )}
              </FormField>
            )}
          </div>
          <FormStatus message={formError(form)} />
          <FormStatus tone="success" message={done} />
          <div>
            <Button type="submit" variant="outline" disabled={form.isSubmitting}>
              Подключить партнёра
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

export function AddMemberForm({ merchantId, branches }: { merchantId: string; branches: Branch[] }) {
  return (
    <Tabs defaultValue="staff" className="mt-6 border-t border-border pt-5">
      <TabsList>
        <TabsTrigger value="staff">Сотрудник</TabsTrigger>
        <TabsTrigger value="partner">Партнёр</TabsTrigger>
      </TabsList>
      <TabsContent value="staff" className="mt-5">
        <StaffForm merchantId={merchantId} branches={branches} />
      </TabsContent>
      <TabsContent value="partner" className="mt-5">
        <PartnerForm merchantId={merchantId} branches={branches} />
      </TabsContent>
    </Tabs>
  );
}
