"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Pencil, Pin, PinOff, Trash2 } from "lucide-react";
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
import { useCloseDialogOnSuccess } from "@/lib/use-close-on-success";
import { createNote, deleteNote, toggleNotePin, updateNote } from "./actions";

export function NewNoteForm() {
  const [state, formAction, pending] = useActionState(createNote, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Limpia el formulario después de guardar.
  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <Input name="title" placeholder="Título (opcional)" aria-label="Título de la anotación" />
      <Textarea name="content" placeholder="Escribe una anotación..." rows={3} required aria-label="Anotación" />
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Guardando..." : "Guardar anotación"}
        </Button>
      </div>
    </form>
  );
}

export function EditNoteDialog({ note }: { note: { id: string; title: string | null; content: string } }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateNote, undefined);

  useCloseDialogOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Editar anotación">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar anotación</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="noteId" value={note.id} />
          <div className="space-y-2">
            <Label htmlFor={`note-title-${note.id}`}>Título</Label>
            <Input id={`note-title-${note.id}`} name="title" defaultValue={note.title ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`note-content-${note.id}`}>Anotación</Label>
            <Textarea id={`note-content-${note.id}`} name="content" defaultValue={note.content} rows={6} required />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NotePinButton({ noteId, pinned }: { noteId: string; pinned: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-7 w-7"
      disabled={pending}
      aria-label={pinned ? "Desfijar anotación" : "Fijar anotación"}
      onClick={() => startTransition(() => toggleNotePin(noteId, !pinned))}
    >
      {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
    </Button>
  );
}

export function DeleteNoteButton({ noteId }: { noteId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="destructive"
          className="h-7 px-2 text-xs"
          disabled={pending}
          onClick={() => startTransition(() => deleteNote(noteId))}
        >
          {pending ? "..." : "Borrar"}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setConfirming(false)}>
          No
        </Button>
      </div>
    );
  }

  return (
    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" aria-label="Borrar anotación" onClick={() => setConfirming(true)}>
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
