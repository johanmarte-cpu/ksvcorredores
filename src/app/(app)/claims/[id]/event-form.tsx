"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addClaimEvent } from "../actions";

export function EventForm({ claimId }: { claimId: string }) {
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={async (formData) => {
        await addClaimEvent(claimId, String(formData.get("content") ?? ""));
        ref.current?.reset();
      }}
      className="flex gap-2"
    >
      <Textarea name="content" placeholder="Agregar un comentario o seguimiento..." className="min-h-16" required />
      <Button type="submit" className="self-end">
        Agregar
      </Button>
    </form>
  );
}
