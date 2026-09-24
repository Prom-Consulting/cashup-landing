import { PROGRAM_TYPE_LABELS, type Program } from "@loal/api";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@loal/ui/shadcn";
import { useState, type ReactNode } from "react";
import { useProgramMembers, usePrograms } from "../../entities/platform/api";
import { MechanicAccess, BonusItemForm } from "../../features/program/partner-access";
import { AppleRelevanceForm, GoogleMessageForm } from "../../features/program/program-messages";
import { CreateProgramForm, EditProgramForm } from "../../features/program/program-form";
import { TierList } from "../../features/program/tier-list";

const money = new Intl.NumberFormat("ru-RU");
const date = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" });

const CARD_STATUS: Record<string, string> = { active: "действует", suspended: "приостановлена", revoked: "отозвана" };

function Members({ programId }: { programId: string }) {
  const members = useProgramMembers(programId);
  const [search, setSearch] = useState("");

  if (members.isPending) return <Loading rows={3} />;
  if (members.isError) return <ErrorState error={members.error} onRetry={() => members.refetch()} />;
  if (members.data.length === 0) return <EmptyState title="Карт по этой программе ещё не выдавали" />;

  const needle = search.trim().toLowerCase();
  const rows = members.data.filter((member) =>
    needle
      ? [member.first_name, member.last_name, member.phone, member.serial_number].some((value) =>
          value?.toLowerCase().includes(needle),
        )
      : true,
  );
  const active = members.data.filter((member) => member.status === "active").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base text-muted-foreground">
          Действующих карт: <span className="font-medium text-foreground tabular-nums">{money.format(active)}</span> из{" "}
          {money.format(members.data.length)}
        </p>
        <input
          type="search"
          aria-label="Поиск по держателям"
          placeholder="Имя, телефон или номер карты"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-11 w-full max-w-[320px] rounded-2xl border-2 border-border bg-surface px-4 text-base outline-none focus:border-foreground"
        />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Держатель</TableHeaderCell>
              <TableHeaderCell>Телефон</TableHeaderCell>
              <TableHeaderCell>Карта</TableHeaderCell>
              <TableHeaderCell className="text-right">Баланс</TableHeaderCell>
              <TableHeaderCell>Выдана</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.slice(0, 200).map((member) => (
              <TableRow key={member.card_id}>
                <TableCell>{[member.first_name, member.last_name].filter(Boolean).join(" ") || "—"}</TableCell>
                <TableCell className="tabular-nums">{member.phone ?? "—"}</TableCell>
                <TableCell>
                  <span className="tabular-nums">{member.serial_number}</span>{" "}
                  <Badge tone={member.status === "active" ? "good" : "quiet"}>
                    {CARD_STATUS[member.status] ?? member.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{money.format(member.points_balance ?? 0)}</TableCell>
                <TableCell>{member.created_at ? date.format(new Date(member.created_at)) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {rows.length > 200 && <p className="text-sm text-muted-foreground">Показаны первые 200 — уточните поиск.</p>}
    </div>
  );
}

function Block({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        {description && <p className="mt-0.5 max-w-[62ch] text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ProgramCard({ program, open, onToggle }: { program: Program; open: boolean; onToggle: () => void }) {
  const points = (program.config as { pointsPerPeriod?: number } | null)?.pointsPerPeriod;
  return (
    <Card>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
      >
        <span>
          <span className="flex items-center gap-2 text-xl font-bold">
            {program.name}
            {program.active === false && <Badge tone="quiet">выключена</Badge>}
          </span>
          <span className="mt-1 block text-base text-muted-foreground">
            {PROGRAM_TYPE_LABELS[program.programType] ?? program.programType}
            {points ? ` · ${money.format(points)} бонусов за месяц` : ""}
          </span>
        </span>
        <span className="text-base text-muted-foreground">{open ? "Свернуть" : "Открыть"}</span>
      </button>

      {open && (
        <Tabs defaultValue="settings" className="mt-6 border-t border-border pt-5">
          <TabsList className="flex-wrap">
            <TabsTrigger value="settings">Настройки</TabsTrigger>
            <TabsTrigger value="tiers">Уровни</TabsTrigger>
            <TabsTrigger value="members">Держатели</TabsTrigger>
            <TabsTrigger value="messages">Сообщения</TabsTrigger>
            <TabsTrigger value="partners">Партнёрам</TabsTrigger>
          </TabsList>
          <TabsContent value="settings" className="mt-5">
            <EditProgramForm program={program} />
          </TabsContent>
          <TabsContent value="tiers" className="mt-5">
            <TierList programId={program.id} />
          </TabsContent>
          <TabsContent value="members" className="mt-5">
            <Members programId={program.id} />
          </TabsContent>
          <TabsContent value="messages" className="mt-5 flex flex-col gap-8">
            <Block
              title="Экран блокировки iPhone"
              description="Apple не даёт слать держателям текст. Карта может сама всплыть рядом с точкой — например, у партнёра — или в назначенное время."
            >
              <AppleRelevanceForm programId={program.id} />
            </Block>
            <Block
              title="Сообщение в Google Wallet"
              description="Настоящее уведомление с текстом — только владельцам Android."
            >
              <GoogleMessageForm programId={program.id} />
            </Block>
          </TabsContent>
          <TabsContent value="partners" className="mt-5 flex flex-col gap-8">
            <Block
              title="Что можно партнёрам"
              description="Закрытая механика недоступна всем партнёрам и их сотрудникам в этой программе."
            >
              <MechanicAccess program={program} />
            </Block>
            <Block title="Бонусный товар">
              <BonusItemForm program={program} />
            </Block>
          </TabsContent>
        </Tabs>
      )}
    </Card>
  );
}

/** Программы платформы: сколько даёт месяц подписки, уровни, держатели и рассылки. */
export function ProgramsPage() {
  const programs = usePrograms();
  const [openProgram, setOpenProgram] = useState<string | null>(null);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Программы"
        description="Программа решает, сколько бонусов даёт месяц подписки. Как выглядит карта — в разделе «Карты»."
      />

      <Card>
        <h2 className="text-xl font-bold">Новая программа</h2>
        <div className="mt-5">
          <CreateProgramForm />
        </div>
      </Card>

      {programs.isPending && <Loading rows={2} />}
      {programs.isError && <ErrorState error={programs.error} onRetry={() => programs.refetch()} />}
      {programs.isSuccess && programs.data.length === 0 && <EmptyState title="Программ пока нет" />}

      <div className="flex flex-col gap-4">
        {(programs.data ?? []).map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
            open={openProgram === program.id}
            onToggle={() => setOpenProgram(openProgram === program.id ? null : program.id)}
          />
        ))}
      </div>
    </section>
  );
}
