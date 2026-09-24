import { ApiError, ApiShapeError } from "@loal/api";
import type { FormikErrors, FormikHelpers, FormikProps } from "formik";
import { useEffect } from "react";
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
// Схема описывает тело запроса, а форма держит строки из полей: вход и выход схемы
// разные (coerce, пустое → null), поэтому тип значений берём из формы, а не из схемы.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zodValidate<Values>(schema: ZodType<any, any>) {
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
 * Ошибка отправки формы целиком (сеть, 401, 409) лежит в status, а не в errors:
 * errors принадлежат полям и стираются на следующем вводе.
 */
export function formError<Values>(form: FormikProps<Values>): string | undefined {
  return typeof form.status === "string" ? form.status : undefined;
}

/**
 * Ответ сервера с ошибками полей раскладываем по этим полям, а не прячем в одну
 * строку внизу формы: человек должен видеть, что именно поправить. Всё, что не
 * привязано к полю, уходит в status.
 *
 * Бэкенд присылает их в `issues` — путь до поля и текст (docs/API.md).
 */
export function applyServerIssues<Values>(
  error: unknown,
  helpers: Pick<FormikHelpers<Values>, "setErrors" | "setStatus" | "setTouched">,
  /** Человеческий текст вместо технического: «Неверная почта или пароль» и подобное. */
  message?: string,
): void {
  if (error instanceof ApiError && error.issues.length > 0) {
    const errors = toFormikErrors<Values>(error.issues);
    const touched = Object.fromEntries(Object.keys(errors).map((key) => [key, true]));
    helpers.setErrors(errors);
    helpers.setTouched(touched as never, false);
    // Общий текст всё равно показываем: он объясняет, почему форма не ушла
    helpers.setStatus(message ?? error.message);
    return;
  }

  if (error instanceof ApiShapeError) {
    helpers.setStatus("Сервер ответил не так, как ожидает приложение. Мы уже знаем об этом.");
    return;
  }

  helpers.setStatus(message ?? (error instanceof Error ? error.message : "Не удалось сохранить"));
}

/**
 * После неудачной отправки переводит фокус на первое поле с ошибкой. Без этого
 * на длинной форме человек не видит, где именно проблема.
 */
export function FocusFirstError<Values>({ form }: { form: FormikProps<Values> }) {
  const { submitCount, isValid, errors } = form;

  useEffect(() => {
    if (submitCount === 0 || isValid) return;
    const first = Object.keys(errors)[0];
    if (!first) return;
    const field = document.querySelector<HTMLElement>(`[name="${first}"], #${CSS.escape(first)}`);
    field?.focus();
    field?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [submitCount, isValid, errors]);

  return null;
}
