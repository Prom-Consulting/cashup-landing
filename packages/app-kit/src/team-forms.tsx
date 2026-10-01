import { ApiError, MEMBER_ROLE_LABELS, addMemberInputSchema, merchantCabinetApi, type AddMemberInput, type Branch } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { PhoneInput, formatPhone } from "@loal/ui/inputs";
import { Button, FormField, FormStatus, Input, NativeSelect } from "@loal/ui/shadcn";
import { useMutation } from "@tanstack/react-query";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useApi } from "./session";

const OWNER_ROLES = ["staff", "branch_admin", "admin"] as const;

/**
 * Добавить человека в магазин по имени и телефону (docs/API.md, «Сотрудники»). Владелец и
 * агентство выбирают роль и филиал; администратору филиала филиал обязателен. Администратор
 * филиала (actor="branch") добавляет только кассиров — филиал сервер ставит его сам.
 * onAdded — перечитать список.
 */
export function AddMemberForm({
  merchantId,
  branches,
  onAdded,
  actor = "owner",
  bare = false,
}: {
  merchantId: string;
  branches: Branch[];
  onAdded?: () => void;
  actor?: "owner" | "branch";
  /** Без своего заголовка и отступов — когда форма живёт в окне со своим заголовком. */
  bare?: boolean;
}) {
  const api = useApi();
  const add = useMutation({
    mutationFn: (input: AddMemberInput) => merchantCabinetApi(api).addMember(merchantId, input),
    onSuccess: () => onAdded?.(),
  });
  const [done, setDone] = useState<string>();
  const open = branches.filter((branch) => !branch.archivedAt);
  const initialValues: AddMemberInput = { fullName: "", phone: "", role: "staff", branchId: "" };

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(addMemberInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        setDone(undefined);
        try {
          const role = actor === "branch" ? "staff" : values.role;
          await add.mutateAsync({
            ...values,
            role,
            // Администратору филиала филиал ставит сервер — чужой был бы 400
            branchId: actor === "branch" ? undefined : values.branchId || undefined,
          });
          helpers.resetForm();
          setDone(
            `${values.fullName} — ${(MEMBER_ROLE_LABELS[role] ?? "сотрудник").toLowerCase()}. Пусть войдёт по номеру ${formatPhone(values.phone)} — код придёт в WhatsApp.`,
          );
        } catch (error) {
          // Номер уже занят другим магазином или аккаунтом — показываем у поля
          if (error instanceof ApiError && error.isConflict)
            return helpers.setFieldError("phone", error.message || "Этот номер уже занят");
          applyServerIssues(error, helpers, "Не удалось добавить");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form noValidate className={bare ? "flex flex-col gap-4" : "mt-6 flex flex-col gap-4 border-t border-border pt-5"}>
          <FocusFirstError form={form} />
          {!bare && <h3 className="text-lg font-bold">{actor === "branch" ? "Новый кассир" : "Добавить человека"}</h3>}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Имя" error={fieldError(form, "fullName")}>
              {(parts) => (
                <Input
                  {...parts}
                  name="fullName"
                  autoComplete="off"
                  value={form.values.fullName}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              )}
            </FormField>
            <FormField
              label="Телефон"
              hint="По нему человек входит — код придёт в WhatsApp."
              error={fieldError(form, "phone")}
            >
              {(parts) => (
                <PhoneInput
                  {...parts}
                  name="phone"
                  value={form.values.phone}
                  onValueChange={(value) => form.setFieldValue("phone", value)}
                  onBlur={() => form.setFieldTouched("phone", true)}
                />
              )}
            </FormField>
          </div>
          {actor === "owner" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Роль">
                {(parts) => (
                  <NativeSelect
                    {...parts}
                    name="role"
                    value={form.values.role}
                    onChange={form.handleChange}
                    options={OWNER_ROLES.map((role) => ({ value: role, label: MEMBER_ROLE_LABELS[role] ?? role }))}
                  />
                )}
              </FormField>
              <FormField
                label="Филиал"
                hint={
                  open.length === 0
                    ? "Филиалов пока нет — создайте их выше."
                    : form.values.role === "branch_admin"
                      ? "Администратор ведёт один филиал."
                      : undefined
                }
                error={fieldError(form, "branchId")}
              >
                {(parts) => (
                  <NativeSelect
                    {...parts}
                    name="branchId"
                    value={form.values.branchId ?? ""}
                    onChange={form.handleChange}
                    placeholder={form.values.role === "branch_admin" ? "Выберите филиал" : "Без филиала"}
                    options={open.map((branch) => ({ value: branch.id, label: branch.name }))}
                  />
                )}
              </FormField>
            </div>
          )}
          <FormStatus message={formError(form)} />
          <FormStatus tone="success" message={done} />
          <div>
            <Button type="submit" variant={bare ? "primary" : "outline"} className={bare ? "w-full" : undefined} disabled={form.isSubmitting}>
              {form.isSubmitting ? "Добавляем…" : actor === "branch" ? "Добавить кассира" : "Добавить"}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
