import { FIELD_GROUPS } from "@loal/api";
import type { FormikErrors, FormikProps } from "formik";
import { useEffect, useRef } from "react";

export type DesignError = { path: string; message: string };

/** Ошибки Formik — вложенные объекты и массивы; разворачиваем в плоский список путей. */
export function flattenErrors(errors: FormikErrors<unknown> | unknown, prefix = ""): DesignError[] {
  if (typeof errors === "string") return [{ path: prefix, message: errors }];
  if (!errors || typeof errors !== "object") return [];
  return Object.entries(errors as Record<string, unknown>).flatMap(([key, value]) =>
    flattenErrors(value, prefix ? `${prefix}.${key}` : key),
  );
}

const TOP: Record<string, string> = {
  organizationName: "Организация",
  description: "Описание карты",
  logoText: "Текст рядом с логотипом",
  backgroundColor: "Цвет фона",
  foregroundColor: "Цвет текста",
  labelColor: "Цвет подписей",
  barcodeFormat: "Формат штрихкода",
  barcodeAltText: "Подпись под кодом",
  hoursBeforeExpiration: "Напомнить за, часов",
  locations: "Точки рядом",
  punchIcons: "Штампы",
};

const PART: Record<string, string> = {
  key: "ключ",
  label: "подпись",
  value: "значение",
  changeMessage: "уведомление",
  latitude: "широта",
  longitude: "долгота",
  relevantText: "текст",
  target: "количество",
  iconUrl: "картинка",
};

/** Путь ошибки человеческими словами: «Крупно по центру, поле 1 — ключ». */
export function describePath(path: string) {
  const [head, index, part] = path.split(".");
  const group = FIELD_GROUPS.find((item) => item.key === head);
  if (group) return `${group.label}, поле ${Number(index) + 1}${part ? ` — ${PART[part] ?? part}` : ""}`;
  if (head === "locations" && index !== undefined)
    return `Точка ${Number(index) + 1}${part ? ` — ${PART[part] ?? part}` : ""}`;
  if (head === "punchIcons" && index) return `Штампы — ${PART[index] ?? index}`;
  return TOP[head] ?? head;
}

/**
 * Прокрутить к полю с ошибкой. Ищем сам ввод по name; если его нет (у живого поля
 * значение не редактируется) — ближайший контейнер с data-path по укороченному пути.
 */
export function goToError(path: string) {
  const parts = path.split(".");
  let target: HTMLElement | null = null;
  for (let length = parts.length; length > 0 && !target; length -= 1) {
    const prefix = parts.slice(0, length).join(".");
    target =
      document.querySelector<HTMLElement>(`[name="${CSS.escape(prefix)}"]`) ??
      document.querySelector<HTMLElement>(`[data-path="${CSS.escape(prefix)}"]`);
  }
  if (!target) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  if (target.matches("input, select, textarea, button")) target.focus({ preventScroll: true });
  // Короткая подсветка — чтобы глаз нашёл место, куда прокрутило
  const box = target.closest<HTMLElement>("[data-path]") ?? target;
  box.animate?.([{ boxShadow: "0 0 0 4px rgb(255 93 52 / 0.55)" }, { boxShadow: "0 0 0 0 rgb(255 93 52 / 0)" }], {
    duration: 1400,
    easing: "ease-out",
  });
}

/** После неудачной отправки — к первой ошибке. Только по отправке, не на каждый ввод. */
export function FocusDesignError<Values>({ form }: { form: FormikProps<Values> }) {
  const handled = useRef(0);
  useEffect(() => {
    if (form.submitCount === 0 || form.submitCount === handled.current || form.isSubmitting) return;
    const first = flattenErrors(form.errors)[0];
    if (!first) return;
    handled.current = form.submitCount;
    goToError(first.path);
  }, [form.submitCount, form.isSubmitting, form.errors]);
  return null;
}

/** Список того, что мешает сохранить, — каждая строка ведёт к полю. */
export function DesignErrorSummary({ errors }: { errors: DesignError[] }) {
  if (errors.length === 0) return null;
  return (
    <div role="alert" className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-4">
      <p className="text-base font-bold text-destructive">
        Не сохранено: {errors.length === 1 ? "одна ошибка" : `ошибок — ${errors.length}`}
      </p>
      <ul className="mt-2 flex flex-col gap-1">
        {errors.slice(0, 8).map((error) => (
          <li key={error.path}>
            <button
              type="button"
              onClick={() => goToError(error.path)}
              className="text-left text-sm leading-snug underline-offset-4 hover:underline"
            >
              <span className="font-semibold">{describePath(error.path)}:</span> {error.message}
            </button>
          </li>
        ))}
      </ul>
      {errors.length > 8 && <p className="mt-1 text-sm text-muted-foreground">и ещё {errors.length - 8}</p>}
    </div>
  );
}
