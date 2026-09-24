import {
  ApiError,
  SCANNER_MAX_COVERAGE_PERCENT,
  coverageLimitInputSchema,
  merchantCabinetApi,
  type CoverageLimitInput,
} from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { Button, ErrorState, FormField, FormStatus, Input, Loading } from "@loal/ui/shadcn";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useApi } from "./session";

const coverageKey = (merchantId: string) => ["merchants", merchantId, "coverage"] as const;
const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });

export function useCoverageLimit(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: coverageKey(merchantId),
    queryFn: () => merchantCabinetApi(api).coverageLimit(merchantId),
    enabled: Boolean(merchantId),
  });
}

/**
 * Потолок процента: сколько процентов цены одной позиции заведение готово покрыть
 * баллами. Касса и 1С выбирают процент по товару сами, но не выше потолка; каталог
 * показывает его клиенту как «до N%».
 *
 * Заведение меняет потолок не чаще раза в месяц — агентство этим не связано.
 */
export function CoverageLimitForm({
  merchantId,
  asAgency = false,
  canEdit = true,
}: {
  merchantId: string;
  asAgency?: boolean;
  canEdit?: boolean;
}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const limit = useCoverageLimit(merchantId);
  const save = useMutation({
    mutationFn: (input: CoverageLimitInput) => merchantCabinetApi(api).saveCoverageLimit(merchantId, input),
    onSuccess: (data) => queryClient.setQueryData(coverageKey(merchantId), data),
  });
  const [saved, setSaved] = useState(false);

  if (limit.isPending) return <Loading rows={1} />;
  if (limit.isError) return <ErrorState error={limit.error} onRetry={() => limit.refetch()} />;

  const nextChange = limit.data.nextChangeAt ? new Date(limit.data.nextChangeAt) : null;
  const locked = !asAgency && nextChange !== null && nextChange > new Date();
  const current = limit.data.maxCoveragePercent;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg">
        {current === null ? (
          <>
            Потолок не задан: в приложении кассы действует общий предел {SCANNER_MAX_COVERAGE_PERCENT}%, в 1С — до 100%.
          </>
        ) : (
          <>
            Сейчас — <span className="font-bold tabular-nums">до {current}%</span> цены позиции. В приложении кассы
            действует меньшее из {current}% и {SCANNER_MAX_COVERAGE_PERCENT}%.
          </>
        )}
      </p>

      {canEdit && (
        <Formik<CoverageLimitInput>
          initialValues={{ maxCoveragePercent: current ?? "" }}
          enableReinitialize
          validate={zodValidate(coverageLimitInputSchema)}
          onSubmit={async (values, helpers) => {
            helpers.setStatus(undefined);
            setSaved(false);
            try {
              await save.mutateAsync(values);
              setSaved(true);
            } catch (error) {
              const text =
                error instanceof ApiError && error.isConflict
                  ? error.message || "Менять потолок можно не чаще раза в месяц"
                  : "Не удалось сохранить потолок";
              applyServerIssues(error, helpers, text);
            } finally {
              helpers.setSubmitting(false);
            }
          }}
        >
          {(form) => (
            <Form noValidate className="flex flex-wrap items-start gap-3">
              <FocusFirstError form={form} />
              <FormField
                label="Потолок, %"
                hint="Пусто — не ограничивать."
                className="w-[180px]"
                error={fieldError(form, "maxCoveragePercent")}
              >
                {(parts) => (
                  <Input
                    {...parts}
                    name="maxCoveragePercent"
                    inputMode="numeric"
                    className="tabular-nums"
                    disabled={locked}
                    value={String(form.values.maxCoveragePercent)}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                )}
              </FormField>
              <Button
                type="submit"
                variant="outline"
                className="mt-8"
                disabled={locked || !form.dirty || form.isSubmitting}
              >
                Сохранить
              </Button>
              <div className="basis-full">
                <FormStatus message={formError(form)} />
                {saved && !form.dirty && (
                  <FormStatus tone="success" message="Потолок сохранён — касса и 1С уже его учитывают" />
                )}
              </div>
            </Form>
          )}
        </Formik>
      )}

      <p className="text-sm text-muted-foreground">
        {asAgency
          ? "Агентство меняет потолок в любой момент, и это не сдвигает месячный срок заведения."
          : locked
            ? `Следующая смена — с ${dateFormat.format(nextChange!).replace(/\.$/, "")}. Менять потолок можно раз в месяц.`
            : "Менять потолок можно раз в месяц — после сохранения следующая смена откроется через месяц."}
      </p>
    </div>
  );
}
