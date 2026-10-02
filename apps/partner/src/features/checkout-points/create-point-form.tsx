import { checkoutPointInputSchema, type Branch, type CheckoutPointInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, ChipSelect, FormField, FormStatus, Input, NativeSelect } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useMemo } from "react";
import { useCreateCheckoutPoint } from "../../entities/merchant/api";

/** Частые проценты до потолка магазина и сам потолок — выбирать, а не вводить. */
function percentOptions(max: number) {
  const base = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100].filter((value) => value < max);
  return [...base, max];
}

/**
 * Новая NFC/QR-касса: название, филиал и какие проценты покупатель сможет выбрать.
 * Всё фиксируется при создании — для другой настройки создают новую кассу.
 */
export function CreatePointForm({
  merchantId,
  branches,
  ceiling,
  onCreated,
}: {
  merchantId: string;
  branches: Branch[];
  /** Потолок процента магазина; null — без потолка (100). */
  ceiling: number | null;
  onCreated?: () => void;
}) {
  const create = useCreateCheckoutPoint(merchantId);
  const max = Math.max(1, Math.min(100, ceiling ?? 100));
  const schema = useMemo(() => checkoutPointInputSchema(max), [max]);
  const options = percentOptions(max);
  const initialValues: CheckoutPointInput = {
    name: "",
    branchId: branches.length === 1 ? branches[0]!.id : "",
    coveragePercents: options.filter((value) => value === 10 || value === 20 || value === max).slice(0, 3),
  };

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(schema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          await create.mutateAsync({ ...values, name: values.name.trim() });
          helpers.resetForm();
          onCreated?.();
        } catch (error) {
          applyServerIssues(error, helpers, "Не удалось создать кассу");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form noValidate className="flex flex-col gap-5">
          <FocusFirstError form={form} />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Название" hint="Так кассу увидит покупатель" error={fieldError(form, "name")}>
              {(parts) => (
                <Input
                  {...parts}
                  name="name"
                  placeholder="Касса у входа"
                  maxLength={120}
                  value={form.values.name}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              )}
            </FormField>
            <FormField label="Филиал" error={fieldError(form, "branchId")}>
              {(parts) => (
                <NativeSelect
                  {...parts}
                  name="branchId"
                  value={form.values.branchId}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  placeholder="Выберите филиал"
                  options={branches.map((branch) => ({ value: branch.id, label: branch.name }))}
                />
              )}
            </FormField>
          </div>
          <FormField
            label="Сколько покупатель может оплатить баллами"
            hint={`Покупатель выберет один из вариантов или оплатит без баллов. Не выше потолка магазина — ${max}%.`}
            error={fieldError(form, "coveragePercents")}
          >
            {(parts) => (
              <ChipSelect
                {...parts}
                options={options.map((value) => ({ value: String(value), label: `${value}%` }))}
                value={form.values.coveragePercents.map(String)}
                onChange={(next) => {
                  form.setFieldValue(
                    "coveragePercents",
                    next.map(Number).sort((a, b) => a - b),
                  );
                  form.setFieldTouched("coveragePercents", true, false);
                }}
              />
            )}
          </FormField>
          <FormStatus message={formError(form)} />
          <div>
            <Button type="submit" disabled={form.isSubmitting}>
              {form.isSubmitting ? "Создаём…" : "Создать кассу"}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
