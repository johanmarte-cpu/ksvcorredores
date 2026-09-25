"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { registerPayment, markPaymentPaid } from "../actions";
import { useCloseDialogOnSuccess } from "@/lib/use-close-on-success";

export function NewPaymentDialog({ policyId }: { policyId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(registerPayment, undefined);

  useCloseDialogOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          Agregar cobro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar cobro</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="policyId" value={policyId} />
          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Fecha de vencimiento</Label>
            <Input id="dueDate" name="dueDate" type="date" required />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MarkPaidButton({ policyId, paymentId }: { policyId: string; paymentId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={() => startTransition(() => markPaymentPaid(policyId, paymentId))}>
      Marcar pagado
    </Button>
  );
}
