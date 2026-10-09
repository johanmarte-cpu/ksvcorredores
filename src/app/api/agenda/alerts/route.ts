import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { activeRemindersWhere, businessToday, myTasksWhere, OPEN_TASK_STATUSES } from "@/lib/agenda";

// Consultado periódicamente por la campana de la barra superior (src/components/layout/agenda-bell.tsx).
// /api queda fuera del proxy de autenticación, así que la sesión se valida aquí.
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const now = new Date();

  const [reminders, overdueCount] = await Promise.all([
    prisma.task.findMany({
      where: activeRemindersWhere(userId, now),
      orderBy: { remindAt: "asc" },
      select: { id: true, title: true, remindAt: true, dueDate: true, priority: true },
      take: 20,
    }),
    prisma.task.count({
      where: {
        AND: [myTasksWhere(userId), { status: { in: [...OPEN_TASK_STATUSES] }, dueDate: { lt: businessToday(now) } }],
      },
    }),
  ]);

  return NextResponse.json({ reminders, overdueCount }, { headers: { "Cache-Control": "no-store" } });
}
