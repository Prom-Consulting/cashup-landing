import { ChipSelect } from "@loal/ui/shadcn";
import { useEffect, useId, useState } from "react";

export type WorkBranch = { id: string; name?: string | null };

const storageKey = (scope: string) => `loal.work-branch.${scope}`;

function readStored(scope: string) {
  try {
    return localStorage.getItem(storageKey(scope));
  } catch {
    return null;
  }
}

/**
 * Филиал, на который записываются операции (docs/API.md, «Выбор филиала операции»).
 * Один филиал — выбран сам. Несколько — человек выбирает, где работает сейчас, и выбор живёт
 * на устройстве: на кассе его не переспрашивают при каждом списании. Без выбора сервер ответит
 * 400 BRANCH_REQUIRED, поэтому форма не отправит запрос, пока филиал не выбран.
 */
export function useWorkBranch(branches: WorkBranch[] | undefined, scope: string) {
  const list = branches ?? [];
  const [chosen, setChosen] = useState<string | null>(() => readStored(scope));
  useEffect(() => setChosen(readStored(scope)), [scope]);

  const valid = list.find((branch) => branch.id === chosen);
  const branch = list.length === 1 ? list[0]! : (valid ?? null);
  const choose = (id: string) => {
    setChosen(id);
    try {
      localStorage.setItem(storageKey(scope), id);
    } catch {
      // Без памяти выбор продержится до перезагрузки
    }
  };
  return { branch, branches: list, choose, needsChoice: list.length > 1 && !branch, canSwitch: list.length > 1 };
}

/** Чипы «где работаю сейчас» — показываются, только если филиалов больше одного. */
export function WorkBranchPicker({
  work,
  invalid,
}: {
  work: ReturnType<typeof useWorkBranch>;
  invalid?: boolean;
}) {
  const labelId = useId();
  if (!work.canSwitch) return null;
  return (
    <div className="flex flex-col gap-2">
      <p id={labelId} className="text-base font-semibold">
        Филиал
      </p>
      <ChipSelect
        label="Филиал, где вы сейчас работаете"
        describedBy={labelId}
        invalid={invalid}
        options={work.branches.map((branch) => ({ value: branch.id, label: branch.name || "Филиал" }))}
        value={work.branch ? [work.branch.id] : []}
        // Один филиал за раз: новый выбор заменяет прежний, снять выбор нельзя
        onChange={(next) => {
          const added = next.find((id) => id !== work.branch?.id);
          if (added) work.choose(added);
        }}
      />
      {invalid && <p className="text-sm font-medium text-destructive">Выберите филиал — операция запишется на него.</p>}
    </div>
  );
}
