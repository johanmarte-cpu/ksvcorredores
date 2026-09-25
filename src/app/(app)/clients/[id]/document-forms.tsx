"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadClientDocument, deleteClientDocument } from "../actions";

export function UploadDocumentForm({ clientId }: { clientId: string }) {
  const [state, formAction, pending] = useActionState(uploadClientDocument, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="clientId" value={clientId} />
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Archivo (PDF, Word o imagen, máx. 10MB)</label>
        <Input
          type="file"
          name="file"
          required
          accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp"
          className="w-64"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        <Upload className="mr-1 h-4 w-4" />
        {pending ? "Subiendo..." : "Adjuntar"}
      </Button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

type ClientDocument = {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string | null;
  createdAt: Date;
  uploadedBy: { name: string } | null;
};

export function DocumentList({ clientId, documents }: { clientId: string; documents: ClientDocument[] }) {
  const [pending, startTransition] = useTransition();

  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay documentos adjuntos.</p>;
  }

  return (
    <ul className="divide-y rounded-md border">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between gap-3 p-3 text-sm">
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 items-center gap-2 underline-offset-2 hover:underline"
          >
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{doc.name}</span>
          </a>
          <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
            <span>{doc.uploadedBy?.name ?? "—"}</span>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              disabled={pending}
              onClick={() => startTransition(() => deleteClientDocument(clientId, doc.id))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
