"use client";

import { useActionState, useState, useTransition, type ReactNode } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignPolicyReferral, markReferralPaid, removePolicyReferral } from "./actions";
import { useCloseDialogOnSuccess } from "@/lib/use-close-on-success";
import { formatCurrency } from "@/lib/format";

type ReferrerOption = { id: string; name: string };

export function AssignReferralDialog({
  policyId,
  premium,
  defaultPercentage,
  referrers,
  current,
  trigger,
}: {
  policyId: string;
  premium: number;
  defaultPercentage: number;
  referrers: ReferrerOption[];
  current?: { referrerId: string; percentage: number };
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [referrerId, setReferrerId] = useState(current?.referrerId ?? "");
  const [percentage, setPercentage] = useState(current?.percentage ?? defaultPercentage);
  const [state, formAction, pending] = useActionState(assignPolicyReferral, undefined);

  useCloseDialogOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{current ? "Editar referido" : "Asignar referido"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="policyId" value={policyId} />
          <input type="hidden" name="referrerId" value={referrerId} />
          <div className="space-y-2">
            <Label>Referido</Label>
            <Select value={referrerId} onValueChange={setReferrerId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un referido" />
              </SelectTrigger>
              <SelectContent>
                {referrers.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="percentage">% de prima neta</Label>
            <Input
              id="percentage"
              name="percentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              required
            />
            <p className="text-xs text-muted-foreground">
              Prima neta: {formatCurrency(premium)} · Monto a pagar: {formatCurrency((premium * percentage) / 100)}
            </p>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending || !referrerId}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MarkReferralPaidButton({ policyId, referralId }: { policyId: string; referralId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(() => markReferralPaid(policyId, referralId))}
    >
      Marcar pagado
    </Button>
  );
}

export function RemoveReferralButton({ policyId, referralId }: { policyId: string; referralId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() => startTransition(() => removePolicyReferral(policyId, referralId))}
    >
      Quitar
    </Button>
  );
}
