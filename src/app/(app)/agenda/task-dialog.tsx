"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TASK_PRIORITY_LABELS } from "@/lib/labels";
import { useCloseDialogOnSuccess } from "@/lib/use-close-on-success";
import { createTask, updateTask } from "./actions";

export type TaskForEdit = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  assignedToId: string | null;
  /** "YYYY-MM-DD" */
  dueDate: string;
  /** "YYYY-MM-DDTHH:mm" en hora de RD */
  remindAt: string;
};

export function TaskDialog({
  task,
  users,
  currentUserId,
}: {
  task?: TaskForEdit;
  users: { id: string; name: string }[];
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(task ? updateTask : createTask, undefined);
  const [priority, setPriority] = useState(task?.priority ?? "MEDIUM");
  const [assignedToId, setAssignedToId] = useState(task?.assignedToId ?? currentUserId);

  useCloseDialogOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {task ? (
          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Editar tarea">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" /> Nueva tarea
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {task && <input type="hidden" name="taskId" value={task.id} />}
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" defaultValue={task?.title} placeholder="Llamar a cliente por renovación" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" defaultValue={task?.description ?? ""} rows={3} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha límite</Label>
              <Input id="dueDate" name="dueDate" type="date" defaultValue={task?.dueDate} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remindAt">Recordatorio</Label>
              <Input id="remindAt" name="remindAt" type="datetime-local" defaultValue={task?.remindAt} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="priority" value={priority} />
            </div>
            <div className="space-y-2">
              <Label>Responsable</Label>
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.id === currentUserId ? `${u.name} (yo)` : u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="assignedToId" value={assignedToId} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            A la hora del recordatorio verás una alerta en la campana de la barra superior.
          </p>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : task ? "Guardar cambios" : "Crear tarea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
