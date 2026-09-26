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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { convertQuoteToPolicy } from "../actions";
import { PAYMENT_FREQUENCY_LABELS } from "@/lib/labels";
import { calculateItbis } from "@/lib/tax";
import { calculateDownPayment } from "@/lib/payment-schedule";
import { formatCurrency } from "@/lib/format";

export function ConvertDialog({
  quoteId,
  quoteRequestId,
  premium,
  defaultCommissionPercentage,
}: {
  quoteId: string;
  quoteRequestId: string;
  premium: number;
  defaultCommissionPercentage?: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(convertQuoteToPolicy, undefined);
  const { itbisAmount, totalAmount } = calculateItbis(premium);
  const downPayment = calculateDownPayment(premium);

  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [nextYear] = useState(() => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Convertir a póliza</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convertir cotización en póliza</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="quoteId" value={quoteId} />
          <input type="hidden" name="quoteRequestId" value={quoteRequestId} />
          <div className="space-y-2">
            <Label htmlFor="policyNumber">Número de póliza</Label>
            <Input id="policyNumber" name="policyNumber" required />
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-md border bg-muted/40 p-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Prima</p>
              <p className="font-medium">{formatCurrency(premium)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ITBIS (16%)</p>
              <p className="font-medium">{formatCurrency(itbisAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-semibold">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Inicial (25% de la prima): <span className="font-medium text-foreground">{formatCurrency(downPayment)}</span> — el resto se
            reparte según la forma de pago elegida abajo.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Inicio de vigencia</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fin de vigencia</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={nextYear} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Forma de pago</Label>
              <Select name="paymentFrequency" defaultValue="ANNUAL">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_FREQUENCY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commissionPercentage">% Comisión</Label>
              <Input
                id="commissionPercentage"
                name="commissionPercentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={defaultCommissionPercentage}
                required
              />
            </div>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creando..." : "Crear póliza"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
