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
  itbisRate,
  downPaymentRate,
  defaultCommissionPercentage,
}: {
  quoteId: string;
  quoteRequestId: string;
  premium: number;
  itbisRate: number;
  downPaymentRate: number;
  defaultCommissionPercentage?: number;
}) {
  const [open, setOpen] = useState(false);
  const [installments, setInstallments] = useState(1);
  const [state, formAction, pending] = useActionState(convertQuoteToPolicy, undefined);
  const { itbisAmount, totalAmount } = calculateItbis(premium, itbisRate);
  const downPayment = calculateDownPayment(premium, downPaymentRate);
  const balance = totalAmount - downPayment;
  const installmentPreview = installments > 0 ? balance / installments : 0;

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
              <p className="text-xs text-muted-foreground">ITBIS ({itbisRate}%)</p>
              <p className="font-medium">{formatCurrency(itbisAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-semibold">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
          <div className="space-y-2 rounded-md border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">
              Inicial ({downPaymentRate}% de la prima): <span className="font-medium text-foreground">{formatCurrency(downPayment)}</span>
            </p>
            <div className="space-y-1">
              <Label htmlFor="installments">Cuotas para el restante</Label>
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
            </div>
            <p className="text-xs text-muted-foreground">
              {installments} cuota{installments === 1 ? "" : "s"} de ≈ {formatCurrency(installmentPreview)} cada una (mensual)
            </p>
          </div>
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
