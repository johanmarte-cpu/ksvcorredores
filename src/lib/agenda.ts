import type { Prisma } from "@/generated/prisma/client";

// La República Dominicana no tiene horario de verano: siempre UTC-4. Los recordatorios
// (remindAt) son instantes reales, así que la hora que escribe el usuario en un
// <input type="datetime-local"> se interpreta en esta zona, sin importar dónde corra el servidor.
export const BUSINESS_TIME_ZONE = "America/Santo_Domingo";
const BUSINESS_UTC_OFFSET = "-04:00";

/** "2026-10-09T15:30" (hora de RD) → Date. Devuelve null si está vacío o es inválido. */
export function parseBusinessDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(`${value.length === 16 ? `${value}:00` : value}${BUSINESS_UTC_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Date → "2026-10-09T15:30" en hora de RD, para el defaultValue de un datetime-local. */
export function toBusinessDateTimeInput(date: Date | null | undefined): string {
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Date (fecha-solo en UTC medianoche) → "2026-10-09" para el defaultValue de un input date. */
export function toDateInput(date: Date | null | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function formatDateTime(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: BUSINESS_TIME_ZONE,
  }).format(value);
}

/** Medianoche UTC del día de hoy en RD — el mismo formato en que se guardan las fechas-solo (dueDate). */
export function businessToday(now = new Date()) {
  const [y, m, d] = toBusinessDateTimeInput(now).slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export const OPEN_TASK_STATUSES = ["PENDING", "IN_PROGRESS"] as const;

/** Tareas visibles para un usuario en su agenda: asignadas a él, o creadas por él sin asignar a otro. */
export function myTasksWhere(userId: string): Prisma.TaskWhereInput {
  return {
    OR: [{ assignedToId: userId }, { createdById: userId, assignedToId: null }],
  };
}

/** Recordatorios que ya llegaron a su hora y siguen sin atender. */
export function activeRemindersWhere(userId: string, now = new Date()): Prisma.TaskWhereInput {
  return {
    AND: [
      myTasksWhere(userId),
      {
        status: { in: [...OPEN_TASK_STATUSES] },
        remindAt: { lte: now },
        reminderDismissedAt: null,
      },
    ],
  };
}
