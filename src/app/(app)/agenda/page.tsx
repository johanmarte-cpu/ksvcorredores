import Link from "next/link";
import { AlarmClock, CalendarClock, CalendarDays, CheckCircle2, Pin, StickyNote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { formatDate } from "@/lib/format";
import { TASK_PRIORITY_LABELS } from "@/lib/labels";
import { statusClass, TASK_PRIORITY_TONE } from "@/lib/status-colors";
import {
  businessToday,
  formatDateTime,
  myTasksWhere,
  OPEN_TASK_STATUSES,
  toBusinessDateTimeInput,
  toDateInput,
} from "@/lib/agenda";
import { FadeIn } from "@/components/effects/fade-in";
import { cn } from "@/lib/utils";
import { TaskDialog } from "./task-dialog";
import { DeleteTaskButton, TaskDoneCheckbox } from "./task-row-actions";
import { DeleteNoteButton, EditNoteDialog, NewNoteForm, NotePinButton } from "./note-forms";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;
  const isAdmin = session!.user.role === "ADMIN";
  const showAll = isAdmin && ver === "todas";
  const scope = showAll ? {} : myTasksWhere(userId);

  const now = new Date();
  const today = businessToday(now);
  const tomorrow = new Date(today.getTime() + DAY_MS);

  const taskInclude = {
    assignedTo: { select: { id: true, name: true } },
    renewal: { select: { policyId: true } },
  } as const;

  const [openTasks, doneTasks, notes, users] = await Promise.all([
    prisma.task.findMany({
      where: { AND: [scope, { status: { in: [...OPEN_TASK_STATUSES] } }] },
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
      include: taskInclude,
      take: 300,
    }),
    prisma.task.findMany({
      where: { AND: [scope, { status: "DONE" }] },
      orderBy: { completedAt: { sort: "desc", nulls: "last" } },
      include: taskInclude,
      take: 10,
    }),
    prisma.agendaNote.findMany({
      where: { userId },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const overdue = openTasks.filter((t) => t.dueDate && t.dueDate < today);
  const dueToday = openTasks.filter((t) => t.dueDate && t.dueDate >= today && t.dueDate < tomorrow);
  const upcoming = openTasks.filter((t) => t.dueDate && t.dueDate >= tomorrow);
  const noDate = openTasks.filter((t) => !t.dueDate);
  const activeReminders = openTasks.filter((t) => t.remindAt && t.remindAt <= now && !t.reminderDismissedAt).length;

  type TaskItem = (typeof openTasks)[number];

  const renderTask = (task: TaskItem) => {
    const done = task.status === "DONE";
    const isOverdue = !done && task.dueDate && task.dueDate < today;
    const reminderActive = !done && task.remindAt && task.remindAt <= now && !task.reminderDismissedAt;

    return (
      <li key={task.id} className="flex items-start gap-3 py-3">
        <TaskDoneCheckbox taskId={task.id} done={done} title={task.title} />
        <div className="min-w-0 flex-1 space-y-1">
          <p className={cn("text-sm font-medium break-words", done && "text-muted-foreground line-through")}>{task.title}</p>
          {task.description && <p className="text-xs whitespace-pre-line text-muted-foreground">{task.description}</p>}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <Badge className={statusClass(TASK_PRIORITY_TONE, task.priority)}>{TASK_PRIORITY_LABELS[task.priority]}</Badge>
            {task.dueDate && (
              <span className={cn("flex items-center gap-1", isOverdue && "font-medium text-rose-600")}>
                <CalendarDays className="h-3.5 w-3.5" /> {formatDate(task.dueDate)}
              </span>
            )}
            {task.remindAt && !done && (
              <span className={cn("flex items-center gap-1", reminderActive && "font-medium text-amber-600")}>
                <AlarmClock className="h-3.5 w-3.5" /> {formatDateTime(task.remindAt)}
              </span>
            )}
            {task.assignedTo && task.assignedTo.id !== userId && <span>→ {task.assignedTo.name}</span>}
            {task.renewal && (
              <Link href={`/policies/${task.renewal.policyId}`} className="text-primary underline-offset-2 hover:underline">
                Ver póliza
              </Link>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          {!done && (
            <TaskDialog
              users={users}
              currentUserId={userId}
              task={{
                id: task.id,
                title: task.title,
                description: task.description,
                priority: task.priority,
                assignedToId: task.assignedToId,
                dueDate: toDateInput(task.dueDate),
                remindAt: toBusinessDateTimeInput(task.remindAt),
              }}
            />
          )}
          <DeleteTaskButton taskId={task.id} />
        </div>
      </li>
    );
  };

  const groups = [
    { key: "overdue", title: "Vencidas", tasks: overdue, accent: "text-rose-600" },
    { key: "today", title: "Hoy", tasks: dueToday, accent: "text-[var(--brand-blue)]" },
    { key: "upcoming", title: "Próximas", tasks: upcoming, accent: "" },
    { key: "nodate", title: "Sin fecha", tasks: noDate, accent: "" },
  ].filter((g) => g.tasks.length > 0);

  const stats = [
    { label: "Vencidas", value: overdue.length, icon: CalendarClock, tone: "text-rose-600 bg-rose-50" },
    { label: "Para hoy", value: dueToday.length, icon: CalendarDays, tone: "text-blue-700 bg-blue-50" },
    { label: "Próximas", value: upcoming.length + noDate.length, icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-50" },
    { label: "Alertas activas", value: activeReminders, icon: AlarmClock, tone: "text-amber-700 bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <FadeIn className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Agenda</h1>
          <p className="text-sm text-muted-foreground">Tareas con recordatorio y anotaciones personales</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <div className="flex rounded-lg border p-0.5 text-sm">
              <Link
                href="/agenda"
                className={cn("rounded-md px-2.5 py-1", !showAll ? "bg-muted font-medium" : "text-muted-foreground")}
              >
                Mis tareas
              </Link>
              <Link
                href="/agenda?ver=todas"
                className={cn("rounded-md px-2.5 py-1", showAll ? "bg-muted font-medium" : "text-muted-foreground")}
              >
                Todo el equipo
              </Link>
            </div>
          )}
          <TaskDialog users={users} currentUserId={userId} />
        </div>
      </FadeIn>

      <FadeIn delay={0.05} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", s.tone)}>
                <s.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xl leading-none font-semibold">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-5">
        <FadeIn delay={0.1} className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tareas pendientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {groups.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No tienes tareas pendientes. 🎉</p>
              )}
              {groups.map((g) => (
                <section key={g.key}>
                  <h2 className={cn("text-xs font-semibold tracking-wide uppercase", g.accent || "text-muted-foreground")}>
                    {g.title} · {g.tasks.length}
                  </h2>
                  <ul className="divide-y">{g.tasks.map(renderTask)}</ul>
                </section>
              ))}
            </CardContent>
          </Card>

          {doneTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Completadas recientemente</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">{doneTasks.map(renderTask)}</ul>
              </CardContent>
            </Card>
          )}
        </FadeIn>

        <FadeIn delay={0.15} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <StickyNote className="h-4 w-4 text-muted-foreground" /> Anotaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <NewNoteForm />
              {notes.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Aún no tienes anotaciones.</p>
              ) : (
                <ul className="space-y-3">
                  {notes.map((note) => (
                    <li
                      key={note.id}
                      className={cn(
                        "rounded-lg border p-3",
                        note.pinned ? "border-amber-200 bg-amber-50/60" : "bg-card",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {note.title && (
                            <p className="flex items-center gap-1 text-sm font-medium break-words">
                              {note.pinned && <Pin className="h-3 w-3 shrink-0 text-amber-600" />}
                              {note.title}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-line break-words text-foreground/90">{note.content}</p>
                        </div>
                        <div className="flex shrink-0 items-center">
                          <NotePinButton noteId={note.id} pinned={note.pinned} />
                          <EditNoteDialog note={{ id: note.id, title: note.title, content: note.content }} />
                          <DeleteNoteButton noteId={note.id} />
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">Actualizada {formatDateTime(note.updatedAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
