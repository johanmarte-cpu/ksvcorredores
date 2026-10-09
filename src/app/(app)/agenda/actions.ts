"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { parseBusinessDateTime } from "@/lib/agenda";

type FormState = { error?: string; success?: boolean } | undefined;

const taskSchema = z.object({
  title: z.string().trim().min(1, "El título es requerido").max(200),
  description: z.string().trim().max(5000).optional(),
  dueDate: z.string().optional(),
  remindAt: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  assignedToId: z.string().optional(),
});

function parseTaskForm(formData: FormData) {
  return taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    remindAt: formData.get("remindAt") || undefined,
    priority: formData.get("priority") || "MEDIUM",
    assignedToId: formData.get("assignedToId") || undefined,
  });
}

function taskData(data: z.infer<typeof taskSchema>) {
  return {
    title: data.title,
    description: data.description || null,
    // Fecha-solo: medianoche UTC del día elegido (convención de src/lib/format.ts).
    dueDate: data.dueDate ? new Date(`${data.dueDate}T00:00:00Z`) : null,
    remindAt: parseBusinessDateTime(data.remindAt),
    priority: data.priority,
    assignedToId: data.assignedToId || null,
  };
}

/** Puede modificar una tarea quien la creó, a quien está asignada, o un administrador. */
async function canEditTask(taskId: string) {
  const session = await auth();
  const user = session?.user;
  if (!user) return null;
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { createdById: true, assignedToId: true } });
  if (!task) return null;
  const allowed = user.role === "ADMIN" || task.createdById === user.id || task.assignedToId === user.id;
  return allowed ? user : null;
}

function revalidateAgenda() {
  revalidatePath("/agenda");
  revalidatePath("/dashboard");
}

export async function createTask(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesión expirada" };

  const parsed = parseTaskForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await prisma.task.create({
    data: {
      ...taskData(parsed.data),
      // Sin responsable explícito, la tarea es del usuario que la crea.
      assignedToId: parsed.data.assignedToId || session.user.id,
      createdById: session.user.id,
    },
  });

  revalidateAgenda();
  return { success: true };
}

export async function updateTask(_prevState: FormState, formData: FormData): Promise<FormState> {
  const taskId = String(formData.get("taskId") ?? "");
  if (!(await canEditTask(taskId))) return { error: "No tienes permisos para editar esta tarea" };

  const parsed = parseTaskForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const current = await prisma.task.findUnique({ where: { id: taskId }, select: { remindAt: true } });
  const data = taskData(parsed.data);
  const reminderChanged = current?.remindAt?.getTime() !== data.remindAt?.getTime();

  await prisma.task.update({
    where: { id: taskId },
    // Si se reprograma el recordatorio, vuelve a sonar aunque se haya descartado antes.
    data: { ...data, ...(reminderChanged && { reminderDismissedAt: null }) },
  });

  revalidateAgenda();
  return { success: true };
}

export async function setTaskDone(taskId: string, done: boolean) {
  if (!(await canEditTask(taskId))) return;
  await prisma.task.update({
    where: { id: taskId },
    data: done ? { status: "DONE", completedAt: new Date() } : { status: "PENDING", completedAt: null },
  });
  revalidateAgenda();
}

export async function deleteTask(taskId: string) {
  if (!(await canEditTask(taskId))) return;
  await prisma.task.delete({ where: { id: taskId } });
  revalidateAgenda();
}

/** Descarta la alerta de un recordatorio sin completar la tarea. */
export async function dismissReminder(taskId: string) {
  if (!(await canEditTask(taskId))) return;
  await prisma.task.update({ where: { id: taskId }, data: { reminderDismissedAt: new Date() } });
  revalidateAgenda();
}

/** Pospone el recordatorio `minutes` minutos a partir de ahora. */
export async function snoozeReminder(taskId: string, minutes: number) {
  if (!(await canEditTask(taskId))) return;
  const safeMinutes = Math.min(Math.max(Math.round(minutes), 5), 7 * 24 * 60);
  await prisma.task.update({
    where: { id: taskId },
    data: { remindAt: new Date(Date.now() + safeMinutes * 60_000), reminderDismissedAt: null },
  });
  revalidateAgenda();
}

// ── Anotaciones ──

const noteSchema = z.object({
  title: z.string().trim().max(200).optional(),
  content: z.string().trim().min(1, "La anotación no puede estar vacía").max(10000),
});

function parseNoteForm(formData: FormData) {
  return noteSchema.safeParse({
    title: formData.get("title") || undefined,
    content: formData.get("content"),
  });
}

async function ownNote(noteId: string) {
  const session = await auth();
  if (!session?.user) return null;
  const note = await prisma.agendaNote.findUnique({ where: { id: noteId }, select: { userId: true } });
  return note?.userId === session.user.id ? session.user : null;
}

export async function createNote(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesión expirada" };

  const parsed = parseNoteForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await prisma.agendaNote.create({
    data: { userId: session.user.id, title: parsed.data.title || null, content: parsed.data.content },
  });

  revalidatePath("/agenda");
  return { success: true };
}

export async function updateNote(_prevState: FormState, formData: FormData): Promise<FormState> {
  const noteId = String(formData.get("noteId") ?? "");
  if (!(await ownNote(noteId))) return { error: "No tienes permisos para editar esta anotación" };

  const parsed = parseNoteForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await prisma.agendaNote.update({
    where: { id: noteId },
    data: { title: parsed.data.title || null, content: parsed.data.content },
  });

  revalidatePath("/agenda");
  return { success: true };
}

export async function toggleNotePin(noteId: string, pinned: boolean) {
  if (!(await ownNote(noteId))) return;
  await prisma.agendaNote.update({ where: { id: noteId }, data: { pinned } });
  revalidatePath("/agenda");
}

export async function deleteNote(noteId: string) {
  if (!(await ownNote(noteId))) return;
  await prisma.agendaNote.delete({ where: { id: noteId } });
  revalidatePath("/agenda");
}
