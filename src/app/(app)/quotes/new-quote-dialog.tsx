"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { createQuote } from "./actions";
import { LOB_LABELS } from "@/lib/labels";

export function NewQuoteDialog({ clients }: { clients: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createQuote, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" /> Nueva cotización
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva solicitud de cotización</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Cliente</label>
            <Select name="clientId" required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de seguro</label>
            <Select name="lineOfBusiness" defaultValue="AUTO" required>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LOB_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notas</label>
            <Textarea name="notes" placeholder="Detalles de la solicitud..." />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
