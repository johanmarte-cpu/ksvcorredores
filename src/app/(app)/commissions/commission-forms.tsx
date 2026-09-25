"use client";

import { useActionState, useState } from "react";
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
import { createPolicyCommission, markCommissionReceived } from "./actions";
import { useCloseDialogOnSuccess } from "@/lib/use-close-on-success";

export function NewCommissionDialog({ policyId, defaultAmount }: { policyId: string; defaultAmount: number }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createPolicyCommission, undefined);
  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  useCloseDialogOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          Registrar comisión esperada
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar comisión esperada</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="policyId" value={policyId} />
          <div className="space-y-2">
            <Label htmlFor="period">Período (AAAA-MM)</Label>
            <Input id="period" name="period" defaultValue={defaultPeriod} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expectedAmount">Monto esperado</Label>
            <Input id="expectedAmount" name="expectedAmount" type="number" step="0.01" min="0" defaultValue={defaultAmount} required />
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

export function ReceiveCommissionDialog({ policyId, commissionId, expectedAmount }: { policyId: string; commissionId: string; expectedAmount: number }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(expectedAmount);
  const [pending, setPending] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Marcar recibida
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar comisión recibida</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receivedAmount">Monto recibido</Label>
            <Input
              id="receivedAmount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <DialogFooter>
            <Button
              disabled={pending}
              onClick={async () => {
                setPending(true);
                await markCommissionReceived(policyId, commissionId, amount);
                setPending(false);
                setOpen(false);
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
