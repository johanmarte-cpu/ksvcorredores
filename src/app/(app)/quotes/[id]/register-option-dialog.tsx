"use client";

import { useActionState, useState } from "react";
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
import { registerQuoteOption } from "../actions";
import { useCloseDialogOnSuccess } from "@/lib/use-close-on-success";

export function RegisterOptionDialog({ quoteId, quoteRequestId }: { quoteId: string; quoteRequestId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(registerQuoteOption, undefined);

  useCloseDialogOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          Registrar propuesta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar propuesta de la aseguradora</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="quoteId" value={quoteId} />
          <input type="hidden" name="quoteRequestId" value={quoteRequestId} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="premium">Prima</Label>
              <Input id="premium" name="premium" type="number" step="0.01" min="0" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deductible">Deducible</Label>
              <Input id="deductible" name="deductible" type="number" step="0.01" min="0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="termMonths">Vigencia (meses)</Label>
            <Input id="termMonths" name="termMonths" type="number" defaultValue={12} min={1} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coverageSummary">Resumen de cobertura</Label>
            <Textarea id="coverageSummary" name="coverageSummary" />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar propuesta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
