"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlarmClock, Bell, BellRing, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateTime } from "@/lib/agenda";
import { dismissReminder, setTaskDone, snoozeReminder } from "@/app/(app)/agenda/actions";

type Reminder = { id: string; title: string; remindAt: string; dueDate: string | null; priority: string };

const POLL_MS = 60_000;
const SEEN_KEY = "agenda:announced-reminders";

function loadSeen(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function saveSeen(seen: Set<string>) {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-200)));
  } catch {
    // sessionStorage no disponible (modo privado, etc.) — solo se repetiría el aviso.
  }
}

/**
 * Campana de alertas de la agenda. Consulta /api/agenda/alerts cada minuto (y al volver a la
 * pestaña) y, cuando un recordatorio llega a su hora, muestra un aviso en pantalla y — si el
 * usuario lo permitió — una notificación del sistema.
 */
export function AgendaBell() {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [pending, startTransition] = useTransition();
  const seenRef = useRef<Set<string> | null>(null);

  const announce = useCallback(
    (items: Reminder[]) => {
      seenRef.current ??= loadSeen();
      // La clave incluye la hora: un recordatorio pospuesto vuelve a anunciarse al sonar de nuevo.
      const keyOf = (r: Reminder) => `${r.id}@${r.remindAt}`;
      const fresh = items.filter((r) => !seenRef.current!.has(keyOf(r)));
      if (fresh.length === 0) return;
      for (const r of fresh) {
        seenRef.current.add(keyOf(r));
        toast.warning(r.title, {
          description: `Recordatorio · ${formatDateTime(r.remindAt)}`,
          duration: 15_000,
          action: { label: "Ver agenda", onClick: () => router.push("/agenda") },
        });
        if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
          try {
            new Notification("Recordatorio de tarea", { body: r.title, tag: `task-${r.id}`, icon: "/icon.png" });
          } catch {
            // Chrome en Android no permite el constructor (exige service worker); queda el aviso en pantalla.
          }
        }
      }
      saveSeen(seenRef.current);
      // Actualiza la página abierta (p. ej. el contador de alertas de /agenda).
      router.refresh();
    },
    [router],
  );

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/agenda/alerts", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { reminders: Reminder[]; overdueCount: number };
      setReminders(data.reminders);
      setOverdueCount(data.overdueCount);
      announce(data.reminders);
    } catch {
      // Sin conexión: se reintenta en el siguiente ciclo.
    }
  }, [announce]);

  useEffect(() => {
    // Primera consulta diferida para no competir con la carga inicial de la página.
    const first = setTimeout(refresh, 1500);
    const interval = setInterval(refresh, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setPermission("Notification" in window ? Notification.permission : "unsupported");
      refresh();
    }
  };

  const run = (action: () => Promise<void>) =>
    startTransition(async () => {
      await action();
      await refresh();
      router.refresh();
    });

  const enableBrowserNotifications = async () => {
    if (!("Notification" in window)) return;
    setPermission(await Notification.requestPermission());
  };

  const count = reminders.length + (overdueCount > 0 ? 1 : 0);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={reminders.length > 0 ? `Alertas: ${reminders.length} recordatorios activos` : "Alertas"}
        >
          {reminders.length > 0 ? <BellRing className="h-5 w-5 text-amber-600" /> : <Bell className="h-5 w-5" />}
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
              {reminders.length || "!"}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Alertas</p>
          <Link href="/agenda" className="text-xs text-primary hover:underline" onClick={() => setOpen(false)}>
            Abrir agenda
          </Link>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {overdueCount > 0 && (
            <Link
              href="/agenda"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 border-b bg-rose-50 px-4 py-2.5 text-sm text-rose-700 hover:bg-rose-100"
            >
              <CalendarClock className="h-4 w-4 shrink-0" />
              {overdueCount === 1 ? "Tienes 1 tarea vencida" : `Tienes ${overdueCount} tareas vencidas`}
            </Link>
          )}

          {reminders.length === 0 ? (
            overdueCount === 0 && <p className="px-4 py-6 text-center text-sm text-muted-foreground">No hay alertas pendientes.</p>
          ) : (
            <ul className="divide-y">
              {reminders.map((r) => (
                <li key={r.id} className="space-y-2 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <AlarmClock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium break-words">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(r.remindAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-6">
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={pending} onClick={() => run(() => setTaskDone(r.id, true))}>
                      Completada
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={pending} onClick={() => run(() => snoozeReminder(r.id, 60))}>
                      Posponer 1 h
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" disabled={pending} onClick={() => run(() => dismissReminder(r.id))}>
                      Descartar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {permission === "default" && (
          <div className="border-t px-4 py-3">
            <Button size="sm" variant="secondary" className="w-full" onClick={enableBrowserNotifications}>
              Activar notificaciones del navegador
            </Button>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Para recibir el aviso aunque estés en otra pestaña.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
