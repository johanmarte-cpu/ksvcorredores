"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteTask, setTaskDone } from "./actions";

export function TaskDoneCheckbox({ taskId, done, title }: { taskId: string; done: boolean; title: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Checkbox
      checked={done}
      disabled={pending}
      aria-label={done ? `Marcar "${title}" como pendiente` : `Marcar "${title}" como completada`}
      className="mt-0.5 h-5 w-5"
      onCheckedChange={(checked) => startTransition(() => setTaskDone(taskId, checked === true))}
    />
  );
}

/** Borrar pide una segunda pulsación en lugar de un confirm() del navegador. */
export function DeleteTaskButton({ taskId }: { taskId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="destructive"
          className="h-8"
          disabled={pending}
          onClick={() => startTransition(() => deleteTask(taskId))}
        >
          {pending ? "Borrando..." : "Borrar"}
        </Button>
        <Button size="sm" variant="ghost" className="h-8" onClick={() => setConfirming(false)}>
          No
        </Button>
      </div>
    );
  }

  return (
    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" aria-label="Borrar tarea" onClick={() => setConfirming(true)}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
