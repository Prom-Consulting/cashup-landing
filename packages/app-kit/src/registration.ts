import { useCallback, useEffect, useRef, useState } from "react";

/** Человек, которого администратор завёл заранее: до первого входа по коду — pending. */
type Registrable = { registrationStatus?: string | null; fullName?: string | null };

/**
 * Список с кем-то в pending перечитываем раз в 20 секунд — чтобы заметить, что человек
 * вошёл. Для refetchInterval у useQuery.
 */
export function refetchWhilePending(query: { state: { data?: unknown } }) {
  const data = query.state.data;
  return Array.isArray(data) && data.some((item: Registrable) => item?.registrationStatus === "pending")
    ? 20_000
    : false;
}

/**
 * Кто между двумя чтениями списка перешёл из pending в registered — для сообщения снизу
 * экрана. Первое чтение только запоминает статусы: иначе при каждом открытии страницы
 * «регистрировались» бы все. `label` — как назвать одного («Кассир», «Сотрудник»…).
 */
export function useJustRegistered<T extends Registrable>(
  items: T[] | undefined,
  keyOf: (item: T) => string,
  label: (item: T) => string,
) {
  const seen = useRef<Map<string, string> | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!items) return;
    const before = seen.current;
    seen.current = new Map(items.map((item) => [keyOf(item), item.registrationStatus ?? ""]));
    if (!before) return;
    const fresh = items.filter(
      (item) => item.registrationStatus === "registered" && before.get(keyOf(item)) === "pending",
    );
    if (fresh.length === 1) {
      const person = fresh[0]!;
      setMessage(`${label(person)} зарегистрировался: ${person.fullName || "без имени"}`);
    } else if (fresh.length > 1) setMessage(`Зарегистрировались: ${fresh.length}`);
    // keyOf и label — чистые функции описания, от них эффект не зависит
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return { message, dismiss: useCallback(() => setMessage(null), []) };
}
