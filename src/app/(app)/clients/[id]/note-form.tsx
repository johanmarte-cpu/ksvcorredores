"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addClientNote } from "../actions";

export function NoteForm({ clientId }: { clientId: string }) {
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={async (formData) => {
        await addClientNote(clientId, String(formData.get("content") ?? ""));
        ref.current?.reset();
      }}
      className="flex gap-2"
    >
      <Textarea name="content" placeholder="Agregar una nota..." className="min-h-16" required />
      <Button type="submit" className="self-end">
        Agregar
      </Button>
    </form>
  );
}
