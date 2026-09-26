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
import { registerPayment, markPaymentPaid, updatePaymentSchedule } from "../actions";
import { useCloseDialogOnSuccess } from "@/lib/use-close-on-success";
import { formatCurrency } from "@/lib/format";

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

export function EditScheduleDialog({ policyId, remainingAmount }: { policyId: string; remainingAmount: number }) {
  const [open, setOpen] = useState(false);
  const [installments, setInstallments] = useState(1);
  const [state, formAction, pending] = useActionState(updatePaymentSchedule, undefined);
  const [today] = useState(() => new Date().toISOString().slice(0, 10));

  useCloseDialogOnSuccess(state, setOpen);

  const preview = installments > 0 ? remainingAmount / installments : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Editar acuerdo de pago
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar acuerdo de pago</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="policyId" value={policyId} />
          <p className="text-sm text-muted-foreground">
            Reprograma el saldo pendiente ({formatCurrency(remainingAmount)}) en la cantidad de cuotas que quieras, sin importar la
            forma de pago original de la póliza. Las cuotas ya marcadas como pagadas no se tocan.
          </p>
          <div className="space-y-2">
            <Label htmlFor="installments">Número de cuotas</Label>
            <Input
              id="installments"
              name="installments"
              type="number"
              min={1}
              max={36}
              step={1}
              required
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value) || 1)}
            />
            {installments > 0 && (
              <p className="text-xs text-muted-foreground">
                {installments} cuota{installments === 1 ? "" : "s"} de ≈ {formatCurrency(preview)} cada una (mensual)
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Fecha de la primera cuota</Label>
            <Input id="startDate" name="startDate" type="date" defaultValue={today} required />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Actualizar acuerdo de pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
