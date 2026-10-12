import { Search01Icon } from "@hugeicons/core-free-icons";
import {
  ApiError,
  BUSINESS_PASSWORD_LABELS,
  MERCHANT_ROLE_LABELS,
  type BusinessPasswordRecipient,
  type BusinessPasswordState,
} from "@loal/api";
import { supportWhen } from "@loal/app-kit";
import { formatPhone } from "@loal/ui/inputs";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Icon,
  Input,
  Loading,
  PageHeader,
  cn,
} from "@loal/ui/shadcn";
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { useBusinessPasswords, useSendBusinessPassword } from "../../entities/business-password/api";

type Filter = BusinessPasswordState | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "none", label: "Без пароля" },
  { id: "temporary", label: "Временный" },
  { id: "set", label: "Свой пароль" },
  { id: "all", label: "Все" },
];

const TONE: Record<BusinessPasswordState, "warn" | "neutral" | "good"> = { none: "warn", temporary: "neutral", set: "good" };

function sendErrorText(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "WHATSAPP_FAILED") return "WhatsApp не доставил";
    if (error.code === "RECIPIENT_NOT_FOUND") return "Больше не в заведении";
    if (error.code === "WHATSAPP_UNAVAILABLE") return "WhatsApp не настроен на сервере";
    return error.message;
  }
  return "Не отправилось";
}

const nameOf = (item: BusinessPasswordRecipient) => item.fullName || formatPhone(item.phone);

type Run = { total: number; done: number; failed: { name: string; reason: string }[]; running: boolean };

/**
 * Рассылка идёт по одному человеку: кабинет сам проходит очередь и показывает ход. Её можно
 * остановить и продолжить — сервер не тронет тех, у кого пароль уже свой.
 */
function useBulkSend() {
  const send = useSendBusinessPassword();
  const [run, setRun] = useState<Run | null>(null);
  const stop = useRef(false);

  const start = async (queue: BusinessPasswordRecipient[]) => {
    stop.current = false;
    setRun({ total: queue.length, done: 0, failed: [], running: true });
    for (const item of queue) {
      if (stop.current) break;
      try {
        await send.mutateAsync({ userId: item.userId });
        setRun((prev) => prev && { ...prev, done: prev.done + 1 });
      } catch (error) {
        setRun(
          (prev) =>
            prev && { ...prev, done: prev.done + 1, failed: [...prev.failed, { name: nameOf(item), reason: sendErrorText(error) }] },
        );
      }
    }
    setRun((prev) => prev && { ...prev, running: false });
  };

  return { run, start, stop: () => (stop.current = true), dismiss: () => setRun(null) };
}

function Row({ item }: { item: BusinessPasswordRecipient }) {
  const send = useSendBusinessPassword();
  const [result, setResult] = useState<string | null>(null);
  const action = async (replaceOwn = false) => {
    setResult(null);
    try {
      const outcome = await send.mutateAsync({ userId: item.userId, replaceOwn });
      setResult(outcome.skipped ? "Пароль у него уже свой — не меняли" : "Отправлено в WhatsApp");
    } catch (error) {
      setResult(sendErrorText(error));
    }
  };

  return (
    <li className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:px-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-lg leading-tight font-semibold">{nameOf(item)}</p>
          {item.fullName && <p className="text-base text-muted-foreground tabular-nums">{formatPhone(item.phone)}</p>}
        </div>
        <p className="mt-1 text-base text-muted-foreground">
          {item.merchants.map((merchant, index) => (
            <span key={merchant.merchantId}>
              {index > 0 && "; "}
              <Link to={`/merchants/${merchant.merchantId}`} className="text-foreground underline-offset-4 hover:underline">
                {merchant.merchantName}
              </Link>
              {" — "}
              {MERCHANT_ROLE_LABELS[merchant.role]?.title.toLowerCase() ?? merchant.role}
            </span>
          ))}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {item.password === "set" && item.passwordChangedAt
            ? `Свой пароль с ${supportWhen(item.passwordChangedAt)}`
            : item.password === "temporary" && item.passwordIssuedAt
              ? `Временный отправлен ${supportWhen(item.passwordIssuedAt)}`
              : "Пароль ещё не отправляли"}
          {result && <span className="ml-2 font-medium text-foreground">{result}</span>}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <Badge tone={TONE[item.password]}>{BUSINESS_PASSWORD_LABELS[item.password]}</Badge>
        {item.password === "set" ? (
          <ConfirmDialog
            trigger={
              <Button size="sm" variant="ghost" disabled={send.isPending}>
                Сбросить
              </Button>
            }
            title="Сбросить пароль?"
            description={`${nameOf(item)} задал свой пароль. Он перестанет работать, а в WhatsApp придёт новый временный. Делайте так, только если человек сам попросил и не может войти по коду.`}
            confirmLabel="Сбросить и отправить"
            onConfirm={() => action(true)}
          />
        ) : (
          <Button size="sm" variant="outline" disabled={send.isPending} onClick={() => action()}>
            {send.isPending ? "Отправляем…" : item.password === "temporary" ? "Отправить заново" : "Отправить"}
          </Button>
        )}
      </div>
    </li>
  );
}

/**
 * Переход партнёров на вход по паролю: кто уже с паролем, кому ещё отправить. Временный пароль
 * уходит в WhatsApp, при входе кабинет просит заменить его своим.
 */
export function BusinessPasswordsPage() {
  const passwords = useBusinessPasswords();
  const bulk = useBulkSend();
  const [filter, setFilter] = useState<Filter>("none");
  const [search, setSearch] = useState("");

  const items = useMemo(() => passwords.data?.items ?? [], [passwords.data]);
  const without = items.filter((item) => item.password === "none");
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const digits = query.replace(/\D/g, "");
    return items.filter(
      (item) =>
        (filter === "all" || item.password === filter) &&
        (!query ||
          item.fullName?.toLowerCase().includes(query) ||
          (digits && item.phone.includes(digits)) ||
          item.merchants.some((merchant) => merchant.merchantName.toLowerCase().includes(query))),
    );
  }, [items, filter, search]);

  if (passwords.isPending) return <Loading rows={5} />;
  if (passwords.isError) return <ErrorState error={passwords.error} onRetry={() => passwords.refetch()} />;
  const { summary } = passwords.data;
  const counts: Record<Filter, number> = { none: summary.none, temporary: summary.temporary, set: summary.set, all: summary.total };
  const run = bulk.run;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Пароли партнёров"
        description="Вход в кабинет партнёра теперь по номеру и паролю. Владельцам и администраторам филиалов уходит временный пароль в WhatsApp, при входе кабинет просит заменить его своим."
      />

      <Card className="grid gap-6 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] sm:items-center">
        {[
          { label: "Без пароля", value: summary.none },
          { label: "Временный отправлен", value: summary.temporary },
          { label: "Задали свой", value: summary.set },
        ].map((stat) => (
          <div key={stat.label}>
            <p className="display text-[2rem] leading-none tabular-nums">{stat.value}</p>
            <p className="mt-1 text-base text-muted-foreground">{stat.label}</p>
          </div>
        ))}
        {without.length > 0 && !run?.running && (
          <ConfirmDialog
            tone="primary"
            trigger={<Button>Отправить всем без пароля</Button>}
            title={`Отправить пароли ${without.length} ${without.length === 1 ? "человеку" : "людям"}?`}
            description="Каждому придёт в WhatsApp сообщение: сайт partner.loal.kg, логин — его номер и временный пароль. Отправка идёт по одному, её можно остановить."
            confirmLabel="Отправить"
            onConfirm={() => {
              void bulk.start(without);
            }}
          />
        )}
      </Card>

      {run && (
        <Card role="status" aria-live="polite" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-semibold">
              {run.running ? "Отправляем" : "Готово"}: {run.done} из {run.total}
              {run.failed.length > 0 && <span className="text-destructive"> · не дошло {run.failed.length}</span>}
            </p>
            {run.running ? (
              <Button size="sm" variant="outline" onClick={bulk.stop}>
                Остановить
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={bulk.dismiss}>
                Скрыть
              </Button>
            )}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${run.total ? (run.done / run.total) * 100 : 0}%` }}
            />
          </div>
          {run.failed.length > 0 && (
            <ul className="text-base text-muted-foreground">
              {run.failed.map((failure) => (
                <li key={failure.name}>
                  {failure.name}: {failure.reason}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Пароль">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-base transition-colors",
                filter === item.id ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground",
              )}
            >
              {item.label}
              <span className="tabular-nums opacity-70">{counts[item.id]}</span>
            </button>
          ))}
        </div>
        <label className="relative sm:w-[300px]">
          <span className="sr-only">Поиск</span>
          <Icon icon={Search01Icon} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Имя, телефон, заведение"
            className="pl-11"
          />
        </label>
      </div>

      <Card className="overflow-hidden p-0">
        {visible.length === 0 ? (
          <EmptyState
            title={filter === "none" && !search ? "У всех есть пароль" : "Никого не нашли"}
            description={filter === "none" && !search ? "Новые владельцы задают пароль сами при первом входе по коду." : undefined}
          />
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((item) => (
              <Row key={item.userId} item={item} />
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
