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

export function ConvertDialog({
  quoteId,
  quoteRequestId,
  defaultCommissionPercentage,
}: {
  quoteId: string;
  quoteRequestId: string;
  defaultCommissionPercentage?: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(convertQuoteToPolicy, undefined);

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
