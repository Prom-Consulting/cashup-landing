import type { FormikErrors, FormikProps } from "formik";
import type { ZodType } from "zod";

/** Раскладываем ошибки zod по путям полей: a.b[0].c -> { a: { b: [{ c: "..." }] } } */
function assign(target: Record<string, unknown>, path: PropertyKey[], message: string) {
  let node: Record<string, unknown> = target;
  path.forEach((rawKey, index) => {
    const key = String(rawKey);
    if (index === path.length - 1) {
      if (node[key] === undefined) node[key] = message;
      return;
    }
    const nextIsIndex = /^\d+$/.test(String(path[index + 1]));
    if (typeof node[key] !== "object" || node[key] === null) node[key] = nextIsIndex ? [] : {};
    node = node[key] as Record<string, unknown>;
  });
}

/** Ошибки zod в формате Formik. Первая ошибка на поле — остальные не показываем. */
export function toFormikErrors<Values>(issues: readonly { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, unknown> = {};
  for (const issue of issues) {
    if (issue.path.length === 0) continue;
    assign(errors, issue.path, issue.message);
  }
  return errors as FormikErrors<Values>;
}

/**
 * Проверка формы одной схемой: те же правила, что уходят на сервер.
 * ```tsx
 * <Formik validate={zodValidate(loginInputSchema)} ... />
 * ```
 */
export function zodValidate<Values>(schema: ZodType<Values>) {
  return (values: Values): FormikErrors<Values> | void => {
    const result = schema.safeParse(values);
    if (result.success) return;
    return toFormikErrors<Values>(result.error.issues);
  };
}

/** Текст ошибки поля — только после того, как человек его тронул. */
export function fieldError<Values>(form: FormikProps<Values>, name: keyof Values & string): string | undefined {
  const touched = form.touched[name];
  const error = form.errors[name];
  return touched && typeof error === "string" ? error : undefined;
}

/**
 * Ошибка отправки формы целиком (сеть, 401, 422) лежит в status, а не в errors:
 * errors принадлежат полям и стираются на следующем вводе.
 */
export function formError<Values>(form: FormikProps<Values>): string | undefined {
  return typeof form.status === "string" ? form.status : undefined;
}
